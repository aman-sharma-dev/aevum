import { z } from "zod";
import { SensorMetricSchema, SensorReadingSchema } from "./sensor-reading.js";

export const PaginationSchema = z.object({
  limit: z.number().int().min(1).max(500),
  offset: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const ReadingsPageSchema = z
  .object({
    items: z.array(SensorReadingSchema),
    pagination: PaginationSchema,
  })
  .strict();

export const DeviceStatusSchema = z
  .object({
    deviceId: z.string().min(1),
    lastSeen: z.string().datetime({ offset: true }).nullable(),
    totalIngested: z.number().int().nonnegative(),
    streamHealth: z.enum(["healthy", "stale", "unknown"]),
  })
  .strict();

export const AnalyticsSummaryItemSchema = z
  .object({
    metric: SensorMetricSchema,
    average: z.number().finite(),
    minimum: z.number().finite(),
    maximum: z.number().finite(),
    count: z.number().int().nonnegative(),
  })
  .strict();

export const AnalyticsSummarySchema = z
  .object({
    windowStart: z.string().datetime({ offset: true }),
    windowEnd: z.string().datetime({ offset: true }),
    metrics: z.array(AnalyticsSummaryItemSchema),
  })
  .strict();

export type Pagination = z.infer<typeof PaginationSchema>;
export type ReadingsPage = z.infer<typeof ReadingsPageSchema>;
export type DeviceStatus = z.infer<typeof DeviceStatusSchema>;
export type AnalyticsSummaryItem = z.infer<typeof AnalyticsSummaryItemSchema>;
export type AnalyticsSummary = z.infer<typeof AnalyticsSummarySchema>;
