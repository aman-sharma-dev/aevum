import { BatchIngestionResponseSchema, type SensorReading } from "@aevum/contracts";
import { markAccepted, markFailed, pendingReadings } from "../storage/database";

export type SyncEngineState = "idle" | "syncing" | "error";
export interface SyncSnapshot {
  state: SyncEngineState;
  retryInMs: number;
  lastBatchSize: number;
  lastSuccessfulAt?: string;
  error?: string;
}

export class SyncEngine {
  private snapshot: SyncSnapshot = { state: "idle", retryInMs: 0, lastBatchSize: 0 };
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private syncInProgress = false;
  private readonly listeners = new Set<(snapshot: SyncSnapshot) => void>();

  constructor(private readonly apiUrl: string, private readonly batchSize = 100) {}

  subscribe(listener: (snapshot: SyncSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.snapshot);
    return () => this.listeners.delete(listener);
  }

  async sync(): Promise<void> {
    if (this.syncInProgress) return;
    this.syncInProgress = true;
    let readings: SensorReading[] = [];
    try {
      readings = await pendingReadings(this.batchSize);
      if (readings.length === 0) { this.publish({ ...this.snapshot, state: "idle", retryInMs: 0 }); return; }
      const { error: _previousError, ...withoutError } = this.snapshot;
      this.publish({ ...withoutError, state: "syncing" });
      const response = await fetch(`${this.apiUrl}/readings/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ readings }),
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = BatchIngestionResponseSchema.parse(await response.json());
      await markAccepted(result.accepted);
      await markFailed(result.rejected.map((item) => item.id), result.rejected.map((item) => item.reason).join("; "));
      this.attempt = 0;
      this.publish({ state: "idle", retryInMs: 0, lastBatchSize: readings.length, lastSuccessfulAt: new Date().toISOString() });
      // Continue through newly pending batches, but do not hot-loop permanent server rejections.
      if ((await pendingReadings(1, false)).length > 0) setTimeout(() => void this.sync(), 0);
    } catch (error) {
      if (readings.length > 0) await this.fail(readings, error);
      else {
        const message = error instanceof Error ? error.message : "Unknown sync failure";
        this.publish({ ...this.snapshot, state: "error", retryInMs: 0, error: message });
      }
    } finally {
      this.syncInProgress = false;
    }
  }

  stop(): void { if (this.timer) clearTimeout(this.timer); this.timer = undefined; }

  private async fail(readings: SensorReading[], error: unknown): Promise<void> {
    const message = error instanceof Error ? error.message : "Unknown sync failure";
    const base = Math.min(60_000, 1000 * 2 ** this.attempt++);
    const retryInMs = Math.round(base * (0.75 + Math.random() * 0.5));
    await markFailed(readings.map((item) => item.id), message);
    this.publish({ ...this.snapshot, state: "error", retryInMs, error: message });
    this.timer = setTimeout(() => void this.sync(), retryInMs);
  }

  private publish(snapshot: SyncSnapshot): void {
    this.snapshot = snapshot;
    for (const listener of this.listeners) listener(snapshot);
  }
}
