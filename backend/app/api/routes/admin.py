from datetime import datetime, timezone, timedelta
import uuid
from typing import Union, Sequence


from fastapi import APIRouter, HTTPException
from sqlmodel import select, col, or_

from app.api.deps import SessionDep, AdminLoginForm, CurrentAdmin, DefaultRestaurant
from app.api.services.alimtalk import send_waiting_now_seated, send_waiting_one_left
from app.core import security
from app.core.config import settings
from app.models import (
    Token,
    Restaurants,
    RestaurantUpdate,
    Menus,
    MenuUpdate,
    Tables,
    TableStatus,
    TableUpdate,
    Teams,
    AllFilter,
    Waitings,
    WaitingStatus,
    Orders,
    OrderStatus,
    OrderUpdate,
    OrderPublic,
    OrderWithPaymentInfo,
    PaymentInfo,
    OrderedMenus,
    OrderedMenuUpdate,
    OrderedMenuPublic,
    OrderedMenuForServing,
    MenuOrderStatus,
    Payments,
    KioskOrderCreate,
    Teams,
)


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
    menu = session.exec(
        select(Menus).where(
            Menus.id == menu_id,
            Menus.restaurant_id == restaurant.id,
        )
    ).first()
    if not menu:
        raise HTTPException(status_code=404, detail="메뉴를 찾을 수 없습니다.")

    menu_data_dict = menu_data.model_dump(exclude_unset=True)
    menu.sqlmodel_update(menu_data_dict)
    session.add(menu)
    session.commit()
    session.refresh(menu)

    return menu


@router.get("/tables", tags=["tables"])
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
    table = session.exec(
        select(Tables).where(
            Tables.id == table_id,
            Tables.restaurant_id == restaurant.id,
        )
    ).first()
    if not table:
        raise HTTPException(status_code=404, detail="테이블을 찾을 수 없습니다.")

    old_status = table.status
    table_data_dict = table_data.model_dump(exclude_unset=True)
    table.sqlmodel_update(table_data_dict)

    # If table status is being changed to idle, end any active team
    if old_status == TableStatus.in_use and table.status == TableStatus.idle:
        active_team = session.exec(
            select(Teams).where(Teams.table_id == table_id, Teams.ended_at == None)
        ).first()
        if active_team:
            active_team.ended_at = datetime.now()
            session.add(active_team)

    session.add(table)
    session.commit()
    session.refresh(table)

    return table


@router.get("/waitings", tags=["waitings"])
def read_waitings(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    status: Union[WaitingStatus, AllFilter] = AllFilter.all,
) -> Sequence[Waitings]:
    statement = select(Waitings).where(Waitings.restaurant_id == restaurant.id)
    if status == AllFilter.all:
        pass
    elif status == "waiting":
        statement = statement.where(
            Waitings.entered_at == None,
            Waitings.rejected_at == None,
            Waitings.notified_at == None,
        )
    elif status == "notified":
        statement = statement.where(
            Waitings.notified_at != None,
            Waitings.entered_at == None,
            Waitings.rejected_at == None,
        )
    elif status == "rejected":
        statement = statement.where(Waitings.rejected_at != None)
    elif status == "entered":
        statement = statement.where(Waitings.entered_at != None)

    waitings = session.exec(statement.order_by(col(Waitings.created_at).asc())).all()

    return waitings


@router.patch(
    "/waitings/dequeue",
    tags=["waitings"],
    response_description="웨이팅 처리",
)
def dequeue_waitings(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    dequeue_count: int = 1,
) -> Sequence[Waitings]:
    # 가장 오래된 웨이팅 중 팀이 배정되지 않은 웨이팅을 입장 처리
    waitings_to_be_processed = session.exec(
        select(Waitings)
        .where(
            Waitings.restaurant_id == restaurant.id,
            Waitings.entered_at == None,
            Waitings.rejected_at == None,
            Waitings.notified_at == None,
        )
        .order_by(col(Waitings.created_at).asc())
        .limit(dequeue_count + 1)
    ).all()

    if not waitings_to_be_processed:
        return []

    one_left_waiting = None
    if len(waitings_to_be_processed) == dequeue_count + 1:
        one_left_waiting = waitings_to_be_processed[-1]
        waitings_to_be_processed = waitings_to_be_processed[:-1]

    now = datetime.now(timezone.utc)
    for waiting in waitings_to_be_processed:
        waiting.notified_at = now
        session.add(waiting)
        send_waiting_now_seated(restaurant, waiting)

    if one_left_waiting is not None:
        session.add(one_left_waiting)
        send_waiting_one_left(restaurant, one_left_waiting)

    session.commit()

    return waitings_to_be_processed


