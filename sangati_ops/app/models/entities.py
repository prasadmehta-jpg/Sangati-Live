from sqlalchemy import String, Integer, BigInteger, Float, Boolean, ForeignKey, Text, Index
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

class Venue(Base):
    __tablename__ = "venues"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)

class TableState(Base):
    __tablename__ = "table_states"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    venue_id: Mapped[str] = mapped_column(String(32), ForeignKey("venues.id"), index=True)
    table_code: Mapped[str] = mapped_column(String(50), index=True)
    state: Mapped[str] = mapped_column(String(40), index=True)  # seated|ordered|food_out|paid|dirty|available
    updated_ms: Mapped[int] = mapped_column(BigInteger, index=True)

    venue = relationship("Venue")

class OrderEvent(Base):
    __tablename__ = "order_events"
    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    venue_id: Mapped[str] = mapped_column(String(32), ForeignKey("venues.id"), index=True)
    pos_order_id: Mapped[str] = mapped_column(String(80), index=True)
    table_code: Mapped[str] = mapped_column(String(50), index=True)
    event_type: Mapped[str] = mapped_column(String(40), index=True)  # created|item_added|sent|bumped|paid
    payload_json: Mapped[str] = mapped_column(Text, nullable=False)
    created_ms: Mapped[int] = mapped_column(BigInteger, index=True)

    venue = relationship("Venue")

Index("ix_order_events_venue_time", OrderEvent.venue_id, OrderEvent.created_ms)

class Task(Base):
    __tablename__ = "tasks"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    venue_id: Mapped[str] = mapped_column(String(32), ForeignKey("venues.id"), index=True)
    task_type: Mapped[str] = mapped_column(String(60), index=True)
    target: Mapped[str] = mapped_column(String(120), index=True)
    description: Mapped[str] = mapped_column(String(500))
    status: Mapped[str] = mapped_column(String(20), index=True, default="open")  # open|done|canceled
    created_ms: Mapped[int] = mapped_column(BigInteger, index=True)

    venue = relationship("Venue")

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    venue_id: Mapped[str] = mapped_column(String(32), index=True)
    actor: Mapped[str] = mapped_column(String(40), index=True)  # agent|system|human
    action_type: Mapped[str] = mapped_column(String(80), index=True)
    action_json: Mapped[str] = mapped_column(Text, nullable=False)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    risk_score: Mapped[float] = mapped_column(Float, default=0.0)
    created_ms: Mapped[int] = mapped_column(BigInteger, index=True)
