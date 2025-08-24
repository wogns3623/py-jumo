from typing import Sequence
import uuid

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import Teams, TeamCreate, Orders

router = APIRouter(prefix="/teams", tags=["teams"])


@router.get("/")
def create_team(session: SessionDep, team_data: TeamCreate) -> Teams:
    """
    Create new item.
    """
    team = Teams.model_validate(team_data)
    session.add(team)
    session.commit()
    session.refresh(team)
    return team


@router.get("/{team_id}/orders/", tags=["orders"])
def read_orders_by_team(
    session: SessionDep,
    team_id: uuid.UUID,
) -> Sequence[Orders]:
    orders = session.exec(select(Orders).where(Orders.team_id == team_id)).all()

    return orders
