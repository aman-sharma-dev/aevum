from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import Select, or_, select, tuple_
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from .models import Reading
from .schemas import BatchRequest, BatchResponse, ReadingInput, Rejection


async def ingest_batch(session: AsyncSession, payload: BatchRequest) -> BatchResponse:
    # Reject duplicates inside the request deterministically before touching PostgreSQL.
    unique: list[ReadingInput] = []
    rejected: list[Rejection] = []
    seen_ids: set[UUID] = set()
    seen_sequences: set[tuple[str, int]] = set()
    for reading in payload.readings:
        sequence_key = (reading.device_id, reading.sequence_number)
        if reading.id in seen_ids:
            rejected.append(Rejection(id=str(reading.id), reason="duplicate id in batch"))
        elif sequence_key in seen_sequences:
            rejected.append(
                Rejection(id=str(reading.id), reason="duplicate device sequence in batch")
            )
        else:
            seen_ids.add(reading.id)
            seen_sequences.add(sequence_key)
            unique.append(reading)

    if not unique:
        return BatchResponse(accepted=[], rejected=rejected)

    existing_rows = await session.execute(
        select(Reading.id, Reading.device_id, Reading.sequence_number).where(
            or_(
                Reading.id.in_([item.id for item in unique]),
                tuple_(Reading.device_id, Reading.sequence_number).in_(
                    [(item.device_id, item.sequence_number) for item in unique]
                ),
            )
        )
    )
    existing = existing_rows.all()
    existing_ids = {row.id for row in existing}
    existing_sequences = {(row.device_id, row.sequence_number) for row in existing}
    insertable: list[ReadingInput] = []
    for reading in unique:
        if reading.id in existing_ids:
            # Replays are acknowledged as accepted so clients can mark them synced.
            rejected_reason = None
        elif (reading.device_id, reading.sequence_number) in existing_sequences:
            rejected_reason = "device sequence already belongs to another event"
        else:
            insertable.append(reading)
            continue
        if rejected_reason:
            rejected.append(Rejection(id=str(reading.id), reason=rejected_reason))

    now = datetime.now(UTC)
    values = [
        {
            "id": item.id,
            "device_id": item.device_id,
            "metric": item.metric.value,
            "value": item.value,
            "unit": item.unit,
            "measured_at": item.measured_at,
            "received_at": now,
            "sequence_number": item.sequence_number,
        }
        for item in insertable
    ]
    inserted: list[UUID] = []
    if values:
        result = await session.execute(
            insert(Reading).values(values).on_conflict_do_nothing().returning(Reading.id)
        )
        inserted = list(result.scalars())
    await session.commit()
    accepted = [item.id for item in unique if item.id in existing_ids or item.id in inserted]
    inserted_set = set(inserted)
    for item in insertable:
        if item.id not in inserted_set:
            rejected.append(Rejection(id=str(item.id), reason="idempotency conflict"))
    return BatchResponse(accepted=accepted, rejected=rejected)


def apply_reading_filters(
    query: Select[tuple[Reading]],
    *,
    metric: str | None,
    device_id: str | None,
    start: datetime | None,
    end: datetime | None,
) -> Select[tuple[Reading]]:
    if metric:
        query = query.where(Reading.metric == metric)
    if device_id:
        query = query.where(Reading.device_id == device_id)
    if start:
        query = query.where(Reading.measured_at >= start)
    if end:
        query = query.where(Reading.measured_at <= end)
    return query


def analytics_start(window_minutes: int) -> tuple[datetime, datetime]:
    end = datetime.now(UTC)
    return end - timedelta(minutes=window_minutes), end
