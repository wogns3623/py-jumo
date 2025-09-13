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


class Menus(MenuBase, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    restaurant_id: uuid.UUID = Field(
        foreign_key="restaurants.id", index=True, ondelete="CASCADE"
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    restaurant: "Restaurants" = Relationship(back_populates="menus")


class MenuUpdate(SQLModel):
    no_stock: Optional[bool] = None


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
        return sum(
            menu_order.menu.price * menu_order.amount
            for menu_order in self.ordered_menus
        )

    @property
    def final_price(self) -> Optional[int]:
        """총 결제 금액 (총액 + 주문번호 뒷 2자리)"""
        if self.no is None:
            return None
        return self.total_price - (self.no % 100)


class OrderCreate(SQLModel):
    ordered_menus: list["OrderedMenuCreate"]


class OrderUpdate(SQLModel):
    payment_id: Optional[uuid.UUID] = None
    finished_at: Optional[datetime] = None
    reject_reason: Optional[str] = None


class PaymentInfo(SQLModel):
    bank_name: str
    bank_account_no: str


class OrderPublic(OrderBase):
    id: uuid.UUID
    no: int
    status: OrderStatus
    total_price: int
    final_price: int

    ordered_menus: list["OrderedMenuPublic"]
    payment: Optional["Payments"]
    payment_info: Optional[PaymentInfo] = None

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
    amount: int = Field(gt=0)
    reject_reason: Optional[str] = Field(default=None)
    cook_started_at: Optional[datetime] = Field(default=None)
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
        elif self.cook_started_at is not None:
            return MenuOrderStatus.cooking
        elif self.reject_reason is not None:
            return MenuOrderStatus.rejected
        else:
            return MenuOrderStatus.ordered


class OrderedMenuCreate(SQLModel):
    menu_id: uuid.UUID
    amount: int = Field(gt=0)


class OrderedMenuUpdate(SQLModel):
    cook_started_at: Optional[datetime] = None
    served_at: Optional[datetime] = None
    reject_reason: Optional[str] = None


class OrderedMenuPublic(OrderedMenuBase):
    status: MenuOrderStatus
    menu: MenuPublic

    class Config:
        from_attributes = True


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


class BankTransaction(SQLModel):
    transaction_by: str
    date: datetime
    amount: int
    balance: int

    def to_payment_data_dict(self) -> dict:
        return {
            "amount": self.amount,
            "created_at": self.date,
            "transaction_by": self.transaction_by,
        }


class KioskOrderCreate(OrderCreate):
    table_id: uuid.UUID
    phone: str


class KioskTeamPublic(SQLModel):
    id: uuid.UUID
    phone: str
    created_at: datetime

    class Config:
        from_attributes = True
