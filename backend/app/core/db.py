from sqlmodel import Session, create_engine, select
from sqlalchemy import Engine

from app.core.config import settings
from app.models import Restaurants, Tables, Menus

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
                name="에겐 대하 : 안녕하새우",
                desc="엄청난 대하가 몇 마리 ? 20마리 !",
                price=32000,
                category="메인메뉴",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="테토 장어 : 왜 불러.",
                desc="비키거라. 대하에 꿀리지 않는 테토 장어 두 마리 나가신다.",
                price=32000,
                category="메인메뉴",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="장어덮밥",
                desc="테토 장어 덮밥이 되다.",
                price=16000,
                category="선착순",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="코카콜라 : 선택을 못 할땐 노래를 불러봐 !",
                desc="코카콜라 맛있다 맛있으면 또 먹어 딩동댕동 다음은 뭐게?",
                image="/assets/images/menus/coke.png",
                price=2500,
                category="뚱캔들과 생명수",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="펩시제로라임 : 제로의 근본은 나지.",
                desc="반박시 코카콜라 말이 맞음.",
                image="/assets/images/menus/pepsi.png",
                price=2500,
                category="뚱캔들과 생명수",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="스프라이트 : 속이 답답할 떈 스프라이트가 필요한 법",
                desc="법 언제 생기는지는 나도 모름.",
                image="/assets/images/menus/sprite.png",
                price=2500,
                category="뚱캔들과 생명수",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="환타 : 달달함을 맡고 있지",
                desc="나보다 달달한 음료 없을 걸?",
                image="/assets/images/menus/fanta.png",
                price=2500,
                category="뚱캔들과 생명수",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="건방진 생수 : 난 너의 생명수 (500ml)",
                desc="긴말 필요 없음",
                image="/assets/images/menus/water.png",
                price=2500,
                category="뚱캔들과 생명수",
            ),
        ]
    )
    session.commit()


def session_decor(engine: Engine):
    def real_decor(func):
        def wrapper(*args, **kwargs):
            with Session(engine) as session:
                return func(session, *args, **kwargs)

        return wrapper

    return real_decor
