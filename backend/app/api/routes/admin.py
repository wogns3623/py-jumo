from datetime import timedelta
import uuid
from typing import Union, Sequence


from fastapi import APIRouter, HTTPException
from sqlmodel import select, col

from app.api.deps import SessionDep, CurrentAdmin, DefaultRestaurant, KakaoAlimtalkDep
from app.core import security
from app.core.config import settings
from app.models import *

from app.lib.kakao_alimtalk import KakaoAlimtalkRequest, KakaoAlimtalkRequestMessage

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/login", tags=["login"])
def admin_login(form_data: AdminLoginForm) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    if form_data.password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=400, detail="Incorrect password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            form_data.username, expires_delta=access_token_expires
        )
    )


@router.patch("/restaurants", tags=["admin"])
def update_restaurant(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    restaurant_data: RestaurantUpdate,
) -> Restaurants:
    restaurant_data_dict = restaurant_data.model_dump(exclude_unset=True)
    restaurant.sqlmodel_update(restaurant_data_dict)
    session.add(restaurant)
    session.commit()
    session.refresh(restaurant)

    return restaurant


@router.patch("/menus/{menu_id}", tags=["menus"])
def update_menu(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    menu_id: uuid.UUID,
    menu_data: MenuUpdate,
) -> Menus:

    menu = session.get(Menus, {"id": menu_id, "restaurant_id": restaurant.id})
    if not menu:
        raise HTTPException(status_code=404, detail="메뉴를 찾을 수 없습니다.")

    menu_data_dict = menu_data.model_dump(exclude_unset=True)
    menu.sqlmodel_update(menu_data_dict)
    session.add(menu)
    session.commit()
    session.refresh(menu)

    return menu


@router.get("/tables/", tags=["tables"])
def read_tables(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    status: Union[TableStatus, AllFilter] = AllFilter.all,
) -> Sequence[Tables]:
    statement = select(Tables).where(Tables.restaurant_id == restaurant.id)
    if status != AllFilter.all:
        statement = statement.where(Tables.status == status)

    tables = session.exec(statement.order_by(col(Tables.no).asc())).all()
    return tables


@router.patch("/tables/{table_id}", tags=["tables"])
def update_table(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    table_id: uuid.UUID,
    table_data: TableUpdate,
) -> Tables:
    table = session.get(Tables, {"id": table_id, "restaurant_id": restaurant.id})
    if not table:
        raise HTTPException(status_code=404, detail="테이블을 찾을 수 없습니다.")
    table_data_dict = table_data.model_dump(exclude_unset=True)
    table.sqlmodel_update(table_data_dict)
    session.add(table)
    session.commit()
    session.refresh(table)

    return table


@router.patch(
    "/waitings/dequeue",
    tags=["waitings"],
    response_description="입장 처리된 웨이팅 목록",
)
def dequeue_waitings(
    session: SessionDep,
    admin: CurrentAdmin,
    alimtalk: KakaoAlimtalkDep,
    restaurant: DefaultRestaurant,
    dequeue_count: int = 1,
) -> Sequence[Waitings]:
    # 가장 오래된 웨이팅 중 팀이 배정되지 않은 웨이팅을 입장 처리
    waitings_to_be_processed = session.exec(
        select(Waitings)
        .where(Waitings.restaurant_id == restaurant.id, Waitings.entered_at == None)
        .order_by(col(Waitings.created_at).asc())
        .limit(dequeue_count)
    ).all()

    if waitings_to_be_processed:
        now = datetime.now(timezone.utc)
        for waiting in waitings_to_be_processed:
            waiting.entered_at = now
            session.add(waiting)

            # TODO: 템플릿 만들면 그거대로 수정
            alimtalk.send_message(
                {
                    "plusFriendId": "@acorn_soft",
                    "templateCode": "waiting_available",
                    "messages": [
                        {
                            "to": waiting.phone,
                            "content": f"{restaurant.name}에 입장하실 수 있습니다.\n감사합니다.",
                            "useSmsFailover": True,
                            "failoverConfig": {
                                "type": "LMS",
                                "from_": "01047563191",
                                "subject": "입장이 가능합니다",
                                "content": f"{restaurant.name}에 입장하실 수 있습니다.\n감사합니다.",
                            },
                        }
                    ],
                }
            )
        session.commit()

    return waitings_to_be_processed


