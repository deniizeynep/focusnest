import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddTaskBottomSheet } from "../../components/tasks/AddTaskBottomSheet";
import { TaskCard } from "../../components/tasks/TaskCard";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { useTaskStore, type Task } from "../../stores/taskStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

type Filter = "all" | "active" | "done";

export default function TasksTab() {
  const insets = useSafeAreaInsets();
  const { themeMode, language } = useAppStore();

  const t = (key: TranslationKey) => translate(language, key);
  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);

  const { tasks, addTask, toggleDone, deleteTask, loadTasks, error } =
    useTaskStore();

  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const filtered = tasks.filter((task) => {
    const statusMatch =
      filter === "all"
        ? task.status !== "archived"
        : filter === "active"
          ? task.status === "todo" || task.status === "in_progress"
          : task.status === "done";

    const searchMatch =
      task.title.toLowerCase().includes(search.toLowerCase()) ||
      task.description?.toLowerCase().includes(search.toLowerCase());

    return statusMatch && searchMatch;
  });

  const activeCount = tasks.filter(
    (task) => task.status === "todo" || task.status === "in_progress",
  ).length;

  const doneCount = tasks.filter((task) => task.status === "done").length;

  const FILTERS: { key: Filter; label: string; count: number }[] = [
    {
      key: "all",
      label: t("all"),
      count: tasks.filter((task) => task.status !== "archived").length,
    },
    {
      key: "active",
      label: t("activeFilter"),
      count: activeCount,
    },
    {
      key: "done",
      label: t("completedFilter"),
      count: doneCount,
    },
  ];

  const getPriorityText = (priority?: number) => {
    if (priority === 3) return t("priorityHigh");
    if (priority === 2) return t("priorityMedium");
    if (priority === 1) return t("priorityLow");
    return t("priorityNone");
  };

  const getTagText = (tagLabel?: string) => {
    if (!tagLabel) return t("taskDetailNoTag");

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

  return (
    <View
      style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}
    >
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />

      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: C.textPrimary }]}>
            {t("tasksTitle")}
          </Text>

          <Text style={[styles.subtitle, { color: C.textSecondary }]}>
            {activeCount} {t("active")} · {doneCount} {t("completed")}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.addBtn,
            {
              backgroundColor: C.accent,
              ...Shadow.accent,
            },
          ]}
          onPress={() => setShowAdd(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      <View
        style={[
          styles.searchRow,
          {
            backgroundColor: C.bgCard,
            borderColor: C.border,
            ...Shadow.subtle,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={C.textMuted} />

        <TextInput
          style={[styles.searchInput, { color: C.textPrimary }]}
          value={search}
          onChangeText={setSearch}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor={C.textMuted}
        />

        {search.length > 0 ? (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Ionicons name="close" size={18} color={C.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {error ? (
        <View
          style={[
            styles.errorBox,
            {
              backgroundColor: C.accentDim,
              borderColor: C.accent,
            },
          ]}
        >
          <Text style={[styles.errorText, { color: C.accent }]}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.filterRow}>
        {FILTERS.map((opt) => (
          <TouchableOpacity
            key={opt.key}
            style={[
              styles.filterBtn,
              {
                backgroundColor: C.bgCard,
                borderColor: filter === opt.key ? C.accent : C.border,
              },
              filter === opt.key && {
                backgroundColor: C.accentDim,
              },
            ]}
            onPress={() => setFilter(opt.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color: filter === opt.key ? C.accent : C.textSecondary,
                },
              ]}
            >
              {opt.label}
            </Text>

            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor: filter === opt.key ? C.accent : C.bgMuted,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterBadgeText,
                  {
                    color: filter === opt.key ? "#fff" : C.textSecondary,
                  },
                ]}
              >
                {opt.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View
              style={[
                styles.emptyIconCircle,
                {
                  backgroundColor:
                    filter === "done" ? C.successDim : C.accentDim,
                },
              ]}
            >
              <Ionicons
                name={
                  filter === "done"
                    ? "sparkles-outline"
                    : "document-text-outline"
                }
                size={34}
                color={filter === "done" ? C.success : C.accent}
              />
            </View>

            <Text style={[styles.emptyTitle, { color: C.textSecondary }]}>
              {t("emptyList")}
            </Text>

            {filter !== "done" && !search ? (
              <>
                <Text style={[styles.emptySub, { color: C.textMuted }]}>
                  {t("addFirstTask")}
                </Text>

                <TouchableOpacity
                  style={[
                    styles.emptyAddBtn,
                    {
                      backgroundColor: C.accent,
                      ...Shadow.accent,
                    },
                  ]}
                  onPress={() => setShowAdd(true)}
                >
                  <Text style={styles.emptyAddText}>{t("addTask")}</Text>
                </TouchableOpacity>
              </>
            ) : null}
          </View>
        }
        renderItem={({ item }) => (
          <TaskCard
            task={item}
            onToggle={() => toggleDone(item.id)}
            onDelete={() => deleteTask(item.id)}
            onPress={() => setSelectedTask(item)}
          />
        )}
      />

      <AddTaskBottomSheet
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onAdd={addTask}
      />

      <Modal
        visible={selectedTask !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTask(null)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.detailCard,
              {
                backgroundColor: C.bgCard,
                borderColor: C.border,
                ...Shadow.subtle,
              },
            ]}
          >
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: C.textPrimary }]}>
                {selectedTask?.title}
              </Text>

              <TouchableOpacity onPress={() => setSelectedTask(null)}>
                <Ionicons name="close" size={22} color={C.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.detailLabel, { color: C.textMuted }]}>
                {t("taskDetailDescription")}
              </Text>

              <Text style={[styles.detailText, { color: C.textSecondary }]}>
                {selectedTask?.description?.trim()
                  ? selectedTask.description
                  : t("taskDetailNoDescription")}
              </Text>

              <View style={styles.detailInfoRow}>
                <Text style={[styles.detailLabel, { color: C.textMuted }]}>
                  {t("taskDetailPomodoro")}
                </Text>

                <Text style={[styles.detailText, { color: C.textPrimary }]}>
                  {selectedTask?.completedPomodoros ?? 0}/
                  {selectedTask?.estimatedPomodoros ?? 0}
                </Text>
              </View>

              <View style={styles.detailInfoRow}>
                <Text style={[styles.detailLabel, { color: C.textMuted }]}>
                  {t("taskDetailTag")}
                </Text>

                <Text style={[styles.detailText, { color: C.textPrimary }]}>
                  {getTagText(selectedTask?.tagLabel)}
                </Text>
              </View>

              {selectedTask?.dueDate ? (
                <View style={styles.detailInfoRow}>
                  <Text style={[styles.detailLabel, { color: C.textMuted }]}>
                    {t("taskDetailDate")}
                  </Text>

                  <Text style={[styles.detailText, { color: C.textPrimary }]}>
                    {selectedTask.dueDate}
                  </Text>
                </View>
              ) : null}

              <View style={styles.detailInfoRow}>
                <Text style={[styles.detailLabel, { color: C.textMuted }]}>
                  {t("taskDetailPriority")}
                </Text>

                <Text style={[styles.detailText, { color: C.textPrimary }]}>
                  {getPriorityText(selectedTask?.priority)}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },

  subtitle: {
    fontSize: Typography.sm,
    marginTop: 2,
  },

  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },

  searchInput: {
    flex: 1,
    fontSize: Typography.base,
  },

  filterRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
    marginBottom: Spacing.base,
  },

  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
  },

  filterText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },

  filterBadge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },

  filterBadgeText: {
    fontSize: 10,
    fontWeight: "600",
  },

  listContent: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing["4xl"],
    paddingTop: Spacing.xs,
  },

  empty: {
    alignItems: "center",
    paddingTop: 64,
    gap: Spacing.sm,
  },

  emptyTitle: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },

  emptySub: {
    fontSize: Typography.sm,
    textAlign: "center",
  },

  emptyAddBtn: {
    marginTop: Spacing.base,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
  },

  emptyAddText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: "#fff",
  },

  errorBox: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },

  errorText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },

  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.base,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },

  detailCard: {
    maxHeight: "75%",
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
  },

  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },

  detailTitle: {
    flex: 1,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    lineHeight: 24,
  },

  detailLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    marginBottom: 4,
    marginTop: Spacing.md,
  },

  detailText: {
    fontSize: Typography.sm,
    lineHeight: 20,
  },

  detailInfoRow: {
    marginTop: Spacing.sm,
  },
});
