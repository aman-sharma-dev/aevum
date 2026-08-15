import uuid
from datetime import datetime

from sqlalchemy import DateTime, Float, Index, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Reading(Base):
    __tablename__ = "readings"
    __table_args__ = (
        UniqueConstraint("device_id", "sequence_number", name="uq_device_sequence"),
        Index("ix_readings_measured_metric", "measured_at", "metric"),
        Index("ix_readings_device_measured", "device_id", "measured_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    device_id: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    metric: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    value: Mapped[float] = mapped_column(Float, nullable=False)
    unit: Mapped[str] = mapped_column(String(32), nullable=False)
    measured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    sequence_number: Mapped[int] = mapped_column(nullable=False)
