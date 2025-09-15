from typing import Sequence
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import select, col

from app.api.deps import SessionDep, DefaultRestaurant
from app.core.config import settings
from app.models import (
    Teams,
    Tables,
    TableOrderCreate,
    Orders,
    OrderedMenus,
    Menus,
    OrderWithPaymentInfo,
    PaymentInfo,
    TableStatus,
)

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("", response_model=OrderWithPaymentInfo)
def create_order(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    order_data: TableOrderCreate,
) -> OrderWithPaymentInfo:
    """테이블 ID로 직접 주문 생성 (필요시 팀도 함께 생성)"""

    # 1. 해당 테이블에 활성 팀이 있는지 확인 (동시성 제어)
    existing_team = session.exec(
        select(Teams)
        .where(
            Teams.restaurant_id == restaurant.id,
            Teams.table_id == order_data.table_id,
            Teams.ended_at == None,
        )
        .with_for_update()
    ).first()

    if existing_team:
        # 기존 활성 팀이 있으면 해당 팀 사용
        team = existing_team
    else:
        # 새 팀 생성
        team = Teams(
            restaurant_id=restaurant.id,
            table_id=order_data.table_id,
        )
        session.add(team)
        session.flush()  # team.id 생성을 위해 flush

    # 2. 주문 생성
    order = Orders(team_id=team.id, restaurant_id=restaurant.id)
    session.add(order)
    session.flush()  # order.id 생성을 위해 flush

    menus = session.exec(
        select(Menus).where(Menus.restaurant_id == restaurant.id)
    ).all()
    menu_dict = {menu.id: menu for menu in menus}

    # 3. 주문 메뉴들 생성 (amount 수량만큼 개별 레코드 생성)
    ordered_menus = []
    for ordered_menu_data in order_data.ordered_menus:
        for _ in range(ordered_menu_data.amount):
            ordered_menu = OrderedMenus(
                order_id=order.id,
                restaurant_id=restaurant.id,
                menu_id=ordered_menu_data.menu_id,
                cooked=menu_dict[ordered_menu_data.menu_id].is_instant_cook,
            )
            ordered_menus.append(ordered_menu)
    session.add_all(ordered_menus)

    # 4. 테이블 상태 업데이트 (idle -> in_use)
    table = session.get(Tables, order_data.table_id)
    if table and table.status == TableStatus.idle:
        table.status = TableStatus.in_use
        session.add(table)

    # 5. 모든 변경사항 커밋
    session.commit()
    session.refresh(order)
    session.refresh(team)

    return OrderWithPaymentInfo.model_validate(
        order,
        update={
            "payment_info": PaymentInfo(
                bank_name="KB국민은행", bank_account_no=settings.BANK_ACCOUNT_NO
            ),
        },
    )


@router.get("/table/{table_id}", response_model=Sequence[Orders])
def read_orders_by_table(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    table_id: uuid.UUID,
):
    """테이블의 모든 주문 내역 조회 (활성 팀의 주문들)"""

    # 해당 테이블의 활성 팀 찾기
    active_team = session.exec(
        select(Teams).where(
            Teams.restaurant_id == restaurant.id,
            Teams.table_id == table_id,
            Teams.ended_at == None,
        )
    ).first()

    if not active_team:
        return []

    # 팀의 주문들 조회
    orders = session.exec(
        select(Orders)
        .where(Orders.restaurant_id == restaurant.id, Orders.team_id == active_team.id)
        .order_by(col(Orders.created_at).desc())
    ).all()

    return orders
