import { z } from "zod";

export const CHAOS_STATES = [
  "NORMAL",
  "OFFLINE",
  "BUFFERING",
  "RECONNECTING",
  "BURST_SYNC",
  "DUPLICATE_EVENTS",
  "OUT_OF_ORDER",
  "CLOCK_DRIFT",
  "MALFORMED_EVENT",
  "RECOVERY",
] as const;

export const ChaosStateSchema = z.enum(CHAOS_STATES);
export type ChaosState = z.infer<typeof ChaosStateSchema>;
