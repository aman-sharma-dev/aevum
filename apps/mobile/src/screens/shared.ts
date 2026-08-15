import { StyleSheet } from "react-native";
import { colors } from "../theme";

export const screenStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 18, paddingBottom: 36, gap: 14 },
  eyebrow: { color: colors.primary, fontWeight: "700", letterSpacing: 1, fontSize: 12 },
  title: { color: colors.text, fontSize: 28, fontWeight: "800" },
  subtitle: { color: colors.muted, lineHeight: 21 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  split: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
  body: { color: colors.text, fontSize: 14 },
});
