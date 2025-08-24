from typing import Sequence
import uuid

from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep
from app.core.config import settings
from app.models import Orders, OrderCreate, MenuOrders, OrderWithPaymentInfo

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/orders/")
def create_order(
    session: SessionDep,
    order_data: OrderCreate,
) -> OrderWithPaymentInfo:

    order = Orders.model_validate(order_data)
    session.add(order)
    session.commit()
    session.refresh(order)

    session.add_all(
        [
            MenuOrders.model_validate(menu_order, update={"order_id": order.id})
            for menu_order in order_data.menu_orders
        ]
    )
    session.commit()
    session.refresh(order)

    return OrderWithPaymentInfo(
        order=order,
        bank_name="국민은행",
        bank_account_no=settings.BANK_ACCOUNT_NO,
    )
