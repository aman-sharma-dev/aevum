from contextlib import asynccontextmanager
from datetime import UTC, datetime

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .config import get_settings
from .database import engine, get_session
from .models import Base, Reading
from .schemas import (
    AnalyticsSummary,
    BatchRequest,
    BatchResponse,
    DeviceStatus,
    Metric,
    Pagination,
    ReadingOutput,
    ReadingsPage,
    SummaryItem,
)
from .service import analytics_start, apply_reading_filters, ingest_batch


@asynccontextmanager
async def lifespan(_: FastAPI):
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)
    yield
    await engine.dispose()


app = FastAPI(title="Wearable Aevum API", version="0.1.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_settings().cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/readings/batch", response_model=BatchResponse, status_code=status.HTTP_200_OK)
async def post_batch(
    payload: BatchRequest, session: AsyncSession = Depends(get_session)
) -> BatchResponse:
    return await ingest_batch(session, payload)


@app.get("/readings", response_model=ReadingsPage)
async def get_readings(
    metric: Metric | None = None,
    device_id: str | None = Query(default=None, alias="deviceId"),
    start: datetime | None = None,
    end: datetime | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    session: AsyncSession = Depends(get_session),
) -> ReadingsPage:
    filtered = apply_reading_filters(
        select(Reading),
        metric=metric.value if metric else None,
        device_id=device_id,
        start=start,
        end=end,
    )
    count_query = apply_reading_filters(
        select(Reading),
        metric=metric.value if metric else None,
        device_id=device_id,
        start=start,
        end=end,
    ).subquery()
    total = await session.scalar(select(func.count()).select_from(count_query))
    result = await session.scalars(
        filtered.order_by(Reading.measured_at.desc()).limit(limit).offset(offset)
    )
    return ReadingsPage(
        items=[ReadingOutput.model_validate(item) for item in result],
        pagination=Pagination(limit=limit, offset=offset, total=total or 0),
    )


@app.get("/devices/{device_id}/status", response_model=DeviceStatus)
async def get_device_status(
    device_id: str, session: AsyncSession = Depends(get_session)
) -> DeviceStatus:
    row = (
        await session.execute(
            select(func.max(Reading.received_at), func.count(Reading.id)).where(
                Reading.device_id == device_id
            )
        )
    ).one()
    if row[1] == 0:
        raise HTTPException(status_code=404, detail="device not found")
    last_seen = row[0]
    age = (datetime.now(UTC) - last_seen).total_seconds()
    return DeviceStatus(
        deviceId=device_id,
        lastSeen=last_seen,
        totalIngested=row[1],
        streamHealth="healthy" if age <= get_settings().stale_after_seconds else "stale",
    )


@app.get("/analytics/summary", response_model=AnalyticsSummary)
async def get_analytics_summary(
    window_minutes: int = Query(default=5, alias="windowMinutes", ge=1, le=10080),
    device_id: str | None = Query(default=None, alias="deviceId"),
    session: AsyncSession = Depends(get_session),
) -> AnalyticsSummary:
    window_start, window_end = analytics_start(window_minutes)
    query = select(
        Reading.metric,
        func.avg(Reading.value),
        func.min(Reading.value),
        func.max(Reading.value),
        func.count(Reading.id),
    ).where(Reading.measured_at.between(window_start, window_end))
    if device_id:
        query = query.where(Reading.device_id == device_id)
    rows = (await session.execute(query.group_by(Reading.metric))).all()
    return AnalyticsSummary(
        windowStart=window_start,
        windowEnd=window_end,
        metrics=[
            SummaryItem(metric=row[0], average=row[1], minimum=row[2], maximum=row[3], count=row[4])
            for row in rows
        ],
    )
