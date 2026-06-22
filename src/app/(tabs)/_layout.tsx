import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { getColors, Radius, Spacing, Typography } from "../../theme";

function TabIcon({
  name,
  focused,
  C,
}: {
  name: keyof typeof Ionicons.glyphMap;
  focused: boolean;
  C: ReturnType<typeof getColors>;
}) {
  return (
    <View
      style={[
        styles.iconWrap,
        focused && {
          backgroundColor: C.accentDim,
          borderColor: C.accent,
        },
      ]}
    >
      <Ionicons
        name={name}
        size={20}
        color={focused ? C.accent : C.textMuted}
      />
    </View>
  );
}

export default function TabsLayout() {
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const t = (key: TranslationKey) => translate(language, key);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.bgCard,
          borderTopColor: C.border,
          borderTopWidth: 1,
          height: 68,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
        },
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textMuted,
        tabBarLabelStyle: {
          fontSize: Typography.xs,
          fontWeight: Typography.semibold,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("focus"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="timer-outline" focused={focused} C={C} />
          ),
        }}
      />

      <Tabs.Screen
        name="tasks"
        options={{
          title: t("tasks"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="checkmark-done-outline" focused={focused} C={C} />
          ),
        }}
      />

      <Tabs.Screen
        name="stats"
        options={{
          title: t("stats"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="bar-chart-outline" focused={focused} C={C} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ focused }) => (
            <TabIcon name="person-outline" focused={focused} C={C} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 44,
    height: 30,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
});
