import uuid

from fastapi import APIRouter, HTTPException

from app.api.deps import SessionDep
from app.models import (
    Orders,
    OrderUpdate,
)

router = APIRouter(prefix="/admin", tags=["admin"])


@router.post("/admin/orders/{order_id}")
def update_order(
    session: SessionDep,
    order_id: uuid.UUID,
    order_data: OrderUpdate,
) -> Orders:

    order = session.get(Orders, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    order_data_dict = order_data.model_dump(exclude_unset=True)
    order.sqlmodel_update(order_data_dict)
    session.add(order)
    session.commit()
    session.refresh(order)

    return order


@router.delete("/admin/orders/{order_id}")
def reject_order(
    session: SessionDep,
    order_id: uuid.UUID,
    reason: str = "관리자에 의해 주문이 거절되었습니다.",
) -> dict:

    order = session.get(Orders, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.payment_id is not None:
        raise HTTPException(status_code=400, detail="Cannot reject paid order")
    order.reject_reason = reason
    session.add(order)
    session.commit()

    return {"detail": "Order rejected", "reason": reason}
