import { z } from "zod";
import { SensorReadingSchema } from "./sensor-reading.js";

export const BatchIngestionRequestSchema = z
  .object({
    readings: z.array(SensorReadingSchema).min(1).max(100),
  })
  .strict();

export const RejectedReadingSchema = z
  .object({
    id: z.string(),
    reason: z.string().min(1),
  })
  .strict();

export const BatchIngestionResponseSchema = z
  .object({
    accepted: z.array(z.string().uuid()),
    rejected: z.array(RejectedReadingSchema),
  })
  .strict();

export type BatchIngestionRequest = z.infer<typeof BatchIngestionRequestSchema>;
export type RejectedReading = z.infer<typeof RejectedReadingSchema>;
export type BatchIngestionResponse = z.infer<typeof BatchIngestionResponseSchema>;
