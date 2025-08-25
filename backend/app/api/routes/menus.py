from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep, DefaultRestaurant
from app.models import Menus

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("/")
def read_menus(
    session: SessionDep,
    restaurant: DefaultRestaurant,
) -> Sequence[Menus]:
    """
    Retrieve menus.
    """

    statement = select(Menus).where(Menus.restaurant_id == restaurant.id)
    menus = session.exec(statement).all()

    return menus
