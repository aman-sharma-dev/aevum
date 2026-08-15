from datetime import datetime
from enum import StrEnum
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator


class Metric(StrEnum):
    HEART_RATE = "heart_rate"
    SKIN_TEMP = "skin_temp"
    SLEEP_DURATION = "sleep_duration"
    ACTIVITY = "activity"
    RESPIRATORY_RATE = "respiratory_rate"


class ReadingInput(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    id: UUID
    device_id: str = Field(alias="deviceId", min_length=1, max_length=128)
    metric: Metric
    value: float
    unit: str = Field(min_length=1, max_length=32)
    measured_at: datetime = Field(alias="measuredAt")
    received_at: datetime | None = Field(default=None, alias="receivedAt")
    sync_status: str = Field(alias="syncStatus", pattern="^(pending|synced|failed)$")
    sequence_number: int = Field(alias="sequenceNumber", ge=0)

    @field_validator("value")
    @classmethod
    def finite_value(cls, value: float) -> float:
        if value != value or value in (float("inf"), float("-inf")):
            raise ValueError("value must be finite")
        return value


class BatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    readings: list[ReadingInput] = Field(min_length=1, max_length=100)


class Rejection(BaseModel):
    id: str
    reason: str


class BatchResponse(BaseModel):
    accepted: list[UUID]
    rejected: list[Rejection]


class ReadingOutput(BaseModel):
    model_config = ConfigDict(from_attributes=True, populate_by_name=True)

    id: UUID
    device_id: str = Field(alias="deviceId")
    metric: Metric
    value: float
    unit: str
    measured_at: datetime = Field(alias="measuredAt")
    received_at: datetime = Field(alias="receivedAt")
    sync_status: str = Field(default="synced", alias="syncStatus")
    sequence_number: int = Field(alias="sequenceNumber")


class Pagination(BaseModel):
    limit: int
    offset: int
    total: int


class ReadingsPage(BaseModel):
    items: list[ReadingOutput]
    pagination: Pagination


class DeviceStatus(BaseModel):
    device_id: str = Field(alias="deviceId")
    last_seen: datetime | None = Field(alias="lastSeen")
    total_ingested: int = Field(alias="totalIngested")
    stream_health: str = Field(alias="streamHealth")


class SummaryItem(BaseModel):
    metric: Metric
    average: float
    minimum: float
    maximum: float
    count: int


class AnalyticsSummary(BaseModel):
    window_start: datetime = Field(alias="windowStart")
    window_end: datetime = Field(alias="windowEnd")
    metrics: list[SummaryItem]
