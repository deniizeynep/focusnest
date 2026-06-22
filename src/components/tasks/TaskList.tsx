import { Ionicons } from "@expo/vector-icons";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import type { Task } from "../../stores/taskStore";
import { getColors, Spacing, Typography } from "../../theme";
import { TaskCard } from "./TaskCard";

interface TaskListProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddPress: () => void;
  emptyMessage?: string;
}

export function TaskList({
  tasks,
  onToggle,
  onDelete,
  onAddPress,
  emptyMessage,
}: TaskListProps) {
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const styles = createStyles(C);

  const t = (key: TranslationKey) => translate(language, key);

  const finalEmptyMessage = emptyMessage ?? t("emptyTaskMessage");

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item.id}
      contentContainerStyle={
        tasks.length === 0 ? styles.emptyContainer : styles.listContent
      }
      showsVerticalScrollIndicator={false}
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      ListEmptyComponent={
        <View style={styles.emptyState}>
          <Ionicons name="document-text-outline" style={styles.emptyEmoji} />

          <Text style={styles.emptyTitle}>{t("emptyList")}</Text>

          <Text style={styles.emptySubtitle}>{finalEmptyMessage}</Text>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={onAddPress}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{t("addTask")}</Text>
          </TouchableOpacity>
        </View>
      }
      renderItem={({ item }) => (
        <TaskCard
          task={item}
          onToggle={() => onToggle(item.id)}
          onDelete={() => onDelete(item.id)}
        />
      )}
    />
  );
}

const createStyles = (C: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    listContent: {
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing["4xl"],
    },

    emptyContainer: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
    },

    emptyState: {
      alignItems: "center",
      paddingTop: 80,
      gap: Spacing.sm,
    },

    emptyEmoji: {
      fontSize: 48,
      marginBottom: Spacing.sm,
    },

    emptyTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.semibold,
      color: C.textSecondary,
    },

    emptySubtitle: {
      fontSize: Typography.sm,
      color: C.textMuted,
      textAlign: "center",
      paddingHorizontal: Spacing.xl,
      lineHeight: 20,
    },

    addBtn: {
      marginTop: Spacing.base,
      backgroundColor: C.accent,
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderRadius: 999,
    },

    addBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: "#fff",
    },
  });
