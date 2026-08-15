import React from "react";
import { ScrollView, Text, View } from "react-native";
import { Action, Card, Label, Value } from "../components/UI";
import { useAevum } from "../context/AevumContext";
import { colors } from "../theme";
import { screenStyles as s } from "./shared";

export function SyncDebuggerScreen(): React.JSX.Element {
  const { queue, sync, syncNow } = useAevum();
  return <ScrollView style={s.container} contentContainerStyle={s.content}>
    <Text style={s.eyebrow}>ENGINEERING OBSERVABILITY</Text><Text style={s.title}>Sync debugger</Text>
    <View style={s.split}><Card style={s.flex}><Label>Pending queue</Label><Value color={queue.pending ? colors.warning : colors.primary}>{queue.pending}</Value></Card><Card style={s.flex}><Label>Failed payloads</Label><Value color={queue.failed ? colors.danger : colors.primary}>{queue.failed}</Value></Card></View>
    <View style={s.split}><Card style={s.flex}><Label>Duplicate drops</Label><Value>{queue.duplicateDrops}</Value></Card><Card style={s.flex}><Label>Last batch</Label><Value>{sync.lastBatchSize}</Value></Card></View>
    <Card><Label>Retry backoff</Label><Value color={sync.retryInMs ? colors.warning : colors.muted}>{sync.retryInMs ? `${(sync.retryInMs / 1000).toFixed(1)}s` : "Idle"}</Value>{sync.error ? <Text style={{ color: colors.danger }}>{sync.error}</Text> : null}</Card>
    <Card><Label>Last successful sync</Label><Text style={s.body}>{sync.lastSuccessfulAt ? new Date(sync.lastSuccessfulAt).toLocaleString() : "No successful upload yet"}</Text><Action title={sync.state === "syncing" ? "Syncing…" : "Sync now"} active={sync.state === "syncing"} onPress={syncNow} /></Card>
  </ScrollView>;
}
