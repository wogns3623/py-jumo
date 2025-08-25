from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep, DefaultRestaurant
from app.models import Waitings, WaitingCreate, WaitingFind

router = APIRouter(prefix="/waitings", tags=["waitings"])


@router.get("/")
def enqueue_waitings(
    session: SessionDep, restaurant: DefaultRestaurant, waiting_data: WaitingCreate
) -> Waitings:
    """
    Create new item.
    """
    waiting = Waitings.model_validate(
        waiting_data, update={"restaurant_id": restaurant.id}
    )
    session.add(waiting)
    session.commit()
    session.refresh(waiting)
    return waiting


@router.get("/")
def read_watings(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    waiting_data: WaitingFind,
) -> Sequence[Waitings]:
    waitings = session.exec(
        select(Waitings).where(
            Waitings.restaurant_id == restaurant.id,
            Waitings.name == waiting_data.name,
            Waitings.phone == waiting_data.phone,
        )
    ).all()

    return waitings
