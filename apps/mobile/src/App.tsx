import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import React from "react";
import { StatusBar, StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Svg, { Circle, Path, Polyline } from "react-native-svg";
import { AevumProvider } from "./context/AevumContext";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DeviceScreen } from "./screens/DeviceScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { SyncDebuggerScreen } from "./screens/SyncDebuggerScreen";
import { colors } from "./theme";

const Tabs = createBottomTabNavigator();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, border: colors.border, text: colors.text } };

function TabIcon({ name, color }: { name: string; color: string }): React.JSX.Element {
  const common = { fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <Svg width={23} height={23} viewBox="0 0 24 24">
    {name === "Dashboard" && <><Path d="M4 13h6V4H4zM14 20h6v-9h-6zM4 20h6v-3H4zM14 7h6V4h-6z" {...common} /></>}
    {name === "History" && <><Circle cx="12" cy="12" r="8" {...common} /><Path d="M12 7v5l3 2M7 3 4 1-2 3" {...common} /></>}
    {name === "Device" && <><Path d="M8 4h8l1 4-1 12H8L7 8z" {...common} /><Path d="M9 8h6M10 12h4" {...common} /></>}
    {name === "Sync Debugger" && <><Polyline points="4,7 8,7 10,4 13,14 15,10 17,17 19,12 21,12" {...common} /><Path d="M4 20h16" {...common} /></>}
  </Svg>;
}

export default function App(): React.JSX.Element {
  return <SafeAreaProvider><AevumProvider><StatusBar barStyle="light-content" backgroundColor={colors.background} /><SafeAreaView style={styles.safeArea} edges={["top"]}><NavigationContainer theme={theme}><Tabs.Navigator screenOptions={({ route }) => ({ headerShown: false, tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />, tabBarLabelStyle: { fontSize: 10, fontWeight: "700" }, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { position: "absolute", left: 12, right: 12, bottom: 10, height: 68, paddingTop: 7, paddingBottom: 8, backgroundColor: colors.soft, borderColor: colors.border, borderWidth: 1, borderTopWidth: 1, borderRadius: 22, elevation: 10, shadowColor: "#000", shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } } })}>
    <Tabs.Screen name="Dashboard" component={DashboardScreen} />
    <Tabs.Screen name="History" component={HistoryScreen} />
    <Tabs.Screen name="Device" component={DeviceScreen} />
    <Tabs.Screen name="Sync Debugger" component={SyncDebuggerScreen} />
  </Tabs.Navigator></NavigationContainer></SafeAreaView></AevumProvider></SafeAreaProvider>;
}

const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.background } });
