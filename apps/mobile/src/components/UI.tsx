import React from "react";
import { Pressable, StyleSheet, Text, View, type ViewProps } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { colors } from "../theme";

export function Card({ children, style }: ViewProps): React.JSX.Element {
  return <View style={[styles.card, style]}>{children}</View>;
}
export function Label({ children }: React.PropsWithChildren): React.JSX.Element { return <Text style={styles.label}>{children}</Text>; }
export function Value({ children, color = colors.text }: React.PropsWithChildren<{ color?: string }>): React.JSX.Element { return <Text style={[styles.value, { color }]}>{children}</Text>; }
export function Action({ title, onPress, active = false }: { title: string; onPress(): void; active?: boolean }): React.JSX.Element {
  return <Pressable onPress={onPress} style={[styles.action, active && styles.actionActive]}><Text style={[styles.actionText, active && styles.actionTextActive]}>{title}</Text></Pressable>;
}
export function MiniChart({ values, color = colors.primary }: { values: number[]; color?: string }): React.JSX.Element {
  const width = 320, height = 110;
  if (values.length < 2) return <View style={styles.empty}><Text style={styles.label}>Collecting telemetry…</Text></View>;
  const min = Math.min(...values), range = Math.max(1, Math.max(...values) - min);
  const points = values.map((value, index) => `${(index / (values.length - 1)) * width},${height - ((value - min) / range) * (height - 12) - 6}`).join(" ");
  return <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}><Polyline points={points} fill="none" stroke={color} strokeWidth="3" /></Svg>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth, borderRadius: 20, padding: 16, gap: 8, shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "600", letterSpacing: 0.8, textTransform: "uppercase" },
  value: { color: colors.text, fontSize: 24, lineHeight: 30, fontWeight: "700", letterSpacing: -0.4 },
  action: { borderColor: colors.border, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, backgroundColor: colors.elevated },
  actionActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  actionText: { color: colors.text, fontSize: 12, fontWeight: "600" },
  actionTextActive: { color: colors.background },
  empty: { height: 110, alignItems: "center", justifyContent: "center" },
});
