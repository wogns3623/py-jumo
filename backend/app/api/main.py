from fastapi import APIRouter

from app.api.routes import teams, login, menus, orders, utils

# from app.core.config import settings

api_router = APIRouter()
api_router.include_router(teams.router)
api_router.include_router(login.router)
api_router.include_router(menus.router)
api_router.include_router(orders.router)
api_router.include_router(utils.router)


# if settings.ENVIRONMENT == "local":
#     api_router.include_router(private.router)
