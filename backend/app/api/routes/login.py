from datetime import timedelta

from fastapi import APIRouter, HTTPException

from app.core import security
from app.core.config import settings
from app.models import Token

router = APIRouter(tags=["login"])


@router.post("/admin/login")
def admin_login(password: str) -> Token:
    """
    OAuth2 compatible token login, get an access token for future requests
    """
    if password != settings.ADMIN_PASSWORD:
        raise HTTPException(status_code=400, detail="Incorrect password")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return Token(
        access_token=security.create_access_token(
            "admin", expires_delta=access_token_expires
        )
    )
