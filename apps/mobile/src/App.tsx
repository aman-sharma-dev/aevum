import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import React from "react";
import { StatusBar } from "react-native";
import { AevumProvider } from "./context/AevumContext";
import { DashboardScreen } from "./screens/DashboardScreen";
import { DeviceScreen } from "./screens/DeviceScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { SyncDebuggerScreen } from "./screens/SyncDebuggerScreen";
import { colors } from "./theme";

const Tabs = createBottomTabNavigator();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, primary: colors.primary, background: colors.background, card: colors.surface, border: colors.border, text: colors.text } };

export default function App(): React.JSX.Element {
  return <AevumProvider><StatusBar barStyle="light-content" /><NavigationContainer theme={theme}><Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 66, paddingBottom: 8 } }}>
    <Tabs.Screen name="Dashboard" component={DashboardScreen} />
    <Tabs.Screen name="History" component={HistoryScreen} />
    <Tabs.Screen name="Device" component={DeviceScreen} />
    <Tabs.Screen name="Sync Debugger" component={SyncDebuggerScreen} />
  </Tabs.Navigator></NavigationContainer></AevumProvider>;
}
