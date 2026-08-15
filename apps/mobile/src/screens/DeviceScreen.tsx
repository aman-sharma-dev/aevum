import { CHAOS_STATES, SENSOR_METRICS, type ChaosState, type SensorMetric } from "@aevum/contracts";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Action, Card, Label, Value } from "../components/UI";
import { useAevum } from "../context/AevumContext";
import { colors } from "../theme";
import { screenStyles as s } from "./shared";

export function DeviceScreen(): React.JSX.Element {
  const { diagnostics, setChaosState, setFrequency, start, stop } = useAevum();
  const [frequencies, setFrequencies] = useState<Record<SensorMetric, number>>({ heart_rate: 1, skin_temp: 1, sleep_duration: 0, activity: 1, respiratory_rate: 1 });
  const adjust = (metric: SensorMetric, delta: number) => {
    const value = Math.max(0, Math.min(20, frequencies[metric] + delta));
    setFrequencies((current) => ({ ...current, [metric]: value })); setFrequency(metric, value);
  };
  return <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>WEARABLE ADAPTER</Text><Text style={s.title}>Device & chaos</Text>
    <Card><Label>Stream</Label><Value color={diagnostics.running ? colors.primary : colors.muted}>{diagnostics.running ? "Running" : "Stopped"}</Value><View style={s.row}><Action title="Start" active={diagnostics.running} onPress={() => void start()} /><Action title="Stop" onPress={stop} /></View></Card>
    <Card><Label>Chaos state</Label><Value>{diagnostics.state}</Value><View style={s.row}>{CHAOS_STATES.map((state: ChaosState) => <Action key={state} title={state} active={diagnostics.state === state} onPress={() => void setChaosState(state)} />)}</View></Card>
    <Card><Label>Metric frequencies</Label>{SENSOR_METRICS.map((metric) => <View key={metric} style={[s.split, { alignItems: "center" }]}><Text style={[s.body, s.flex]}>{metric.replaceAll("_", " ")}</Text><Action title="−" onPress={() => adjust(metric, -1)} /><Text style={s.body}>{frequencies[metric]} Hz</Text><Action title="+" onPress={() => adjust(metric, 1)} /></View>)}</Card>
    <Card><Label>Connection quality</Label><Value>{diagnostics.connectionQuality}%</Value><Text style={s.subtitle}>{diagnostics.bufferedReadings} simulator-buffered readings</Text></Card>
  </ScrollView>;
}
