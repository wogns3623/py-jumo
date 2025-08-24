from datetime import datetime, timezone
import enum
from typing import Union
import uuid

from sqlmodel import (
    SQLModel,
    Field,
    Enum,
    Column,
    Relationship,
)


class User(SQLModel):
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


class TableStatus(str, enum.Enum):
    idle = "idle"
    in_use = "in_use"
    reserved = "reserved"


class Tables(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    no: int = Field()
    status: TableStatus = Field(
        sa_column=Column(Enum(TableStatus), index=True), default=TableStatus.idle
    )
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class Menus(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    title: str = Field(index=True)
    desc: Union[str, None] = Field(default=None)
    price: int = Field(description="price in won")
    image: Union[str, None] = Field(default=None)
    no_stock: bool = Field(default=False)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


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
    table_id: uuid.UUID = Field(foreign_key="tables.id", index=True)
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
    cooking = "cooking"
    served = "served"


class Orders(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    order_no: int = Field(sa_column_kwargs={"autoincrement": True})
    team_id: Union[uuid.UUID, None] = Field(
        default=None, foreign_key="teams.id", index=True
    )
    payment_id: Union[uuid.UUID, None] = Field(
        default=None, foreign_key="payments.id", index=True
    )
    cook_started_at: Union[datetime, None] = Field(default=None)
    served_at: Union[datetime, None] = Field(default=None)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    reject_reason: Union[str, None] = Field(default=None)

    team: "Teams" = Relationship(back_populates="orders")
    payment: Union["Payments", None] = Relationship(back_populates="order")
    menu_orders: list["MenuOrders"] = Relationship(back_populates="order")

    @property
    def status(self) -> OrderStatus:
        if self.served_at is not None:
            return OrderStatus.served
        elif self.cook_started_at is not None:
            return OrderStatus.cooking
        elif self.payment_id is not None:
            return OrderStatus.paid
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
    cook_started_at: Union[datetime, None] = None
    served_at: Union[datetime, None] = None


class OrderWithPaymentInfo(SQLModel):
    order: Orders
    bank_name: str
    bank_account_no: str


class MenuOrders(SQLModel, table=True):
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    menu_id: uuid.UUID = Field(foreign_key="menus.id", index=True)
    order_id: uuid.UUID = Field(foreign_key="orders.id", index=True)
    amount: int = Field()
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    order: "Orders" = Relationship(back_populates="menu_orders")
    menu: "Menus" = Relationship()


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
            price=self.amount, created_at=self.date, transaction_by=self.transaction_by
        )
