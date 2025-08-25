from datetime import datetime, timedelta
from typing import Sequence

from apscheduler.schedulers.background import BackgroundScheduler  # type: ignore[import-untyped]
from apscheduler.triggers.cron import CronTrigger  # type: ignore[import-untyped]
from sqlmodel import Session, select, col

from app.core.config import settings
from app.core.db import engine
from app.models import (
    Restaurants,
    Orders,
    Payments,
    BankTransaction,
)
from app.lib.kb_fastlookup import get_transactions


def get_recent_bank_transactions() -> Sequence[BankTransaction]:
    # get_transactions returns list of dicts
    # like this:
    # [{'transaction_by': '', 'date': datetime.datetime(2017, 9, 11, 12, 39, 42), 'amount': 50, 'balance': 394}]
    transaction_list = get_transactions(
        bank_num=settings.BANK_ACCOUNT_NO,
        birthday=settings.BANK_ACCOUNT_BIRTHDAY,
        password=settings.BANK_ACCOUNT_PASSWORD,
        days=30,
        # start_date = '20220701' #optional, you must use 'yyyymmdd' style.
    )

    return [BankTransaction.model_validate(trs) for trs in transaction_list]


def connect_payment_to_order():
    with Session(engine) as session:
        transaction_list = get_recent_bank_transactions()
        now = datetime.now()
        before_10_minutes = now - timedelta(minutes=10)

        restaurant = session.exec(select(Restaurants)).first()
        assert restaurant is not None, "Restaurant not found"

        exist_payments = session.exec(
            select(Payments).where(
                Payments.restaurant_id == restaurant.id,
                col(Payments.created_at).in_(
                    [transaction.date for transaction in transaction_list]
                ),
            )
        ).all()
        non_exist_payments = [
            Payments.model_validate(
                transaction.to_payment_data_dict(),
                update={"restaurant_id": restaurant.id},
            )
            for transaction in transaction_list
            if not any(
                payment.amount == transaction.amount
                and payment.created_at == transaction.date
                for payment in exist_payments
            )
        ]

        if not non_exist_payments:
            return

        # 전체 결제 내역 동기화
        session.add_all(non_exist_payments)
        session.commit()

        orders_without_payment = {
            order.id: order
            for order in session.exec(
                select(Orders).where(Orders.payment_id == None)
            ).all()
        }

        for payment in non_exist_payments:
            expected_order_no = 100 - payment.amount % 100

            for order in orders_without_payment.values():
                if (
                    order.no % 100 == expected_order_no
                    and order.total_price == payment.amount + expected_order_no
                ):
                    order.payment_id = payment.id
                    session.add(order)
                    del orders_without_payment[order.id]
                    break

        # 10분동안 입금되지 않은 주문은 자동 거절 처리
        for order in orders_without_payment.values():
            if order.created_at < before_10_minutes:
                order.reject_reason = (
                    "10분동안 입금되지 않아 자동으로 주문이 거절되었습니다."
                )
                session.add(order)

        session.commit()


scheduler = BackgroundScheduler()

scheduler.add_job(
    connect_payment_to_order,
    CronTrigger(second=f"*/{settings.BANK_SYNC_INTERVAL_SECOND}"),
)
