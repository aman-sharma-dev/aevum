# wearable-aevum

A production-minded reference system for continuous wearable telemetry under hostile network conditions. It demonstrates edge durability, idempotent synchronization, clock drift, out-of-order events, duplicate delivery, burst recovery, strict boundary validation, and operational visibility.

## What is included

- Expo SDK 57 / React Native mobile application with four tabs
- SQLite WAL write-ahead store and transactional sync status updates
- Modular `WearableAdapter` and ten-state chaos simulator
- FastAPI, Pydantic v2, SQLAlchemy, AsyncPG, and PostgreSQL API
- UUID and `(device_id, sequence_number)` database idempotency constraints
- Docker Compose development environment
- Shared TypeScript types and Zod wire schemas

## Run it

Requirements: Node.js 22.13+, pnpm 9+, Docker Compose, and optionally Python 3.11+ for local API development.

```bash
pnpm install
docker compose up --build
```

In another terminal:

```bash
cp apps/mobile/.env.example apps/mobile/.env
pnpm --filter @aevum/mobile start
```

On a physical phone, change `EXPO_PUBLIC_API_URL` from `localhost` to the development computer's LAN address. Start the stream from the Device tab, select a chaos mode, and inspect persistence/retries in Sync Debugger.

## Verification

```bash
pnpm check
pnpm test
pnpm build

cd apps/api
python -m venv .venv
.venv/Scripts/pip install -e ".[dev]" # Windows
pytest
ruff check .
```

## API

- `POST /readings/batch` — accepts 1–100 events and returns explicit accepted/rejected IDs
- `GET /readings` — metric/device/time filters with limit/offset pagination
- `GET /devices/{id}/status` — last seen, count, and stream health
- `GET /analytics/summary` — min/max/average/count over a rolling window
- `GET /docs` — interactive OpenAPI documentation

## Monorepo

- `apps/mobile` — Expo app, SQLite store, synchronization engine, and UI
- `apps/api` — FastAPI service and PostgreSQL model
- `packages/contracts` — canonical TypeScript domain and transport schemas
- `packages/sensor-simulator` — wearable abstraction and chaos state machine
- `docs/architecture.md` — design decisions and failure/recovery walkthrough

The server treats a replay of an existing event ID as accepted: the event is not inserted twice, but the acknowledgement lets a client recover after losing the original HTTP response. A reused sequence number with a different ID is rejected because it indicates device history divergence.
