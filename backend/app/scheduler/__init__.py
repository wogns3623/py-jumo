from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]
from apscheduler.triggers.cron import CronTrigger  # type: ignore[import-untyped]

from app.core.config import settings

from .payment import connect_payment_to_order
from .waitiing import send_waiting_expired_notification

scheduler = BackgroundScheduler()

scheduler.add_job(
    connect_payment_to_order,
    CronTrigger(second=f"*/{settings.BANK_SYNC_INTERVAL_SECOND}"),
)

scheduler.add_job(
    send_waiting_expired_notification,
    CronTrigger(minute=f"*/1"),
)
