import type { SensorMetric, SensorReading, SyncStatus } from "@aevum/contracts";
import * as SQLite from "expo-sqlite";

const databasePromise = SQLite.openDatabaseAsync("wearable-aevum.db");

type ReadingRow = {
  id: string; device_id: string; metric: SensorMetric; value: number; unit: string;
  measured_at: string; received_at: string | null; sync_status: SyncStatus; sequence_number: number;
};

const fromRow = (row: ReadingRow): SensorReading => ({
  id: row.id,
  deviceId: row.device_id,
  metric: row.metric,
  value: row.value,
  unit: row.unit,
  measuredAt: row.measured_at,
  ...(row.received_at ? { receivedAt: row.received_at } : {}),
  syncStatus: row.sync_status,
  sequenceNumber: row.sequence_number,
});

export async function initializeDatabase(): Promise<void> {
  const db = await databasePromise;
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS readings (
      id TEXT PRIMARY KEY NOT NULL,
      device_id TEXT NOT NULL,
      metric TEXT NOT NULL,
      value REAL NOT NULL,
      unit TEXT NOT NULL,
      measured_at TEXT NOT NULL,
      received_at TEXT,
      sync_status TEXT NOT NULL DEFAULT 'pending',
      sequence_number INTEGER NOT NULL,
      retry_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      UNIQUE(device_id, sequence_number)
    );
    CREATE INDEX IF NOT EXISTS idx_local_pending ON readings(sync_status, measured_at);
    CREATE INDEX IF NOT EXISTS idx_local_metric_time ON readings(metric, measured_at);
  `);
}

export async function commitReading(reading: SensorReading): Promise<boolean> {
  const db = await databasePromise;
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO readings
      (id, device_id, metric, value, unit, measured_at, received_at, sync_status, sequence_number)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)`,
    reading.id, reading.deviceId, reading.metric, reading.value, reading.unit,
    reading.measuredAt, reading.receivedAt ?? null, reading.sequenceNumber,
  );
  return result.changes === 1;
}

export async function pendingReadings(limit = 100, includeFailed = true): Promise<SensorReading[]> {
  const db = await databasePromise;
  const rows = await db.getAllAsync<ReadingRow>(
    includeFailed
      ? "SELECT * FROM readings WHERE sync_status IN ('pending','failed') ORDER BY measured_at LIMIT ?"
      : "SELECT * FROM readings WHERE sync_status='pending' ORDER BY measured_at LIMIT ?",
    limit,
  );
  return rows.map(fromRow);
}

export async function markAccepted(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await databasePromise;
  await db.withTransactionAsync(async () => {
    for (const id of ids) await db.runAsync("UPDATE readings SET sync_status='synced', last_error=NULL WHERE id=?", id);
  });
}

export async function markFailed(ids: string[], reason: string): Promise<void> {
  if (ids.length === 0) return;
  const db = await databasePromise;
  await db.withTransactionAsync(async () => {
    for (const id of ids) {
      await db.runAsync(
        "UPDATE readings SET sync_status='failed', retry_count=retry_count+1, last_error=? WHERE id=?",
        reason.slice(0, 300), id,
      );
    }
  });
}

export async function queryReadings(metric: SensorMetric, since: string): Promise<SensorReading[]> {
  const db = await databasePromise;
  const rows = await db.getAllAsync<ReadingRow>(
    "SELECT * FROM readings WHERE metric=? AND measured_at>=? ORDER BY measured_at", metric, since,
  );
  return rows.map(fromRow);
}

export interface QueueStats { pending: number; failed: number; duplicateDrops: number }
export async function queueStats(duplicateDrops: number): Promise<QueueStats> {
  const db = await databasePromise;
  const row = await db.getFirstAsync<{ pending: number; failed: number }>(
    "SELECT SUM(CASE WHEN sync_status='pending' THEN 1 ELSE 0 END) pending, SUM(CASE WHEN sync_status='failed' THEN 1 ELSE 0 END) failed FROM readings",
  );
  return { pending: row?.pending ?? 0, failed: row?.failed ?? 0, duplicateDrops };
}
