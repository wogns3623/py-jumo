from typing import Sequence
import uuid

from fastapi import APIRouter, HTTPException
from sqlmodel import select, col

from app.api.deps import SessionDep, DefaultRestaurant
from app.core.config import settings
from app.models import (
    Teams,
    TeamPublic,
    TeamCreate,
    Orders,
    OrderCreate,
    PaymentInfo,
    OrderPublic,
    OrderedMenus,
    OrderWithPaymentInfo,
    TableStatus,
)

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("", response_model=TeamPublic)
def create_team(
    session: SessionDep, restaurant: DefaultRestaurant, team_data: TeamCreate
):
    exist_team = session.exec(
        select(Teams).where(
            Teams.restaurant_id == restaurant.id,
            Teams.table_id == team_data.table_id,
            Teams.ended_at == None,
        )
    ).first()

    if exist_team:
        return exist_team

    team = Teams.model_validate(team_data, update={"restaurant_id": restaurant.id})
    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.get("/{team_id}/orders", tags=["orders"], response_model=Sequence[OrderPublic])
def read_orders_by_team(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    team_id: uuid.UUID,
):
    orders = session.exec(
        select(Orders)
        .where(Orders.restaurant_id == restaurant.id, Orders.team_id == team_id)
        .order_by(col(Orders.created_at).desc())
    ).all()

    return [
        OrderPublic.model_validate(
            order,
            update={
                "payment_info": PaymentInfo(
                    bank_name="KB국민은행", bank_account_no=settings.BANK_ACCOUNT_NO
                )
            },
        )
        for order in orders
    ]


@router.post("/{team_id}/orders", tags=["orders"])
def create_order(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    team_id: uuid.UUID,
    order_data: OrderCreate,
) -> OrderWithPaymentInfo:
    # 팀 조회 (테이블 정보 포함) - 활성 팀만
    team = session.exec(
        select(Teams).where(Teams.id == team_id, Teams.ended_at == None)
    ).first()
    if not team:
        raise HTTPException(status_code=404, detail="Active team not found")
    
    order = Orders(team_id=team_id, restaurant_id=restaurant.id)
    session.add(order)
    session.commit()
    session.refresh(order)

    ordered_menus = [
        OrderedMenus.model_validate(
            ordered_menu_data,
            update={"order_id": order.id, "restaurant_id": restaurant.id},
        )
        for ordered_menu_data in order_data.ordered_menus
    ]
    session.add_all(ordered_menus)
    
    # 테이블이 idle 상태라면 in_use로 변경
    if team.table.status == TableStatus.idle:
        team.table.status = TableStatus.in_use
        session.add(team.table)
    
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