@router.get("/orders/", tags=["orders"])
def read_orders(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    status: Union[OrderStatus, AllFilter] = AllFilter.all,
) -> Sequence[Orders]:
    statement = select(Orders).where(Orders.restaurant_id == restaurant.id)
    if status == AllFilter.all:
        pass
    elif status == OrderStatus.ordered:
        statement = statement.where(
            (Orders.payment_id == None)
            & (Orders.finished_at == None)
            & (Orders.reject_reason == None)
        )
    elif status == OrderStatus.paid:
        statement = statement.where(
            (Orders.payment_id != None) & (Orders.finished_at == None)
        )
    elif status == OrderStatus.finished:
        statement = statement.where(Orders.finished_at != None)
    elif status == OrderStatus.rejected:
        statement = statement.where(Orders.reject_reason != None)

    orders = session.exec(statement.order_by(col(Orders.created_at).desc())).all()

    return orders


@router.patch("/orders/{order_id}", tags=["orders"])
def update_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    order_id: uuid.UUID,
    order_data: OrderUpdate,
) -> Orders:

    order = session.get(Orders, {"id": order_id, "restaurant_id": restaurant.id})
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    order_data_dict = order_data.model_dump(exclude_unset=True)
    order.sqlmodel_update(order_data_dict)
    session.add(order)
    session.commit()
    session.refresh(order)

    return order


@router.delete("/orders/{order_id}", tags=["orders"])
def reject_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    order_id: uuid.UUID,
    reason: str = "관리자에 의해 주문이 거절되었습니다.",
) -> dict:

    order = session.get(Orders, {"id": order_id, "restaurant_id": restaurant.id})
    if not order:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    if order.status == OrderStatus.rejected:
        raise HTTPException(status_code=400, detail="이미 거절된 주문입니다.")
    if order.status == OrderStatus.paid:
        raise HTTPException(
            status_code=400, detail="이미 결제된 주문은 거절이 불가능합니다."
        )
    if order.status == OrderStatus.finished:
        raise HTTPException(
            status_code=400, detail="이미 완료된 주문은 거절이 불가능합니다."
        )
    order.reject_reason = reason
    session.add(order)
    session.commit()

    return {"detail": "주문이 거절되었습니다.", "reason": reason}


@router.patch("/orders/{order_id}/menus/{menu_id}", tags=["orders"])
def update_menu_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    order_id: uuid.UUID,
    menu_id: uuid.UUID,
    order_data: OrderedMenuUpdate,
) -> OrderedMenus:

    ordered_menu = session.get(
        OrderedMenus,
        {"order_id": order_id, "menu_id": menu_id, "restaurant_id": restaurant.id},
    )
    if not ordered_menu:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    order_data_dict = order_data.model_dump(exclude_unset=True)
    ordered_menu.sqlmodel_update(order_data_dict)
    session.add(ordered_menu)
    session.commit()
    session.refresh(ordered_menu)

    return ordered_menu


@router.delete("/orders/{order_id}/menus/{menu_id}", tags=["orders"])
def reject_menu_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    order_id: uuid.UUID,
    menu_id: uuid.UUID,
    reason: str = "관리자에 의해 메뉴 주문이 거절되었습니다.",
) -> dict:

    ordered_menu = session.get(
        OrderedMenus,
        {"order_id": order_id, "menu_id": menu_id, "restaurant_id": restaurant.id},
    )
    if not ordered_menu:
        raise HTTPException(status_code=404, detail="메뉴 주문을 찾을 수 없습니다.")
    if ordered_menu.status is MenuOrderStatus.rejected:
        raise HTTPException(status_code=400, detail="이미 거절된 메뉴입니다.")
    if ordered_menu.status is MenuOrderStatus.served:
        raise HTTPException(
            status_code=400, detail="이미 서빙된 메뉴는 거절이 불가능합니다."
        )
    ordered_menu.reject_reason = reason
    session.add(ordered_menu)
    session.commit()

    return {"detail": "메뉴 주문이 거절되었습니다.", "reason": reason}
