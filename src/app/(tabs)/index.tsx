import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  FlatList,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ActiveTaskCard } from "../../components/timer/ActiveTaskCard";
import { CircularProgress } from "../../components/timer/CircularProgress";
import { ControlRow } from "../../components/timer/ControlRow";
import { TimerDisplay } from "../../components/timer/TimerDisplay";
import { PomodoroDots } from "../../components/ui/PomodoroDotsRow";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { useTaskStore } from "../../stores/taskStore";
import { useTimerStore } from "../../stores/timerStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

export default function TimerTab() {
  const insets = useSafeAreaInsets();
  const { themeMode, language } = useAppStore();
  const t = (key: TranslationKey) => translate(language, key);
  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const sessionColors: Record<string, string> = {
    work: C.accent,
    short_break: C.success,
    long_break: C.info,
  };

  const router = useRouter();

  const {
    sessionType,
    timeLeft,
    isRunning,
    completedToday,
    totalMinutesToday,
    streak,
    progress,
    start,
    pause,
    reset,
    switchSession,
    loadTodaySummary,
    loadTimerSettings,
  } = useTimerStore();

  const { tasks, activeTask, setActiveTask, loadTasks } = useTaskStore();

  useEffect(() => {
    loadTimerSettings();
    loadTodaySummary();
    loadTasks();
  }, []);

  const [showPicker, setShowPicker] = useState(false);

  const sessionColor = sessionColors[sessionType] ?? C.accent;

  const SESSION_LABELS: Record<string, string> = {
    work: t("work"),
    short_break: t("short_break"),
    long_break: t("long_break"),
  };

  const formatMin = (m: number) =>
    m >= 60
      ? `${Math.floor(m / 60)}${t("hourShort")} ${m % 60}${t("minuteShort")}`
      : `${m}${t("minuteShort")}`;

  return (
    <View
      style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}
    >
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.appName, { color: C.textPrimary }]}>
            FocusNest
          </Text>
        </View>

        <View
          style={[
            styles.pills,
            { backgroundColor: C.bgCard, borderColor: C.border },
          ]}
        >
          {(["work", "short_break", "long_break"] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.pill,
                sessionType === type && {
                  backgroundColor: sessionColors[type] + "22",
                  borderColor: sessionColors[type],
                },
              ]}
              onPress={() => switchSession(type)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color:
                      sessionType === type ? sessionColors[type] : C.textMuted,
                  },
                ]}
              >
                {SESSION_LABELS[type]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.timerArea}>
          <CircularProgress
            progress={progress}
            size={240}
            strokeWidth={7}
            color={sessionColor}
            isRunning={isRunning}
          />
          <View style={[styles.timerCenter, { width: 240, height: 240 }]}>
            <TimerDisplay timeLeft={timeLeft} color={sessionColor} />
            <Text style={[styles.sessionLabel, { color: C.textSecondary }]}>
              {SESSION_LABELS[sessionType]}
            </Text>
            <View style={styles.miniDots}>
              {Array.from({ length: 4 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.miniDot,
                    {
                      backgroundColor:
                        i < completedToday % 4 ? sessionColor : C.bgMuted,
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>

        <ControlRow
          isRunning={isRunning}
          onPlay={start}
          onPause={pause}
          onReset={reset}
          onSkip={() => switchSession("short_break")}
          color={sessionColor}
        />

        <View
          style={[
            styles.statsRow,
            {
              backgroundColor: C.bgCard,
              borderColor: C.border,
              ...Shadow.subtle,
            },
          ]}
        >
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: sessionColor }]}>
              {completedToday}
            </Text>
            <Text style={[styles.statLbl, { color: C.textSecondary }]}>
              {t("today")}
            </Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: C.border }]} />
          <View style={styles.statCell}>
            <Text style={[styles.statVal, { color: C.textPrimary }]}>
              {formatMin(totalMinutesToday)}
            </Text>
            <Text style={[styles.statLbl, { color: C.textSecondary }]}>
              {t("focusTime")}
            </Text>
          </View>
          <View style={[styles.statDiv, { backgroundColor: C.border }]} />
          <View style={styles.statCell}>
            <View style={styles.streakValueRow}>
              <Text style={[styles.statVal, { color: C.textPrimary }]}>
                {streak}
              </Text>
              <Ionicons name="flame-outline" size={20} color={C.accent} />
            </View>
            <Text style={[styles.statLbl, { color: C.textSecondary }]}>
              {t("streak")}
            </Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionLbl, { color: C.textSecondary }]}>
            {t("activeTask")}
          </Text>
          <TouchableOpacity onPress={() => setShowPicker(true)}>
            <Text style={[styles.sectionAction, { color: C.accent }]}>
              {t("change")}
            </Text>
          </TouchableOpacity>
        </View>
        <ActiveTaskCard task={activeTask} onPress={() => setShowPicker(true)} />

        {tasks.filter((t2) => t2.id !== activeTask?.id && t2.status !== "done")
          .length > 0 && (
          <>
            <Text
              style={[
                styles.sectionLbl,
                {
                  color: C.textSecondary,
                  marginTop: Spacing.xl,
                  marginBottom: Spacing.md,
                },
              ]}
            >
              {t("otherTasks")}
            </Text>
            <View style={{ gap: Spacing.sm }}>
              {tasks
                .filter(
                  (t2) => t2.id !== activeTask?.id && t2.status !== "done",
                )
                .slice(0, 4)
                .map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={[
                      styles.quickRow,
                      { backgroundColor: C.bgCard, borderColor: C.border },
                    ]}
                    onPress={() => setActiveTask(task)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.quickDot,
                        { backgroundColor: task.tagColor },
                      ]}
                    />
                    <Text
                      style={[styles.quickTitle, { color: C.textPrimary }]}
                      numberOfLines={1}
                    >
                      {task.title}
                    </Text>
                    <PomodoroDots
                      total={task.estimatedPomodoros}
                      completed={task.completedPomodoros}
                      color={task.tagColor}
                      size={6}
                    />
                  </TouchableOpacity>
                ))}
            </View>
          </>
        )}
      </ScrollView>

      <Modal
        visible={showPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPicker(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: C.overlay }]}>
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: C.bgCard,
                borderColor: C.border,
                ...Shadow.card,
              },
            ]}
          >
            <View
              style={[styles.modalHandle, { backgroundColor: C.bgMuted }]}
            />
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>
              {t("selectTaskTitle")}
            </Text>
            <FlatList
              data={tasks.filter((t2) => t2.status !== "done")}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ gap: 8, paddingBottom: 32 }}
              ListEmptyComponent={
                <Text
                  style={{
                    color: C.textSecondary,
                    fontSize: Typography.sm,
                    textAlign: "center",
                    paddingVertical: Spacing.xl,
                  }}
                >
                  {t("createTask")}
                </Text>
              }
              renderItem={({ item }) => {
                const sel = item.id === activeTask?.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.pickerRow,
                      {
                        backgroundColor: C.bgCardElevated,
                        borderColor: sel ? C.accent : C.border,
                      },
                    ]}
                    onPress={() => {
                      setActiveTask(item);
                      setShowPicker(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.pickerDot,
                        { backgroundColor: item.tagColor },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.pickerTitle, { color: C.textPrimary }]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text
                        style={[styles.pickerMeta, { color: C.textSecondary }]}
                      >
                        {item.completedPomodoros}/{item.estimatedPomodoros}{" "}
                        {t("pomodoro")}
                      </Text>
                    </View>
                    {sel && (
                      <View
                        style={[
                          styles.checkCircle,
                          { backgroundColor: C.accent },
                        ]}
                      >
                        <Ionicons name="checkmark" size={14} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: C.border }]}
              onPress={() => setShowPicker(false)}
            >
              <Text style={[styles.cancelText, { color: C.textSecondary }]}>
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["3xl"] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.base,
    marginBottom: Spacing.md,
  },
  appName: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    letterSpacing: 0.5,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  pills: {
    flexDirection: "row",
    borderRadius: Radius.full,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.xl,
  },
  pill: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  pillText: { fontSize: Typography.xs, fontWeight: Typography.medium },
  timerArea: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
    position: "relative",
  },
  timerCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  sessionLabel: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginTop: Spacing.xs,
  },
  miniDots: { flexDirection: "row", gap: 6, marginTop: Spacing.sm },
  miniDot: { width: 6, height: 6, borderRadius: 3 },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.xl,
  },
  statCell: { flex: 1, alignItems: "center" },
  statVal: {
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
    lineHeight: 26,
  },
  statLbl: { fontSize: Typography.xs, marginTop: 2 },
  statDiv: { width: 1, height: 32 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionLbl: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  sectionAction: { fontSize: Typography.sm, fontWeight: Typography.medium },
  quickRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  quickDot: { width: 8, height: 8, borderRadius: 4 },
  quickTitle: {
    flex: 1,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.xl,
    paddingTop: Spacing.md,
    maxHeight: "75%",
    borderWidth: 1,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.lg,
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.base,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pickerDot: { width: 10, height: 10, borderRadius: 5 },
  pickerTitle: { fontSize: Typography.base, fontWeight: Typography.medium },
  pickerMeta: { fontSize: Typography.xs, marginTop: 2 },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.base,
    alignItems: "center",
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  cancelText: { fontSize: Typography.base, fontWeight: Typography.medium },
  streakValueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
});
