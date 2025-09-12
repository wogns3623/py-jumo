from datetime import datetime, timedelta, timezone
from typing import Sequence

# from contextlib import contextmanager

from sqlmodel import Session, select, col

from app.api.services.alimtalk import send_waiting_calcelled
from app.core.config import settings
from app.core.db import engine, session_decor
from app.models import Restaurants, Waitings


@session_decor(engine)
def send_waiting_expired_notification(session: Session):
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    after_10_minutes = now - timedelta(minutes=10)

    restaurant = session.exec(select(Restaurants)).first()
    assert restaurant is not None, "Restaurant not found"

    expired_waitings = session.exec(
        select(Waitings).where(
            Waitings.restaurant_id == restaurant.id,
            Waitings.notified_at != None,
            Waitings.entered_at == None,
            Waitings.rejected_at == None,
            col(Waitings.notified_at) < after_10_minutes,
        )
    ).all()

    for waiting in expired_waitings:
        # update rejected_at
        waiting.rejected_at = now
        waiting.rejected_reason = "입장 시간 초과"
        session.add(waiting)
        # send notification
        send_waiting_calcelled(restaurant, waiting)

    session.commit()
    print(f"Processed expired waitings: {len(expired_waitings)}")
