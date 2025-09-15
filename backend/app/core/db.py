from sqlmodel import Session, create_engine, select, SQLModel
from sqlalchemy import Engine

from app.core.config import settings
from app.models import Restaurants, Tables, Menus, TableType

engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI))


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28

tableUuids = [
    "bed281a1-4f6e-4295-a11f-59f691e0b318",
    "ebabd534-9d55-4ad1-a5f3-9a4ce4681d7c",
    "d89f5094-efd6-45a5-afd3-f8244ab897a7",
    "68cadcec-e914-4973-9ce0-c5b2e8f48471",
    "ed07098d-861d-43de-97e0-592e60e795d7",
    "14c897b4-1e51-431c-8c93-4d914bfc1258",
    "cfc6ad29-b764-4f63-8cba-0c45485acbaf",
    "0029a001-7c08-4800-b64a-6d4467af0673",
    "380bce78-c0c0-4283-b07b-9038500a4e9d",
    "4da93e3d-6de9-4d28-a924-be336095eb66",
    "3c834dc4-621b-428b-98b1-30a78f15db4c",
    "3c71eba3-019c-4ef1-a4c1-0bb0f9a498f3",
    "d9a56bcf-4820-4f34-99d0-ddf4c7a773a5",
    "a6dd061c-62f7-4148-9dbd-a030d80797a4",
    "7c928e36-f123-40bd-bad7-86ac9e2decf9",
    "64a84a69-b94d-48dd-8d08-378bb6430327",
    "b563f3b2-14c8-4e32-b092-b30d530ade0c",
    "b4ff7135-c42e-459b-a5c8-2fe978b64427",
    "71454676-03de-4a53-9d1f-8884e6c1355f",
    "ab8c5dba-42fa-4e82-b3df-aa03f46b3502",
    "f6d37260-6f45-407a-ace8-9f30f3709eab",
    "917266a8-c1af-4f0a-a2ac-8c7deaf55873",
    "bbe94577-7f91-4358-91ac-adeb673259ee",
    "ac7f7dc9-2431-483e-add6-9944e1b1e9ad",
    "59f86a06-ca2e-4888-8714-cee374da6195",
    "7e8b480f-8529-4caf-a02a-13da264216db",
    "3f9d4ace-3ffe-4e89-aa95-477ddfc9c7e1",
    "7c6a2fcb-205b-46f9-a42c-54ae121866d4",
    "fb1636b8-006d-4d87-8d89-1037f15b3208",
    "a0f435b7-b8f6-4a7a-a7b6-8b95d8af4bca",
    "96e6bc5d-319a-4b5b-ad3f-109904dff9c0",
    "b917d43b-46d5-412a-babd-52a91821ed82",
    "f051230c-e3d7-4b8c-9702-a8577eafc6a5",
    "70c60d6a-4f19-47ac-a218-b0cc30820c3c",
]


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # # drop exist database and create new
    # SQLModel.metadata.drop_all(engine)
    # print("Dropped all tables.")

    # # This works because the models are already imported and registered from app.models
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
        [
            Tables(
                id=table_id, no=i, type=TableType.normal, restaurant_id=restaurant.id
            )
            for i, table_id in enumerate(tableUuids, start=1)
        ],
    )
    session.add_all(
        [
            Tables(no=i, type=TableType.kiosk, restaurant_id=restaurant.id)
            for i in [35, 36]
        ],
    )

    # menus
    session.add_all(
        [
            Menus(
                restaurant_id=restaurant.id,
                name="에겐 대하 : 안녕하새우",
                desc="엄청난 대하가 몇 마리 ? 20마리 !",
                image="/assets/images/menus/shrimp.png",
                bg_color="#D9D9D9",
                price=32000,
                category="메인메뉴",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="테토 장어 : 왜 불러.",
                desc="비키거라. 대하에 꿀리지 않는 테토 장어 두 마리 나가신다.",
                image="/assets/images/menus/eel.png",
                bg_color="#000000",
                price=32000,
                category="메인메뉴",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="장어덮밥",
                desc="테토 장어 덮밥이 되다.",
                image="/assets/images/menus/eel_rice.png",
                bg_color="#D9D9D9",
                price=16000,
                category="선착순",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="킹타이거 새우",
                desc="이 구역의 왕은 나야 ! 아무도 날 막지 못해",
                image="/assets/images/menus/king_tiger.png",
                bg_color="#D9D9D9",
                price=16000,
                category="스폐셜 메뉴",
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="코카콜라 : 선택을 못 할땐 노래를 불러봐 !",
                desc="코카콜라 맛있다 맛있으면 또 먹어 딩동댕동 다음은 뭐게?",
                image="/assets/images/menus/coke.png",
                bg_color="#DF0A1C",
                price=2500,
                category="뚱캔들과 생명수",
                is_instant_cook=True,
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="코카콜라 제로 : 다이어트 중이라고? 그럼 나지",
                desc="다이어트 중에 양심상 제로 먹는 사람 여기여기 붙어라",
                image="/assets/images/menus/pepsi.png",
                bg_color="#141108",
                price=2500,
                category="뚱캔들과 생명수",
                is_instant_cook=True,
            ),
            # Menus(
            #     restaurant_id=restaurant.id,
            #     name="펩시제로라임 : 제로의 근본은 나지.",
            #     desc="반박시 코카콜라 말이 맞음.",
            #     image="/assets/images/menus/pepsi.png",
            #     bg_color="#141108",
            #     price=2500,
            #     category="뚱캔들과 생명수",
            #     is_instant_cook=True,
            # ),
            Menus(
                restaurant_id=restaurant.id,
                name="스프라이트 : 속이 답답할 떈 스프라이트가 필요한 법",
                desc="법 언제 생기는지는 나도 모름.",
                image="/assets/images/menus/sprite.png",
                bg_color="#2DB24C",
                price=2500,
                category="뚱캔들과 생명수",
                is_instant_cook=True,
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="환타 : 달달함을 맡고 있지",
                desc="나보다 달달한 음료 없을 걸?",
                image="/assets/images/menus/fanta.png",
                bg_color="#FE8002",
                price=2500,
                category="뚱캔들과 생명수",
                is_instant_cook=True,
            ),
            Menus(
                restaurant_id=restaurant.id,
                name="건방진 생수 : 난 너의 생명수 (500ml)",
                desc="긴말 필요 없음",
                image="/assets/images/menus/water.png",
                bg_color="#E0F7FA",
                price=2500,
                category="뚱캔들과 생명수",
                is_instant_cook=True,
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
