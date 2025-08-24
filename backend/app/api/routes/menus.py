from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep
from app.models import Menus

router = APIRouter(prefix="/menus", tags=["menus"])


@router.get("/")
def read_menus(session: SessionDep) -> Sequence[Menus]:
    """
    Retrieve menus.
    """

    statement = select(Menus)
    menus = session.exec(statement).all()

    return menus
