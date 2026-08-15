import type { ChaosState, SensorMetric } from "@aevum/contracts";

export interface SimulatorOptions {
  deviceId: string;
  frequenciesHz?: Partial<Record<SensorMetric, number>>;
  clockDriftMinutes?: number;
  reconnectBaseDelayMs?: number;
  random?: () => number;
  now?: () => Date;
}

export interface SimulatorDiagnostics {
  state: ChaosState;
  connected: boolean;
  running: boolean;
  bufferedReadings: number;
  emittedReadings: number;
  duplicateEvents: number;
  connectionQuality: number;
}

export type RawReadingListener = (payload: unknown) => void;
