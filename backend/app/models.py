from datetime import datetime, timezone
import enum
from typing import Union
import uuid

from sqlmodel import SQLModel, Field, Enum, Column, Relationship, text


class User(SQLModel):
    username: str
    is_superuser: bool = False


class AdminUser(User):
    is_superuser: bool = True


class AdminLoginForm(SQLModel):
    username: str
    password: str


class RestaurantUpdate(SQLModel):
    break_start_time: str | None = None
    break_end_time: str | None = None


# JSON payload containing access token
class Token(SQLModel):
    access_token: str
    token_type: str = "bearer"


# Contents of JWT token
class TokenPayload(SQLModel):
    sub: str | None = None


class TableStatus(str, enum.Enum):
    idle = "idle"
    in_use = "in_use"
    reserved = "reserved"


class AllFilter(str, enum.Enum):
    all = "all"


class Tables(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    no: int = Field()
    status: TableStatus = Field(
        sa_column=Column(Enum(TableStatus), index=True), default=TableStatus.idle
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class TableUpdate(SQLModel):
    status: TableStatus


class Menus(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(index=True)
    desc: Union[str, None] = Field(default=None)
    price: int = Field(description="price in won")
    image: Union[str, None] = Field(default=None)
    no_stock: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class MenuUpdate(SQLModel):
    no_stock: Union[bool, None] = None


class Waitings(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    name: str = Field(index=True)
    phone: str = Field(index=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    team: Union["Teams", None] = Relationship(
        back_populates="waiting", sa_relationship_kwargs={"uselist": False}
    )


class Teams(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    table_id: Union[uuid.UUID, None] = Field(
        default=None, foreign_key="tables.id", index=True
    )
    waiting_id: Union[uuid.UUID, None] = Field(
        default=None, foreign_key="waitings.id", index=True
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    table: "Tables" = Relationship()
    waiting: Union["Waitings", None] = Relationship(back_populates="team")
    orders: list["Orders"] = Relationship(back_populates="team")


class TeamCreate(SQLModel):
    table_id: uuid.UUID
    waiting_id: Union[uuid.UUID, None] = None


class OrderStatus(str, enum.Enum):
    ordered = "ordered"
    paid = "paid"
    rejected = "rejected"
    finished = "finished"


class Orders(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    # op.execute("CREATE SEQUENCE IF NOT EXISTS orders_no_seq increment by 1 MINVALUE 0 MAXVALUE 999 START WITH 0 cycle;")
    no: int = Field(
        sa_column_kwargs={"server_default": text("nextval('orders_no_seq')")}
    )
    team_id: Union[uuid.UUID, None] = Field(
        default=None, foreign_key="teams.id", index=True
    )
    payment_id: Union[uuid.UUID, None] = Field(
        default=None, foreign_key="payments.id", index=True
    )
    reject_reason: Union[str, None] = Field(default=None)
    finished_at: Union[datetime, None] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    team: "Teams" = Relationship(back_populates="orders")
    payment: Union["Payments", None] = Relationship(back_populates="order")
    menu_orders: list["MenuOrders"] = Relationship(back_populates="order")

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
            menu_order.menu.price * menu_order.amount for menu_order in self.menu_orders
        )


class OrderCreate(SQLModel):
    team_id: uuid.UUID
    menu_orders: list["MenuOrderCreate"]


class OrderUpdate(SQLModel):
    payment_id: Union[uuid.UUID, None] = None
    finished_at: Union[datetime, None] = None
    reject_reason: Union[str, None] = None


class OrderWithPaymentInfo(SQLModel):
    order: Orders
    bank_name: str
    bank_account_no: str


class MenuOrderStatus(str, enum.Enum):
    ordered = "ordered"
    rejected = "rejected"
    cooking = "cooking"
    served = "served"


class MenuOrders(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    menu_id: uuid.UUID = Field(foreign_key="menus.id", index=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", index=True)
    amount: int = Field()
    reject_reason: Union[str, None] = Field(default=None)
    cook_started_at: Union[datetime, None] = Field(default=None)
    served_at: Union[datetime, None] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    order: "Orders" = Relationship(back_populates="menu_orders")
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


class MenuOrderUpdate(SQLModel):
    cook_started_at: Union[datetime, None] = None
    served_at: Union[datetime, None] = None
    reject_reason: Union[str, None] = None


class MenuOrderCreate(SQLModel):
    menu_id: uuid.UUID
    amount: int


class Payments(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    amount: int = Field()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    transaction_by: Union[str, None] = Field(default=None)

    order: "Orders" = Relationship(
        back_populates="payment", sa_relationship_kwargs={"uselist": False}
    )


class BankTransaction(SQLModel):
    transaction_by: str
    date: datetime
    amount: int
    balance: int

    def to_payment(self) -> Payments:
        return Payments(
            amount=self.amount,
            created_at=self.date,
            transaction_by=self.transaction_by,
        )