@router.delete(
    "/waitings/{waiting_id}",
    tags=["waitings"],
    response_description="웨이팅 거절 처리",
)
def reject_waiting(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    waiting_id: uuid.UUID,
    reason: str = "관리자에 의해 웨이팅이 거절되었습니다.",
) -> dict:
    waiting = session.exec(
        select(Waitings).where(
            Waitings.id == waiting_id,
            Waitings.restaurant_id == restaurant.id,
        )
    ).first()
    if not waiting:
        raise HTTPException(status_code=404, detail="웨이팅을 찾을 수 없습니다.")
    if waiting.rejected_at:
        raise HTTPException(status_code=400, detail="이미 거절된 웨이팅입니다.")
    if waiting.entered_at:
        raise HTTPException(
            status_code=400, detail="이미 입장한 웨이팅은 거절이 불가능합니다."
        )
    waiting.rejected_at = datetime.now(timezone.utc)
    waiting.rejected_reason = reason
    session.add(waiting)
    session.commit()

    return {"detail": "웨이팅이 거절되었습니다.", "reason": reason}


@router.post("/kiosk/orders", tags=["orders"], response_model=OrderWithPaymentInfo)
def create_kiosk_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    kiosk_order_data: KioskOrderCreate,
):
    # create team for kiosk order
    kiosk_team = Teams(
        restaurant_id=restaurant.id,
        table_id=kiosk_order_data.table_id,
        phone=kiosk_order_data.phone,
    )
    session.add(kiosk_team)
    session.commit()
    session.refresh(kiosk_team)

    # create order for kiosk order
    order = Orders(team_id=kiosk_team.id, restaurant_id=restaurant.id)
    session.add(order)
    session.commit()
    session.refresh(order)

    # create ordered menus for kiosk order
    ordered_menus = [
        OrderedMenus.model_validate(
            ordered_menu_data,
            update={"order_id": order.id, "restaurant_id": restaurant.id},
        )
        for ordered_menu_data in kiosk_order_data.ordered_menus
    ]
    session.add_all(ordered_menus)
    session.commit()
    session.refresh(order)

    return OrderWithPaymentInfo.model_validate(
        order,
        update={
            "payment_info": PaymentInfo(
                bank_name="KB국민은행", bank_account_no=settings.BANK_ACCOUNT_NO
            )
        },
    )


@router.get("/orders", tags=["orders"], response_model=Sequence[OrderPublic])
def read_orders(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    status: Union[OrderStatus, AllFilter] = AllFilter.all,
):
    statement = select(Orders).where(Orders.restaurant_id == restaurant.id)
    if status == AllFilter.all:
        pass
    elif status == OrderStatus.ordered:
        statement = statement.where(
            Orders.payment_id == None,
            Orders.finished_at == None,
            Orders.reject_reason == None,
        )
    elif status == OrderStatus.paid:
        statement = statement.where(
            Orders.payment_id != None,
            Orders.finished_at == None,
            Orders.reject_reason == None,
        )
    elif status == OrderStatus.finished:
        statement = statement.where(Orders.finished_at != None)
    elif status == OrderStatus.rejected:
        statement = statement.where(Orders.reject_reason != None)

    orders = session.exec(statement.order_by(col(Orders.created_at).desc())).all()
    return orders

    # for order, payment in orders:
    #     if payment and order.payment_id == payment.id:
    #         order.payment = payment

    # return [order for order, _ in orders]


@router.get("/orders/{order_id}", tags=["orders"], response_model=OrderPublic)
def read_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    order_id: uuid.UUID,
):
    data = session.exec(
        select(Orders, Payments)
        .join(Payments, isouter=True)
        .where(
            Orders.id == order_id,
            Orders.restaurant_id == restaurant.id,
        )
    ).first()
    if not data:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")

    order, payment = data
    if payment and order.payment_id == payment.id:
        order.payment = payment

    return order


@router.patch("/orders/{order_id}", tags=["orders"])
def update_order(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    order_id: uuid.UUID,
    order_data: OrderUpdate,
) -> Orders:
    order = session.exec(
        select(Orders).where(
            Orders.id == order_id,
            Orders.restaurant_id == restaurant.id,
        )
    ).first()
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
    order = session.exec(
        select(Orders).where(
            Orders.id == order_id,
            Orders.restaurant_id == restaurant.id,
        )
    ).first()
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
    ordered_menu = session.exec(
        select(OrderedMenus).where(
            OrderedMenus.order_id == order_id,
            OrderedMenus.menu_id == menu_id,
            OrderedMenus.restaurant_id == restaurant.id,
        )
    ).first()
    if not ordered_menu:
        raise HTTPException(status_code=404, detail="주문을 찾을 수 없습니다.")
    order_data_dict = order_data.model_dump(exclude_unset=True)
    ordered_menu.sqlmodel_update(order_data_dict)
    session.add(ordered_menu)
    session.commit()
    session.refresh(ordered_menu)

    if all(
        om.status == MenuOrderStatus.served or om.status == MenuOrderStatus.rejected
        for om in ordered_menu.order.ordered_menus
    ):
        ordered_menu.order.finished_at = datetime.now(timezone.utc)
        session.add(ordered_menu.order)
        session.commit()

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
    ordered_menu = session.exec(
        select(OrderedMenus).where(
            OrderedMenus.order_id == order_id,
            OrderedMenus.menu_id == menu_id,
            OrderedMenus.restaurant_id == restaurant.id,
        )
    ).first()
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


