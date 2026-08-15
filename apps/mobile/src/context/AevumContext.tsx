import { SensorReadingSchema, type ChaosState, type SensorMetric, type SensorReading } from "@aevum/contracts";
import { SimulatedWearableAdapter, type SimulatorDiagnostics } from "@aevum/sensor-simulator";
import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { commitReading, initializeDatabase, queueStats, type QueueStats } from "../storage/database";
import { SyncEngine, type SyncSnapshot } from "../sync/sync-engine";

interface AevumValue {
  latest: Partial<Record<SensorMetric, SensorReading>>;
  diagnostics: SimulatorDiagnostics;
  sync: SyncSnapshot;
  queue: QueueStats;
  setChaosState(state: ChaosState): Promise<void>;
  setFrequency(metric: SensorMetric, hz: number): void;
  start(): Promise<void>;
  stop(): void;
  syncNow(): void;
}

const initialDiagnostics: SimulatorDiagnostics = { state: "NORMAL", connected: false, running: false, bufferedReadings: 0, emittedReadings: 0, duplicateEvents: 0, connectionQuality: 100 };
const Context = createContext<AevumValue | null>(null);

export function AevumProvider({ children }: React.PropsWithChildren): React.JSX.Element {
  const adapter = useMemo(() => new SimulatedWearableAdapter({ deviceId: "aevum-watch-001" }), []);
  const engine = useMemo(() => new SyncEngine(process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000"), []);
  const duplicateDrops = useRef(0);
  const [latest, setLatest] = useState<Partial<Record<SensorMetric, SensorReading>>>({});
  const [diagnostics, setDiagnostics] = useState(initialDiagnostics);
  const [sync, setSync] = useState<SyncSnapshot>({ state: "idle", retryInMs: 0, lastBatchSize: 0 });
  const [queue, setQueue] = useState<QueueStats>({ pending: 0, failed: 0, duplicateDrops: 0 });

  useEffect(() => {
    void initializeDatabase();
    const unsubscribeRaw = adapter.subscribeRaw((payload) => {
      const parsed = SensorReadingSchema.safeParse(payload);
      if (!parsed.success) return;
      void commitReading(parsed.data).then((inserted) => {
        if (!inserted) duplicateDrops.current += 1;
        else { setLatest((current) => ({ ...current, [parsed.data.metric]: parsed.data })); void engine.sync(); }
      });
    });
    const unsubscribeSync = engine.subscribe(setSync);
    const poll = setInterval(() => {
      setDiagnostics(adapter.getDiagnostics());
      void queueStats(duplicateDrops.current).then(setQueue);
    }, 500);
    return () => { unsubscribeRaw(); unsubscribeSync(); clearInterval(poll); adapter.stop(); engine.stop(); };
  }, [adapter, engine]);

  const value: AevumValue = {
    latest, diagnostics, sync, queue,
    async setChaosState(state) { await adapter.setChaosState(state); setDiagnostics(adapter.getDiagnostics()); },
    setFrequency(metric, hz) { adapter.setFrequency(metric, hz); },
    async start() { await initializeDatabase(); await adapter.connect(); adapter.start(); setDiagnostics(adapter.getDiagnostics()); },
    stop() { adapter.stop(); void adapter.disconnect(); setDiagnostics(adapter.getDiagnostics()); },
    syncNow() { void engine.sync(); },
  };
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useAevum(): AevumValue {
  const value = useContext(Context);
  if (!value) throw new Error("useAevum must be used inside AevumProvider");
  return value;
}
