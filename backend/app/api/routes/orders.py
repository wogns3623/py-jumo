from fastapi import APIRouter
from sqlmodel import select

from app.api.deps import SessionDep, DefaultRestaurant
from app.core.config import settings
from app.models import Orders, OrderCreate, OrderedMenus, OrderWithPaymentMethod

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/orders/")
def create_order(
    session: SessionDep,
    restaurant: DefaultRestaurant,
    order_data: OrderCreate,
) -> OrderWithPaymentMethod:

    order = Orders.model_validate(order_data, update={"restaurant_id": restaurant.id})
    session.add(order)
    session.commit()
    session.refresh(order)

    session.add_all(
        [
            OrderedMenus.model_validate(
                menu_order,
                update={"order_id": order.id, "restaurant_id": restaurant.id},
            )
            for menu_order in order_data.menu_orders
        ]
    )
    session.commit()
    session.refresh(order)

    return OrderWithPaymentMethod(
        order=order,
        bank_name="국민은행",
        bank_account_no=settings.BANK_ACCOUNT_NO,
    )
