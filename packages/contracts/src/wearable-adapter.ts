import type { SensorReading } from "./sensor-reading.js";

export interface WearableAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  subscribe(onReading: (reading: SensorReading) => void): () => void;
}
