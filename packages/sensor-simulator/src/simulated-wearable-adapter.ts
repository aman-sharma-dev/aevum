import {
  CHAOS_STATES,
  METRIC_DEFAULT_UNITS,
  type ChaosState,
  type SensorMetric,
  type SensorReading,
  type WearableAdapter,
} from "@aevum/contracts";
import type { RawReadingListener, SimulatorDiagnostics, SimulatorOptions } from "./types.js";

const DEFAULT_FREQUENCIES: Readonly<Record<SensorMetric, number>> = {
  heart_rate: 1,
  skin_temp: 1,
  sleep_duration: 0,
  activity: 1,
  respiratory_rate: 1,
};

const BASELINES: Readonly<Record<SensorMetric, number>> = {
  heart_rate: 72,
  skin_temp: 33.2,
  sleep_duration: 7.5,
  activity: 1,
  respiratory_rate: 16,
};

export class SimulatedWearableAdapter implements WearableAdapter {
  private readonly listeners = new Set<(reading: SensorReading) => void>();
  private readonly rawListeners = new Set<RawReadingListener>();
  private readonly timers = new Map<SensorMetric, ReturnType<typeof setInterval>>();
  private readonly buffer: SensorReading[] = [];
  private frequencies: Record<SensorMetric, number>;
  private state: ChaosState = "NORMAL";
  private connected = false;
  private running = false;
  private sequenceNumber = 0;
  private emittedReadings = 0;
  private duplicateEvents = 0;
  private lastReading: SensorReading | undefined;
  private reconnectAttempt = 0;

  constructor(private readonly options: SimulatorOptions) {
    this.frequencies = { ...DEFAULT_FREQUENCIES, ...options.frequenciesHz };
  }

  async connect(): Promise<void> {
    if (this.state === "OFFLINE") throw new Error("Device is offline");
    if (this.state === "RECONNECTING") {
      const delay = (this.options.reconnectBaseDelayMs ?? 250) * 2 ** Math.min(this.reconnectAttempt++, 5);
      await new Promise<void>((resolve) => setTimeout(resolve, delay));
      if (this.random() < 0.5) throw new Error("Simulated handshake failure");
    }
    this.connected = true;
    this.reconnectAttempt = 0;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  subscribe(onReading: (reading: SensorReading) => void): () => void {
    this.listeners.add(onReading);
    return () => this.listeners.delete(onReading);
  }

  subscribeRaw(listener: RawReadingListener): () => void {
    this.rawListeners.add(listener);
    return () => this.rawListeners.delete(listener);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.restartTimers();
  }

  stop(): void {
    this.running = false;
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
  }

  setFrequency(metric: SensorMetric, hz: number): void {
    if (!Number.isFinite(hz) || hz < 0 || hz > 20) throw new RangeError("Frequency must be between 0 and 20 Hz");
    this.frequencies[metric] = hz;
    if (this.running) this.restartTimers();
  }

  async setChaosState(next: ChaosState): Promise<void> {
    if (!CHAOS_STATES.includes(next)) throw new Error(`Unknown chaos state: ${String(next)}`);
    this.state = next;
    if (next === "OFFLINE" || next === "BUFFERING") this.connected = false;
    if (next === "BURST_SYNC" || next === "RECOVERY") {
      this.connected = true;
      this.flushBuffer(next === "BURST_SYNC");
      if (next === "RECOVERY") this.state = "NORMAL";
    }
  }

  generate(metric: SensorMetric): void {
    const reading = this.makeReading(metric);
    switch (this.state) {
      case "OFFLINE":
      case "BUFFERING":
      case "RECONNECTING":
        this.buffer.push(reading);
        return;
      case "DUPLICATE_EVENTS":
        this.deliver(reading);
        this.deliver(reading);
        this.duplicateEvents += 1;
        return;
      case "OUT_OF_ORDER":
        this.buffer.push(reading);
        if (this.buffer.length >= 5) this.flushBuffer(true);
        return;
      case "MALFORMED_EVENT":
        this.deliverRaw({ ...reading, value: "not-a-number", measuredAt: undefined });
        return;
      default:
        this.deliver(reading);
    }
  }

  getDiagnostics(): SimulatorDiagnostics {
    const statePenalty = this.state === "NORMAL" ? 0 : this.state === "RECOVERY" ? 10 : 40;
    return {
      state: this.state,
      connected: this.connected,
      running: this.running,
      bufferedReadings: this.buffer.length,
      emittedReadings: this.emittedReadings,
      duplicateEvents: this.duplicateEvents,
      connectionQuality: Math.max(0, 100 - statePenalty),
    };
  }

  private restartTimers(): void {
    for (const timer of this.timers.values()) clearInterval(timer);
    this.timers.clear();
    for (const [metric, hz] of Object.entries(this.frequencies) as [SensorMetric, number][]) {
      if (hz > 0) this.timers.set(metric, setInterval(() => this.generate(metric), Math.max(50, 1000 / hz)));
    }
  }

  private makeReading(metric: SensorMetric): SensorReading {
    const measured = this.now();
    if (this.state === "CLOCK_DRIFT") measured.setMinutes(measured.getMinutes() + (this.options.clockDriftMinutes ?? 10));
    const noise = (this.random() - 0.5) * (metric === "activity" ? 4 : 2);
    const reading: SensorReading = {
      id: crypto.randomUUID(),
      deviceId: this.options.deviceId,
      metric,
      value: Number(Math.max(0, BASELINES[metric] + noise).toFixed(2)),
      unit: METRIC_DEFAULT_UNITS[metric],
      measuredAt: measured.toISOString(),
      syncStatus: "pending",
      sequenceNumber: this.sequenceNumber++,
    };
    this.lastReading = reading;
    return reading;
  }

  private flushBuffer(shuffle: boolean): void {
    const items = this.buffer.splice(0);
    if (shuffle) items.sort(() => this.random() - 0.5);
    for (const reading of items) this.deliver(reading);
  }

  private deliver(reading: SensorReading): void {
    if (!this.connected && this.state !== "NORMAL") {
      this.buffer.push(reading);
      return;
    }
    this.emittedReadings += 1;
    for (const listener of this.listeners) listener(reading);
    this.deliverRaw(reading);
  }

  private deliverRaw(payload: unknown): void {
    for (const listener of this.rawListeners) listener(payload);
  }

  private random(): number { return (this.options.random ?? Math.random)(); }
  private now(): Date { return new Date((this.options.now ?? (() => new Date()))().getTime()); }
}
