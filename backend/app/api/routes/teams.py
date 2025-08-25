from typing import Sequence
import uuid

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep, DefaultRestaurant
from app.core.config import settings
from app.models import (
    Teams,
    TeamCreate,
    Orders,
    OrderCreate,
    OrderPublic,
    OrderedMenus,
    OrderWithPaymentMethod,
)

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/")
def create_team(
    session: SessionDep, restaurant: DefaultRestaurant, team_data: TeamCreate
) -> Teams:
    """
    Create new item.
    """
    team = Teams.model_validate(team_data, update={"restaurant_id": restaurant.id})
    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.get("/{team_id}/orders/", tags=["orders"], response_model=Sequence[OrderPublic])
def read_orders_by_team(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    team_id: uuid.UUID,
):
    orders = session.exec(
        select(Orders).where(
            Orders.restaurant_id == restaurant.id, Orders.team_id == team_id
        )
    ).all()

    return orders


@router.post("/{team_id}/orders/", tags=["orders"])
def create_order(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    team_id: uuid.UUID,
    order_data: OrderCreate,
) -> OrderWithPaymentMethod:
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
    session.commit()
    session.refresh(order)

    return OrderWithPaymentMethod(
        order=order,
        bank_name="국민은행",
        bank_account_no=settings.BANK_ACCOUNT_NO,
    )
