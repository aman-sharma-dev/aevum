import { StyleSheet } from "react-native";
import { colors } from "../theme";

export const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 18, paddingTop: 16, paddingBottom: 108, gap: 14 },
  eyebrow: { color: colors.primary, fontWeight: "700", letterSpacing: 1.4, fontSize: 11 },
  title: { color: colors.text, fontSize: 30, lineHeight: 36, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  split: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
});
