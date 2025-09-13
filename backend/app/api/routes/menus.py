from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep, DefaultRestaurant
from app.models import Menus, MenuPublic

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("", response_model=Sequence[MenuPublic])
def read_menus(
    session: SessionDep,
    restaurant: DefaultRestaurant,
):
    statement = select(Menus).where(Menus.restaurant_id == restaurant.id)
    menus = session.exec(statement).all()

    return menus
