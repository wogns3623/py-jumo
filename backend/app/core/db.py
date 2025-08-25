from sqlmodel import Session, create_engine, select

from app.core.config import settings
from app.models import *

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    # user = session.exec(
    #     select(User).where(User.email == settings.FIRST_SUPERUSER)
    # ).first()
    # if not user:
    #     user_in = UserCreate(
    #         email=settings.FIRST_SUPERUSER,
    #         password=settings.FIRST_SUPERUSER_PASSWORD,
    #         is_superuser=True,
    #     )
    #     user = crud.create_user(session=session, user_create=user_in)

    restaurant = session.exec(select(Restaurants)).first()
    if restaurant:
        return

    restaurant = Restaurants(
        name="시리야 장어랑 대하해줘",
        open_time="18:00",
        close_time="00:00",
    )
    session.add(restaurant)
    session.commit()
    session.refresh(restaurant)

    # tables
    session.add_all(
        [Tables(no=i, restaurant_id=restaurant.id) for i in range(1, 35)],
    )

    # menus
    session.add_all(
        [
            Menus(
                restaurant_id=restaurant.id,
                name="장어",
                desc="장어구이 2마리",
                price=30000,
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="대하",
                desc="대하 소금구이 20마리",
                price=30000,
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="콜라",
                desc="코카-콜라 1.25L",
                price=30000,
            ),
        ]
    )
    session.commit()
