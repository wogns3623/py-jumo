from datetime import datetime
from typing import Sequence

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from sqlmodel import Session, select, col

from app.core.config import settings
from app.models import (
    Orders,
    Payments,
    BankTransaction,
)
from app.core.db import engine
from app.lib.kb_fastlookup import get_transactions


def get_recent_bank_transactions() -> Sequence[BankTransaction]:
    # get_transactions returns list of dicts
    # like this:
    # [{'transaction_by': '', 'date': datetime.datetime(2017, 9, 11, 12, 39, 42), 'amount': 50, 'balance': 394}]
    transaction_list = get_transactions(
        bank_num=settings.BANK_ACCOUNT_NO,
        birthday=settings.BANK_ACCOUNT_BIRTHDAY,
        password=settings.BANK_ACCOUNT_PASSWORD,
        days=2,
        # start_date = '20220701' #optional, you must use 'yyyymmdd' style.
        # LOG_PATH='/Users/beomi/phantom.log' # Optional, default is os.path.devnull (no log)
    )

    return [BankTransaction.model_validate(trs) for trs in transaction_list]


def connect_payment_to_order():
    with Session(engine) as session:
        transaction_list = get_recent_bank_transactions()
        now = datetime.now()
        yesterday = now.replace(day=now.day - 1)
        before_10_minutes = now.replace(minute=now.minute - 10)

        exist_payments = session.exec(
            select(Payments)
            .where(Payments.created_at > yesterday)
            .where(
                col(Payments.created_at).in_(
                    [transaction.date for transaction in transaction_list]
                )
            )
        ).all()

        non_exist_payments = [
            transaction.to_payment()
            for transaction in transaction_list
            if not any(
                payment.amount == transaction.amount
                and payment.created_at == transaction.date
                for payment in exist_payments
            )
        ]

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
                    order.order_no % 100 == expected_order_no
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

# every 15 seconds
scheduler.add_job(connect_payment_to_order, CronTrigger(second="*/15"))
