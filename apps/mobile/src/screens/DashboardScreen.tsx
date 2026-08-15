import type { SensorMetric } from "@aevum/contracts";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Card, Label, Value } from "../components/UI";
import { useAevum } from "../context/AevumContext";
import { colors } from "../theme";
import { screenStyles as s } from "./shared";

const metricNames: Record<SensorMetric, string> = { heart_rate: "Heart rate", skin_temp: "Skin temp", sleep_duration: "Sleep", activity: "Activity", respiratory_rate: "Respiration" };

export function DashboardScreen(): React.JSX.Element {
  const { latest, diagnostics, sync, queue } = useAevum();
  return <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>LIVE EDGE TELEMETRY</Text><Text style={s.title}>Dashboard</Text>
    <View style={s.split}>
      <Card style={s.flex}><Label>Connection</Label><Value color={diagnostics.connected ? colors.primary : colors.danger}>{diagnostics.connected ? "Online" : "Offline"}</Value><Text style={s.subtitle}>{diagnostics.connectionQuality}% quality</Text></Card>
      <Card style={s.flex}><Label>Sync engine</Label><Value color={sync.state === "error" ? colors.danger : colors.blue}>{sync.state}</Value><Text style={s.subtitle}>{queue.pending} queued</Text></Card>
    </View>
    <Text style={s.eyebrow}>LATEST READINGS</Text>
    {(Object.keys(metricNames) as SensorMetric[]).map((metric) => <Card key={metric}>
      <Label>{metricNames[metric]}</Label><Value>{latest[metric] ? `${latest[metric]?.value} ${latest[metric]?.unit}` : "—"}</Value>
      <Text style={s.subtitle}>{latest[metric] ? new Date(latest[metric]!.measuredAt).toLocaleTimeString() : "Waiting for stream"}</Text>
    </Card>)}
    <Card><Label>5-minute trend summary</Label><Text style={s.body}>Live values are committed locally first. Open History for the interactive metric window; server analytics are available at `/analytics/summary`.</Text></Card>
  </ScrollView>;
}
