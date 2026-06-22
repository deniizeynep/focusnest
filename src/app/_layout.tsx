import { Stack } from "expo-router";
import { StatusBar, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useAppStore } from "../stores/appStore";
import { getColors } from "../theme";

export default function RootLayout() {
  const { themeMode } = useAppStore();
  const C = getColors(themeMode);

  return (
    <GestureHandlerRootView style={[styles.root, { backgroundColor: C.bg }]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: C.bg,
          },
        }}
      >
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
