import type { SensorMetric } from "@aevum/contracts";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Card, Label, Value } from "../components/UI";
import { useAevum } from "../context/AevumContext";
import { colors } from "../theme";
import { screenStyles as s } from "./shared";

const metricNames: Record<SensorMetric, string> = { heart_rate: "Heart rate", skin_temp: "Skin temp", sleep_duration: "Sleep", activity: "Activity", respiratory_rate: "Respiration" };
const metricColors: Record<SensorMetric, string> = { heart_rate: colors.danger, skin_temp: colors.warning, sleep_duration: colors.purple, activity: colors.primary, respiratory_rate: colors.blue };

export function DashboardScreen(): React.JSX.Element {
  const { latest, diagnostics, sync, queue } = useAevum();
  return <ScrollView style={s.container} contentContainerStyle={s.content}>
    <View style={styles.heading}><Text style={s.eyebrow}>LIVE EDGE TELEMETRY</Text><Text style={s.title}>Dashboard</Text></View>
    <View style={s.split}>
      <Card style={s.flex}><Label>Connection</Label><Value color={diagnostics.connected ? colors.primary : colors.danger}>{diagnostics.connected ? "Online" : "Offline"}</Value><Text style={s.subtitle}>{diagnostics.connectionQuality}% quality</Text></Card>
      <Card style={s.flex}><Label>Sync engine</Label><Value color={sync.state === "error" ? colors.danger : colors.blue}>{sync.state}</Value><Text style={s.subtitle}>{queue.pending} queued</Text></Card>
    </View>
    <View style={styles.sectionHeading}><Text style={s.eyebrow}>LATEST READINGS</Text><Text style={styles.sectionMeta}>LOCAL STREAM</Text></View>
    <View style={styles.metrics}>{(Object.keys(metricNames) as SensorMetric[]).map((metric, index, metrics) => <Card key={metric} style={[styles.metricCard, index === metrics.length - 1 && styles.metricCardWide]}>
      <View style={[styles.metricAccent, { backgroundColor: metricColors[metric] }]} />
      <Label>{metricNames[metric]}</Label><Value>{latest[metric] ? `${latest[metric]?.value} ${latest[metric]?.unit}` : "—"}</Value>
      <Text style={s.subtitle}>{latest[metric] ? new Date(latest[metric]!.measuredAt).toLocaleTimeString() : "Waiting for stream"}</Text>
    </Card>)}</View>
    <Card><Label>5-minute trend summary</Label><Text style={s.body}>Live values are committed locally first. Open History for the interactive metric window; server analytics are available at `/analytics/summary`.</Text></Card>
  </ScrollView>;
}

const styles = StyleSheet.create({
  heading: { gap: 2 },
  sectionHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  sectionMeta: { color: colors.muted, fontSize: 9, fontWeight: "700", letterSpacing: 0.8 },
  metrics: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  metricCard: { width: "47.5%", minHeight: 136, overflow: "hidden" },
  metricCardWide: { width: "100%", minHeight: 122 },
  metricAccent: { position: "absolute", left: 0, top: 18, width: 3, height: 28, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
});
