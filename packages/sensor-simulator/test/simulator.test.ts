import { describe, expect, it, vi } from "vitest";
import { SimulatedWearableAdapter } from "../src/index.js";

describe("SimulatedWearableAdapter", () => {
  it("buffers offline readings and flushes them during recovery", async () => {
    const adapter = new SimulatedWearableAdapter({ deviceId: "watch-1", random: () => 0.5 });
    const received: string[] = [];
    adapter.subscribe((reading) => received.push(reading.id));
    await adapter.setChaosState("OFFLINE");
    adapter.generate("heart_rate");
    expect(adapter.getDiagnostics().bufferedReadings).toBe(1);
    await adapter.setChaosState("RECOVERY");
    expect(received).toHaveLength(1);
    expect(adapter.getDiagnostics().state).toBe("NORMAL");
  });

  it("emits identical IDs in duplicate mode", async () => {
    const adapter = new SimulatedWearableAdapter({ deviceId: "watch-1" });
    const ids: string[] = [];
    adapter.subscribe((reading) => ids.push(reading.id));
    await adapter.connect();
    await adapter.setChaosState("DUPLICATE_EVENTS");
    adapter.generate("skin_temp");
    expect(ids).toHaveLength(2);
    expect(ids[0]).toBe(ids[1]);
  });

  it("sends malformed data only through the untrusted boundary", async () => {
    const adapter = new SimulatedWearableAdapter({ deviceId: "watch-1" });
    const typed = vi.fn();
    const raw = vi.fn();
    adapter.subscribe(typed);
    adapter.subscribeRaw(raw);
    await adapter.connect();
    await adapter.setChaosState("MALFORMED_EVENT");
    adapter.generate("activity");
    expect(typed).not.toHaveBeenCalled();
    expect(raw).toHaveBeenCalledOnce();
  });
});
