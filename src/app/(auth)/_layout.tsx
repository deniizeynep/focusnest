import { Stack } from "expo-router";
import { useAppStore } from "../../stores/appStore";
import { getColors } from "../../theme";

export default function AuthLayout() {
  const { themeMode } = useAppStore();
  const C = getColors(themeMode);

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: {
          backgroundColor: C.bg,
        },
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
