import { SENSOR_METRICS, type SensorMetric, type SensorReading } from "@aevum/contracts";
import React, { useEffect, useState } from "react";
import { ScrollView, Text } from "react-native";
import { Action, Card, Label, MiniChart, Value } from "../components/UI";
import { queryReadings } from "../storage/database";
import { screenStyles as s } from "./shared";

const ranges = { "1h": 1, "24h": 24, "7d": 168 } as const;
type Range = keyof typeof ranges;

export function HistoryScreen(): React.JSX.Element {
  const [metric, setMetric] = useState<SensorMetric>("heart_rate");
  const [range, setRange] = useState<Range>("1h");
  const [items, setItems] = useState<SensorReading[]>([]);
  useEffect(() => {
    const load = () => void queryReadings(metric, new Date(Date.now() - ranges[range] * 3_600_000).toISOString()).then(setItems);
    load(); const timer = setInterval(load, 2000); return () => clearInterval(timer);
  }, [metric, range]);
  return <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>LOCAL TIME SERIES</Text><Text style={s.title}>History</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{SENSOR_METRICS.map((item) => <Action key={item} title={item.replaceAll("_", " ")} active={item === metric} onPress={() => setMetric(item)} />)}</ScrollView>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>{(Object.keys(ranges) as Range[]).map((item) => <Action key={item} title={item} active={item === range} onPress={() => setRange(item)} />)}</ScrollView>
    <Card><Label>{metric.replaceAll("_", " ")} · {range}</Label><MiniChart values={items.map((item) => item.value)} /><Value>{items.length ? `${items.at(-1)?.value} ${items.at(-1)?.unit}` : "No data"}</Value><Text style={s.subtitle}>{items.length} local points · updates every 2 seconds</Text></Card>
  </ScrollView>;
}
