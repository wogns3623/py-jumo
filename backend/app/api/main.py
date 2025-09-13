from fastapi import APIRouter

from app.api.routes import admin, menus, orders, restaurants, utils, waitings

# from app.core.config import settings

api_router = APIRouter()
api_router.include_router(admin.router)
api_router.include_router(menus.router)
api_router.include_router(orders.router)
api_router.include_router(restaurants.router)
api_router.include_router(utils.router)
api_router.include_router(waitings.router)


# if settings.ENVIRONMENT == "local":
#     api_router.include_router(private.router)
