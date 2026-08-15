from uuid import uuid4

import pytest
from pydantic import ValidationError

from app.schemas import BatchRequest


def valid_reading() -> dict:
    return {
        "id": str(uuid4()),
        "deviceId": "watch-1",
        "metric": "heart_rate",
        "value": 72,
        "unit": "bpm",
        "measuredAt": "2026-08-15T12:00:00Z",
        "syncStatus": "pending",
        "sequenceNumber": 1,
    }


def test_accepts_contract_shape() -> None:
    payload = BatchRequest.model_validate({"readings": [valid_reading()]})
    assert payload.readings[0].device_id == "watch-1"


def test_rejects_malformed_event() -> None:
    malformed = valid_reading()
    malformed["value"] = "not-a-number"
    malformed.pop("measuredAt")
    with pytest.raises(ValidationError):
        BatchRequest.model_validate({"readings": [malformed]})
