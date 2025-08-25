from typing import Sequence
import uuid

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep, DefaultRestaurant
from app.models import Teams, TeamCreate, Orders

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/")
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


@router.get("/{team_id}/orders/", tags=["orders"])
def read_orders_by_team(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    team_id: uuid.UUID,
) -> Sequence[Orders]:
    orders = session.exec(
        select(Orders)
        .where(Orders.restaurant_id == restaurant.id)
        .where(Orders.team_id == team_id)
    ).all()

    return orders
