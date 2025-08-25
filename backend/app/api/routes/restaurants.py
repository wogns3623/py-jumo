from fastapi import APIRouter

from app.api.deps import SessionDep, DefaultRestaurant
from app.models import Restaurants

router = APIRouter(prefix="/restaurants", tags=["restaurants"])


@router.get("/")
def read_restaurants(session: SessionDep, restaurant: DefaultRestaurant) -> Restaurants:
    """
    Retrieve restaurant information.
    """

    return restaurant
