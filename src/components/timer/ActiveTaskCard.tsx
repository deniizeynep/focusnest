import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import type { Task } from "../../stores/taskStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";
import { PomodoroDots } from "../ui/PomodoroDotsRow";
import { TagChip } from "../ui/TagChip";

interface ActiveTaskCardProps {
  task: Task | null;
  onPress: () => void;
}

export function ActiveTaskCard({ task, onPress }: ActiveTaskCardProps) {
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = createStyles(C, Shadow);

  const t = (key: TranslationKey) => translate(language, key);

  if (!task) {
    return (
      <TouchableOpacity
        style={[styles.card, styles.emptyCard]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Ionicons name="add" size={28} color={C.textMuted} />
        <Text style={styles.emptyText}>{t("noActiveTask")}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.accentBar, { backgroundColor: task.tagColor }]} />

      <View style={styles.content}>
        <TagChip label={task.tagLabel} color={task.tagColor} />

        <Text style={styles.title} numberOfLines={2}>
          {task.title}
        </Text>

        <View style={styles.footer}>
          <PomodoroDots
            total={task.estimatedPomodoros}
            completed={task.completedPomodoros}
            color={task.tagColor}
            size={8}
          />

          <Text style={styles.progress}>
            {task.completedPomodoros}/{task.estimatedPomodoros} {t("pomodoro")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (
  C: ReturnType<typeof getColors>,
  Shadow: ReturnType<typeof getShadow>,
) =>
  StyleSheet.create({
    card: {
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bgCard,
      flexDirection: "row",
      overflow: "hidden",
      marginBottom: Spacing.xl,
      ...Shadow.card,
    },
    emptyCard: {
      alignItems: "center",
      justifyContent: "center",
      padding: Spacing.xl,
      flexDirection: "row",
      gap: Spacing.md,
    },
    emptyText: {
      fontSize: Typography.base,
      color: C.textMuted,
      fontWeight: Typography.medium,
    },
    accentBar: {
      width: 4,
    },
    content: {
      flex: 1,
      padding: Spacing.base,
      gap: Spacing.sm,
    },
    title: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: C.textPrimary,
      lineHeight: 22,
    },
    footer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    progress: {
      fontSize: Typography.xs,
      color: C.textSecondary,
    },
  });
