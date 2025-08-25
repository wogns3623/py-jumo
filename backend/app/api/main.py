from fastapi import APIRouter

from app.api.routes import admin, teams, menus, orders, utils

# from app.core.config import settings

api_router = APIRouter()
api_router.include_router(admin.router)
api_router.include_router(teams.router)
api_router.include_router(menus.router)
api_router.include_router(orders.router)
api_router.include_router(utils.router)


# if settings.ENVIRONMENT == "local":
#     api_router.include_router(private.router)
