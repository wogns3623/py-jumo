from collections.abc import Generator
from typing import Annotated

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
from pydantic import ValidationError
from sqlmodel import Session, select

from app.core import security
from app.core.config import settings
from app.core.db import engine
from app.models import TokenPayload, User, AdminUser, Restaurants


reusable_oauth2 = OAuth2PasswordBearer(
    tokenUrl=f"{settings.API_V1_STR}/admin/login", scheme_name="JWT"
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session


SessionDep = Annotated[Session, Depends(get_db)]
AdminTokenDep = Annotated[str, Depends(reusable_oauth2)]
AdminLoginForm = Annotated[OAuth2PasswordRequestForm, Depends()]


def get_admin_user(session: SessionDep, token: AdminTokenDep) -> User:
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[security.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
    except (InvalidTokenError, ValidationError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )

    # user = session.get(User, token_data.sub)
    # if not user:
    #     raise HTTPException(status_code=404, detail="User not found")
    # if not user.is_active:
    #     raise HTTPException(status_code=400, detail="Inactive user")
    # return user

    return AdminUser(username=token_data.sub)


CurrentAdmin = Annotated[User, Depends(get_admin_user)]


def get_default_restaurant(session: SessionDep) -> Restaurants:
    restaurant = session.exec(select(Restaurants)).first()
    assert restaurant is not None, "Restaurant not found"
    return restaurant


DefaultRestaurant = Annotated[Restaurants, Depends(get_default_restaurant)]
