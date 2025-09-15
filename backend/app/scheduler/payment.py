from datetime import datetime, timedelta, timezone
from typing import Sequence

from sqlmodel import Session, select, col

from app.core.config import settings
from app.core.db import engine, session_decor
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

    # injected = BankTransaction(
    #     transaction_by="김재훈",
    #     date=datetime.now(timezone.utc),
    #     amount=31966,
    #     balance=0,
    # )
    return [
        # injected,
        *[BankTransaction.model_validate(trs) for trs in transaction_list],
    ]


@session_decor(engine)
def connect_payment_to_order(session: Session) -> None:
    transaction_list = get_recent_bank_transactions()
    # print("transaction_list:", transaction_list)
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    before_10_minutes = now - timedelta(minutes=10)

    restaurant = session.exec(select(Restaurants)).first()
    assert restaurant is not None, "Restaurant not found"

    exist_payments = session.exec(
        select(Payments).where(
            Payments.restaurant_id == restaurant.id,
            col(Payments.created_at).in_(
                [
                    (
                        transaction.date.replace(tzinfo=timezone.utc)
                        if transaction.date.tzinfo is None
                        else transaction.date
                    )
                    for transaction in transaction_list
                ]
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
    print(f"Inserted {len(non_exist_payments)} new payments")

    orders_without_payment = {
        order.id: order
        for order in session.exec(
            select(Orders).where(
                Orders.payment_id == None, Orders.reject_reason == None
            )
        ).all()
    }

    payment_attached_orders = []
    for payment in non_exist_payments:
        expected_order_no = 100 - payment.amount % 100
        for order in orders_without_payment.values():
            if (
                order.created_at < payment.created_at
                and order.no % 100 == expected_order_no  # type: ignore
                and order.total_price == payment.amount + expected_order_no
            ):
                order.payment_id = payment.id
                payment_attached_orders.append(order)
                del orders_without_payment[order.id]
                break

    if len(payment_attached_orders) > 0:
        session.add_all(payment_attached_orders)
        session.commit()
        print(f"Attached payments to orders: {len(payment_attached_orders)}")

    # 10분동안 입금되지 않은 주문은 자동 거절 처리
    if len(orders_without_payment) > 0:
        for order in orders_without_payment.values():
            if order.created_at < before_10_minutes:
                order.reject_reason = (
                    "10분동안 입금되지 않아 자동으로 주문이 거절되었습니다."
                )
                session.add(order)

        session.commit()
        print(
            f"Processed orders without payment after 10 minutes: {len(orders_without_payment)}"
        )
