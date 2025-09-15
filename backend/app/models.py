from datetime import datetime, timezone
import enum
from typing import Optional, ClassVar
import uuid

from sqlmodel import (
    SQLModel,
    Field,
    Enum,
    Column,
    Relationship,
    Sequence,
)


class User(SQLModel):
    username: str
    is_superuser: bool = False


class AdminUser(User):
    is_superuser: bool = True


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class Restaurants(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(default="우리식당")
    open_time: str = Field()
    close_time: str = Field()
    break_start_time: Optional[str] = Field()
    break_end_time: Optional[str] = Field()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    menus: list["Menus"] = Relationship(back_populates="restaurant")
    tables: list["Tables"] = Relationship(back_populates="restaurant")
    teams: list["Teams"] = Relationship(back_populates="restaurant")
    waitings: list["Waitings"] = Relationship(back_populates="restaurant")
    orders: list["Orders"] = Relationship(back_populates="restaurant")
    payments: list["Payments"] = Relationship(back_populates="restaurant")


class RestaurantUpdate(SQLModel):
    break_start_time: Optional[str] = None
    break_end_time: Optional[str] = None


class MenuBase(SQLModel):
    name: str = Field(index=True)
    desc: Optional[str] = Field(default=None)
    price: int = Field(description="price in won")
    image: Optional[str] = Field(default=None)
    bg_color: Optional[str] = Field(default=None)
    category: Optional[str] = Field(default=None, index=True)
    no_stock: bool = Field(default=False)
    is_instant_serve: bool = Field(
        default=False,
        description="즉시 서빙 가능한 메뉴 여부",
        sa_column_kwargs={"server_default": "0"},
    )


class Menus(MenuBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship(back_populates="menus")


class MenuUpdate(SQLModel):
    no_stock: Optional[bool] = None
    is_instant_serve: Optional[bool] = None


class MenuPublic(MenuBase):
    id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class TableStatus(str, enum.Enum):
    idle = "idle"
    in_use = "in_use"
    reserved = "reserved"


class AllFilter(str, enum.Enum):
    all = "all"


class Tables(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    no: int = Field()
    status: TableStatus = Field(
        sa_column=Column(Enum(TableStatus), index=True), default=TableStatus.idle
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship(back_populates="tables")


class TableUpdate(SQLModel):
    status: TableStatus


class WaitingStatus(str, enum.Enum):
    waiting = "waiting"
    notified = "notified"
    entered = "entered"
    rejected = "rejected"


class Waitings(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    name: str = Field(index=True)
    phone: str = Field(index=True)
    notified_at: Optional[datetime] = Field(default=None)
    entered_at: Optional[datetime] = Field(default=None)
    rejected_at: Optional[datetime] = Field(default=None)
    rejected_reason: Optional[str] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship(back_populates="waitings")
    # team: Optional["Teams"] = Relationship(
    #     back_populates="waiting", sa_relationship_kwargs={"uselist": False}
    # )

    @property
    def is_entered(self) -> bool:
        return self.entered_at is not None

    @property
    def status(self) -> WaitingStatus:
        if self.entered_at is not None:
            return WaitingStatus.entered
        elif self.rejected_at is not None:
            return WaitingStatus.rejected
        elif self.notified_at is not None:
            return WaitingStatus.notified
        else:
            return WaitingStatus.waiting


class WaitingCreate(SQLModel):
    name: str
    phone: str


class WaitingUpdate(SQLModel):
    notified_at: Optional[datetime] = None
    entered_at: Optional[datetime] = None
    rejected_at: Optional[datetime] = None
    rejected_reason: Optional[str] = None


class WaitingFind(SQLModel):
    name: str
    phone: str


class WaitingPublic(SQLModel):
    id: uuid.UUID
    name: str
    phone: str
    notified_at: Optional[datetime]
    entered_at: Optional[datetime]
    rejected_at: Optional[datetime]
    rejected_reason: Optional[str]
    status: WaitingStatus
    created_at: datetime
    is_entered: bool

    class Config:
        from_attributes = True


class Teams(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    table_id: uuid.UUID = Field(
        default=None, foreign_key="tables.id", index=True, ondelete="CASCADE"
    )
    # waiting_id: Optional[uuid.UUID] = Field(
    #     default=None, foreign_key="waitings.id", index=True
    # )
    phone: Optional[str] = Field(index=True)
    ended_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship(back_populates="teams")
    table: "Tables" = Relationship()
    # waiting: Optional["Waitings"] = Relationship(back_populates="team")
    orders: list["Orders"] = Relationship(back_populates="team")


class TeamCreate(SQLModel):
    table_id: uuid.UUID
    # waiting_id: Optional[uuid.UUID] = None


class TeamPublic(SQLModel):
    id: uuid.UUID
    table: Tables
    phone: Optional[str] = None
    ended_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True


class OrderStatus(str, enum.Enum):
    ordered = "ordered"
    paid = "paid"
    rejected = "rejected"
    finished = "finished"


class OrderBase(SQLModel):
    reject_reason: Optional[str] = Field(default=None)
    finished_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Orders(OrderBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    team_id: uuid.UUID = Field(foreign_key="teams.id", index=True, ondelete="CASCADE")
    payment_id: Optional[uuid.UUID] = Field(
        default=None, foreign_key="payments.id", index=True
    )
    # op.execute(sa.schema.CreateSequence(sa.schema.Sequence('orders_no_seq', increment=1, minvalue=0, start=0, cycle=True)))
    orders_no_seq: ClassVar = Sequence(
        "orders_no_seq", increment=1, minvalue=0, start=0, cycle=True
    )
    no: Optional[int] = Field(
        default=None,
        sa_column_args=[orders_no_seq],
        sa_column_kwargs={"server_default": orders_no_seq.next_value()},
    )

    restaurant: "Restaurants" = Relationship(back_populates="orders")
    team: "Teams" = Relationship(back_populates="orders")
    payment: Optional["Payments"] = Relationship(back_populates="order")
    ordered_menus: list["OrderedMenus"] = Relationship(back_populates="order")

    @property
    def status(self) -> OrderStatus:
        if self.finished_at is not None:
            return OrderStatus.finished
        elif self.payment_id is not None:
            return OrderStatus.paid
        elif self.reject_reason is not None:
            return OrderStatus.rejected
        else:
            return OrderStatus.ordered

    @property
    def total_price(self) -> int:
        return sum(menu_order.menu.price for menu_order in self.ordered_menus)

    @property
    def final_price(self) -> Optional[int]:
        """총 결제 금액 (총액 + 주문번호 뒷 2자리)"""
        if self.no is None:
            return None
        return self.total_price - (self.no % 100)

    @property
    def grouped_ordered_menus(self) -> list["OrderedMenuGrouped"]:
        """메뉴별로 그룹화된 주문 메뉴 정보"""
        from collections import defaultdict

        # 메뉴별로 그룹화
        menu_groups = defaultdict(list)
        for ordered_menu in self.ordered_menus:
            menu_groups[ordered_menu.menu_id].append(ordered_menu)

        grouped_menus = []
        for menu_id, ordered_menu_list in menu_groups.items():
            # 첫 번째 주문 메뉴에서 메뉴 정보 가져오기
            first_ordered_menu = ordered_menu_list[0]

            # 수량 및 조리 상태 계산
            total_amount = len(ordered_menu_list)
            cooked_count = sum(1 for om in ordered_menu_list if om.cooked)

            # 상태 결정 (전체 상태의 우선순위에 따라)
            if all(om.served_at for om in ordered_menu_list):
                status = MenuOrderStatus.served
            elif any(om.reject_reason for om in ordered_menu_list):
                status = MenuOrderStatus.rejected
            elif cooked_count > 0:
                status = MenuOrderStatus.cooking
            else:
                status = MenuOrderStatus.ordered

            grouped_menu = OrderedMenuGrouped(
                menu=first_ordered_menu.menu,
                amount=total_amount,
                cooked_count=cooked_count,
                status=status,
                ordered_menu_ids=[om.id for om in ordered_menu_list],
                ordered_menus=[
                    OrderedMenuPublic(
                        id=om.id,
                        cooked=om.cooked,
                        reject_reason=om.reject_reason,
                        served_at=om.served_at,
                        status=om.status,
                        menu=om.menu,
                    )
                    for om in ordered_menu_list
                ],
            )
            grouped_menus.append(grouped_menu)

        return grouped_menus


class OrderCreate(SQLModel):
    ordered_menus: list["OrderedMenuCreate"]


class TableOrderCreate(SQLModel):
    """테이블 ID로 직접 주문 생성 (팀도 함께 생성)"""

    table_id: uuid.UUID
    ordered_menus: list["OrderedMenuCreate"]


class OrderUpdate(SQLModel):
    payment_id: Optional[uuid.UUID] = None
    finished_at: Optional[datetime] = None
    reject_reason: Optional[str] = None


class PaymentInfo(SQLModel):
    bank_name: str
    bank_account_no: str


class OrderPublic(OrderBase):
    """그룹화된 메뉴 정보를 포함한 주문 응답 모델"""

    id: uuid.UUID
    no: int
    status: OrderStatus
    total_price: int
    final_price: int

    grouped_ordered_menus: list["OrderedMenuGrouped"]
    payment: Optional["Payments"]
    payment_info: Optional[PaymentInfo] = None
    team: "TeamPublic"

    class Config:
        from_attributes = True


class OrderWithPaymentInfo(OrderPublic):
    payment_info: PaymentInfo


class MenuOrderStatus(str, enum.Enum):
    ordered = "ordered"
    rejected = "rejected"
    cooking = "cooking"
    served = "served"


class OrderedMenuBase(SQLModel):
    cooked: bool = Field(default=False)  # 조리 완료 여부
    reject_reason: Optional[str] = Field(default=None)
    served_at: Optional[datetime] = Field(default=None)


class OrderedMenus(OrderedMenuBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    order_id: uuid.UUID = Field(foreign_key="orders.id", index=True, ondelete="CASCADE")
    menu_id: uuid.UUID = Field(foreign_key="menus.id", index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship()
    order: "Orders" = Relationship(back_populates="ordered_menus")
    menu: "Menus" = Relationship()

    @property
    def status(self) -> MenuOrderStatus:
        if self.served_at is not None:
            return MenuOrderStatus.served
        elif self.cooked:  # 조리 완료 상태
            return MenuOrderStatus.cooking
        elif self.reject_reason is not None:
            return MenuOrderStatus.rejected
        else:
            return MenuOrderStatus.ordered


class OrderedMenuCreate(SQLModel):
    menu_id: uuid.UUID
    amount: int = Field(gt=0)  # 프론트엔드에서는 여전히 amount로 받음


class OrderedMenuUpdate(SQLModel):
    reject_reason: Optional[str] = None
    status: Optional[str] = None  # "cooking", "served" 등의 상태


class OrderedMenuPublic(SQLModel):
    id: uuid.UUID
    cooked: bool = Field(default=False)
    reject_reason: Optional[str] = Field(default=None)
    served_at: Optional[datetime] = Field(default=None)
    status: MenuOrderStatus
    menu: MenuPublic

    class Config:
        from_attributes = True


class OrderedMenuForServing(SQLModel):
    id: uuid.UUID
    cooked: bool = Field(default=False)
    reject_reason: Optional[str] = Field(default=None)
    served_at: Optional[datetime] = Field(default=None)
    status: MenuOrderStatus
    menu: MenuPublic
    order_id: uuid.UUID
    order_no: int
    table_no: int
    created_at: datetime


class OrderedMenuGrouped(SQLModel):
    """메뉴별로 그룹화된 주문 메뉴 (수량 포함)"""

    menu: MenuPublic
    amount: int
    cooked_count: int = Field(default=0)
    status: MenuOrderStatus
    ordered_menu_ids: list[uuid.UUID] = Field(description="해당 메뉴의 개별 주문 ID들")
    ordered_menus: list["OrderedMenuPublic"] = Field(
        description="해당 메뉴의 개별 주문 상세 정보들"
    )

    model_config = {"from_attributes": True}


class Payments(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    transaction_by: Optional[str] = Field(default=None)
    amount: int = Field()
    refunded_at: Optional[datetime] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship(back_populates="payments")
    order: "Orders" = Relationship(
        back_populates="payment", sa_relationship_kwargs={"uselist": False}
    )


class PaymentWithOrder(SQLModel):
    """결제 정보와 주문 정보를 함께 포함하는 모델"""

    id: uuid.UUID
    restaurant_id: uuid.UUID
    transaction_by: Optional[str] = None
    amount: int
    refunded_at: Optional[datetime] = None
    created_at: datetime
    order_id: Optional[uuid.UUID] = None
    order_no: Optional[int] = None

    class Config:
        from_attributes = True


class BankTransaction(SQLModel):
    transaction_by: str
    date: datetime
    amount: int
    balance: int

    def to_payment_data_dict(self) -> dict:
        # naive datetime을 UTC로 처리
        created_at = (
            self.date.replace(tzinfo=timezone.utc)
            if self.date.tzinfo is None
            else self.date
        )
        return {
            "amount": self.amount,
            "created_at": created_at,
            "transaction_by": self.transaction_by,
        }


class KioskOrderCreate(OrderCreate):
    table_id: uuid.UUID
    phone: str


class KioskTeamPublic(SQLModel):
    id: uuid.UUID
    table_no: int
    phone: str

    class Config:
        from_attributes = True


class MenuCookingQueue(SQLModel):
    """메뉴별 조리 대기 현황"""

    menu_id: uuid.UUID
    menu_name: str
    menu_category: Optional[str] = None
    total_pending_count: int = Field(description="조리 대기중인 총 개수")
    oldest_order_time: Optional[datetime] = Field(description="가장 오래된 주문 시간")
    is_instant_serve: bool = Field(default=False, description="즉시 서빙 가능 여부")

    class Config:
        from_attributes = True


class MenuSalesStats(SQLModel):
    """메뉴별 판매 통계"""

    menu_id: uuid.UUID
    menu_name: str
    menu_category: Optional[str] = None
    menu_price: int
    total_ordered: int = Field(description="총 주문된 개수")
    total_served: int = Field(description="총 서빙된 개수")
    total_rejected: int = Field(description="총 거절된 개수")
    total_revenue: int = Field(description="총 매출 (서빙된 것만)")
    avg_daily_sales: float = Field(description="일평균 판매량")
    last_ordered_at: Optional[datetime] = Field(description="마지막 주문 시간")

    class Config:
        from_attributes = True
