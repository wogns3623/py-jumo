from datetime import datetime, timezone
from typing import Sequence

from fastapi import APIRouter
from sqlmodel import select, func, col

from app.api.deps import SessionDep, DefaultRestaurant
from app.api.services.alimtalk import send_waiting_registered
from app.core.config import settings
from app.models import Waitings, WaitingCreate, WaitingFind

router = APIRouter(prefix="/waitings", tags=["waitings"])


@router.post("")
def enqueue_waitings(
    session: SessionDep, restaurant: DefaultRestaurant, waiting_data: WaitingCreate
) -> Waitings:
    exist_waiting = session.exec(
        select(Waitings).where(
            Waitings.restaurant_id == restaurant.id,
            Waitings.name == waiting_data.name,
            Waitings.phone == waiting_data.phone,
            Waitings.entered_at == None,
        )
    ).first()
    if exist_waiting:
        raise Exception("Already in the waiting list")
    waiting = Waitings.model_validate(
        waiting_data, update={"restaurant_id": restaurant.id}
    )
    session.add(waiting)
    session.commit()
    session.refresh(waiting)

    remaining_waiting_count = session.exec(
        select(func.count(col(Waitings.id))).where(
            Waitings.restaurant_id == restaurant.id,
            Waitings.entered_at == None,
            Waitings.rejected_at == None,
            Waitings.created_at < waiting.created_at,
        )
    ).one()

    send_waiting_registered(restaurant, waiting, remaining_waiting_count)

    return waiting


@router.get("")
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
            Waitings.entered_at == None,
        )
    ).all()

    return waitings


@router.delete("")
def cancel_waiting(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    waiting_data: WaitingFind,
):
    waiting = session.exec(
        select(Waitings).where(
            Waitings.restaurant_id == restaurant.id,
            Waitings.name == waiting_data.name,
            Waitings.phone == waiting_data.phone,
            Waitings.entered_at == None,
        )
    ).first()

    if waiting:
        waiting.rejected_at = datetime.now(timezone.utc)
        waiting.rejected_reason = "사용자 취소"
        session.commit()
    return {"message": "Waiting cancelled"}
