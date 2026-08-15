import { z } from "zod";

export const SENSOR_METRICS = [
  "heart_rate",
  "skin_temp",
  "sleep_duration",
  "activity",
  "respiratory_rate",
] as const;

export const SYNC_STATUSES = ["pending", "synced", "failed"] as const;

export const SensorMetricSchema = z.enum(SENSOR_METRICS);
export const SyncStatusSchema = z.enum(SYNC_STATUSES);

export const SensorReadingSchema = z
  .object({
    id: z.string().uuid(),
    deviceId: z.string().trim().min(1).max(128),
    metric: SensorMetricSchema,
    value: z.number().finite(),
    unit: z.string().trim().min(1).max(32),
    measuredAt: z.string().datetime({ offset: true }),
    receivedAt: z.string().datetime({ offset: true }).optional(),
    syncStatus: SyncStatusSchema,
    sequenceNumber: z.number().int().nonnegative().safe(),
  })
  .strict();

export type SensorMetric = z.infer<typeof SensorMetricSchema>;
export type SyncStatus = z.infer<typeof SyncStatusSchema>;
export type SensorReading = z.infer<typeof SensorReadingSchema>;

export const METRIC_DEFAULT_UNITS: Readonly<Record<SensorMetric, string>> = {
  heart_rate: "bpm",
  skin_temp: "°C",
  sleep_duration: "hours",
  activity: "steps",
  respiratory_rate: "breaths/min",
};