@router.get(
    "/serving/ordered-menus",
    tags=["serving"],
    response_model=Sequence[OrderedMenuForServing],
)
def get_cooked_ordered_menus(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
):
    """조리가 완료된 주문 메뉴 목록 조회 (서빙 대기중)"""
    # OrderedMenus와 관련 정보를 join하여 가져오기
    ordered_menus_data = session.exec(
        select(OrderedMenus, Orders, Teams, Tables)
        .join(Orders, OrderedMenus.order_id == Orders.id)  # type: ignore
        .join(Teams)
        .join(Tables)
        .where(
            OrderedMenus.restaurant_id == restaurant.id,
            OrderedMenus.cook_started_at != None,  # 조리 시작된 메뉴
            OrderedMenus.served_at == None,  # 아직 서빙되지 않은 메뉴
            OrderedMenus.reject_reason == None,  # 거절되지 않은 메뉴
            Teams.ended_at == None,  # 활성 팀만
        )
        .order_by(
            col(Orders.created_at).asc()
        )  # 주문 생성 시간 순으로 (오래된 주문 먼저)
    ).all()

    # 데이터 변환
    result = []
    for ordered_menu, order, team, table in ordered_menus_data:
        result.append(
            OrderedMenuForServing(
                **ordered_menu.model_dump(),
                order_no=order.no,
                table_no=table.no,
                status=ordered_menu.status,
                menu=ordered_menu.menu,
            )
        )

    return result


@router.patch("/serving/ordered-menus/{ordered_menu_id}/serve", tags=["serving"])
def serve_ordered_menu(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    ordered_menu_id: uuid.UUID,
) -> OrderedMenus:
    """주문 메뉴 서빙 완료 처리"""
    ordered_menu = session.exec(
        select(OrderedMenus).where(
            OrderedMenus.id == ordered_menu_id,
            OrderedMenus.restaurant_id == restaurant.id,
        )
    ).first()

    if not ordered_menu:
        raise HTTPException(status_code=404, detail="주문 메뉴를 찾을 수 없습니다.")

    if ordered_menu.served_at is not None:
        raise HTTPException(status_code=400, detail="이미 서빙 완료된 메뉴입니다.")

    if ordered_menu.cook_started_at is None:
        raise HTTPException(status_code=400, detail="조리가 시작되지 않은 메뉴입니다.")

    if ordered_menu.reject_reason is not None:
        raise HTTPException(status_code=400, detail="거절된 메뉴는 서빙할 수 없습니다.")

    # 서빙 완료 처리
    ordered_menu.served_at = datetime.now(timezone.utc)
    session.add(ordered_menu)

    # 주문의 모든 메뉴가 서빙 완료되었는지 확인
    all_ordered_menus = session.exec(
        select(OrderedMenus).where(
            OrderedMenus.order_id == ordered_menu.order_id,
            OrderedMenus.reject_reason == None,  # 거절되지 않은 메뉴만
        )
    ).all()

    # 모든 메뉴가 서빙 완료되었으면 주문 완료 처리
    if all(menu.served_at is not None for menu in all_ordered_menus):
        ordered_menu.order.finished_at = datetime.now(timezone.utc)
        session.add(ordered_menu.order)

    session.commit()
    session.refresh(ordered_menu)

    return ordered_menu


@router.get("/payments", tags=["payments"])
def read_payments(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
) -> Sequence[Payments]:
    payments = session.exec(
        select(Payments)
        .where(Payments.restaurant_id == restaurant.id)
        .order_by(col(Payments.created_at).desc())
    ).all()

    return payments


@router.patch("/payments/{payment_id}/refund", tags=["payments"])
def refund_payment(
    session: SessionDep,
    admin: CurrentAdmin,
    restaurant: DefaultRestaurant,
    payment_id: uuid.UUID,
) -> Payments:
    payment = session.exec(
        select(Payments).where(
            Payments.id == payment_id,
            Payments.restaurant_id == restaurant.id,
        )
    ).first()
    if not payment:
        raise HTTPException(status_code=404, detail="결제 내역을 찾을 수 없습니다.")
    if payment.refunded_at:
        raise HTTPException(status_code=400, detail="이미 환불된 결제 내역입니다.")

    payment.refunded_at = datetime.now(timezone.utc)
    session.add(payment)
    session.commit()
    session.refresh(payment)

    return payment
