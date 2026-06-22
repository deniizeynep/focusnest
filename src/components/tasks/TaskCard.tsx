import { Ionicons } from "@expo/vector-icons";
import { useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import type { Task } from "../../stores/taskStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";
import { PomodoroDots } from "../ui/PomodoroDotsRow";
import { TagChip } from "../ui/TagChip";

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onPress?: () => void;
}

export function TaskCard({ task, onToggle, onDelete, onPress }: TaskCardProps) {
  const swipeRef = useRef<Swipeable>(null);
  const isDone = task.status === "done";
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = createStyles(C, Shadow);

  const t = (key: TranslationKey) => translate(language, key);

  const getTagText = (tagLabel?: string) => {
    if (!tagLabel) return t("other");

    const tagMap: Record<string, TranslationKey> = {
      development: "development",
      Geliştirme: "development",
      Development: "development",

      design: "design",
      Tasarım: "design",
      Design: "design",

      research: "research",
      Araştırma: "research",
      Research: "research",

      meeting: "meeting",
      Toplantı: "meeting",
      Meeting: "meeting",

      other: "other",
      Diğer: "other",
      Other: "other",
    };

    const key = tagMap[tagLabel];

    return key ? t(key) : tagLabel;
  };

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [80, 0],
    });
    return (
      <Animated.View
        style={[
          styles.swipeAction,
          styles.deleteAction,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeBtn}
          onPress={() => {
            swipeRef.current?.close();
            onDelete();
          }}
        >
          <Text style={styles.swipeIcon}>🗑</Text>
          <Text style={styles.swipeLabel}>{t("delete")}</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderLeftActions = (
    progress: Animated.AnimatedInterpolation<number>,
  ) => {
    const translateX = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [-80, 0],
    });
    return (
      <Animated.View
        style={[
          styles.swipeAction,
          styles.doneAction,
          { transform: [{ translateX }] },
        ]}
      >
        <TouchableOpacity
          style={styles.swipeBtn}
          onPress={() => {
            swipeRef.current?.close();
            onToggle();
          }}
        >
          <Ionicons
            name={isDone ? "arrow-undo-outline" : "checkmark"}
            size={22}
            color="#fff"
          />
          <Text style={styles.swipeLabel}>
            {isDone ? t("undo") : t("complete")}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeRef}
      renderRightActions={renderRightActions}
      renderLeftActions={renderLeftActions}
      overshootRight={false}
      overshootLeft={false}
    >
      <View style={[styles.card, isDone && styles.cardDone]}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            isDone && {
              backgroundColor: C.success,
              borderColor: C.success,
            },
          ]}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          {isDone && <Ionicons name="checkmark" style={styles.checkmark} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.content}
          onPress={onPress}
          activeOpacity={0.8}
        >
          <View style={styles.topRow}>
            <Text
              style={[styles.title, isDone && styles.titleDone]}
              numberOfLines={2}
            >
              {task.title}
            </Text>
          </View>

          {task.description ? (
            <Text
              style={[styles.description, isDone && styles.titleDone]}
              numberOfLines={2}
            >
              {task.description}
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <TagChip
              label={getTagText(task.tagLabel)}
              color={task.tagColor}
              small
            />
            <PomodoroDots
              total={task.estimatedPomodoros}
              completed={task.completedPomodoros}
              color={task.tagColor}
              size={6}
            />
            <Text style={styles.metaText}>
              {task.completedPomodoros}/{task.estimatedPomodoros}
            </Text>
          </View>

          {task.dueDate ? (
            <Text style={styles.dueDate}>📅 {task.dueDate}</Text>
          ) : null}
        </TouchableOpacity>

        {task.priority > 0 && (
          <View
            style={[
              styles.priorityBar,
              {
                backgroundColor:
                  task.priority === 3
                    ? C.accent
                    : task.priority === 2
                      ? C.warning
                      : C.success,
              },
            ]}
          />
        )}
      </View>
    </Swipeable>
  );
}

const createStyles = (
  C: ReturnType<typeof getColors>,
  Shadow: ReturnType<typeof getShadow>,
) =>
  StyleSheet.create({
    card: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: C.bgCard,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.base,
      gap: Spacing.md,
      ...Shadow.subtle,
    },
    cardDone: {
      opacity: 0.6,
    },

    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: C.textMuted,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 2,
      flexShrink: 0,
    },
    checkmark: {
      fontSize: 12,
      color: "#fff",
      fontWeight: "700",
    },

    content: {
      flex: 1,
      gap: Spacing.sm,
    },
    topRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    title: {
      flex: 1,
      fontSize: Typography.base,
      fontWeight: Typography.medium,
      color: C.textPrimary,
      lineHeight: 21,
    },
    titleDone: {
      textDecorationLine: "line-through",
      color: C.textMuted,
    },

    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    metaText: {
      fontSize: Typography.xs,
      color: C.textMuted,
    },

    dueDate: {
      fontSize: Typography.xs,
      color: C.textMuted,
    },

    priorityBar: {
      width: 3,
      borderRadius: 2,
      alignSelf: "stretch",
      flexShrink: 0,
    },

    swipeAction: {
      justifyContent: "center",
      alignItems: "center",
      borderRadius: Radius.lg,
      width: 76,
    },
    doneAction: {
      backgroundColor: C.successDim,
      marginRight: 4,
    },
    deleteAction: {
      backgroundColor: C.accentDim,
      marginLeft: 4,
    },
    swipeBtn: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 4,
      width: "100%",
    },
    swipeIcon: { fontSize: 20 },
    swipeLabel: {
      fontSize: Typography.xs,
      color: C.textSecondary,
      fontWeight: Typography.medium,
    },
    description: {
      fontSize: Typography.sm,
      color: C.textSecondary,
      lineHeight: 18,
    },
  });
