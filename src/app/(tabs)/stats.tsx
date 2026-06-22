import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PomodoroSession } from "../../api/sessions";
import * as sessionApi from "../../api/sessions";
import { BarChart } from "../../components/stats/BarChart";
import { HeatmapCalendar } from "../../components/stats/HeatmapCalendar";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";
type Period = "day" | "week" | "month";

export default function StatsTab() {
  const insets = useSafeAreaInsets();
  const { themeMode, language } = useAppStore();
  const t = (key: TranslationKey) => translate(language, key);
  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const [period, setPeriod] = useState<Period>("week");
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadStats() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await sessionApi.fetchSessions();
        setSessions(data);
      } catch (e: any) {
        console.log("Stats could not be loaded:", e.message);
        setError(t("statsLoadError"));
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const daysCount = period === "day" ? 1 : period === "week" ? 7 : 30;

  const workSessions = useMemo(() => {
    return sessions.filter(
      (session) => session.type === "work" && !session.wasInterrupted,
    );
  }, [sessions]);

  const periodSessions = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - (daysCount - 1));

    return workSessions.filter((session) => {
      return new Date(session.completedAt) >= start;
    });
  }, [workSessions, daysCount]);

  const weekly = useMemo(() => {
    return buildChartData(periodSessions, daysCount, language);
  }, [periodSessions, daysCount, language]);

  const total = periodSessions.length;

  const totalMin = periodSessions.reduce(
    (sum, session) => sum + session.durationMin,
    0,
  );

  const completedToday = workSessions.filter((session) => {
    return getDateKey(new Date(session.completedAt)) === getDateKey(new Date());
  }).length;

  const streak = calculateStreak(workSessions);

  const taskBreakdown = useMemo(() => {
    const map: Record<
      string,
      {
        title: string;
        color: string;
        pom: number;
        min: number;
        pct: number;
      }
    > = {};

    for (const session of periodSessions) {
      const key = session.taskId ?? "no-task";

      if (!map[key]) {
        map[key] = {
          title: session.task?.title ?? t("noTaskFocus"),
          color: session.task?.tagColor ?? C.accent,
          pom: 0,
          min: 0,
          pct: 0,
        };
      }

      map[key].pom += 1;
      map[key].min += session.durationMin;
    }

    return Object.values(map)
      .map((task) => ({
        ...task,
        pct: total > 0 ? Math.round((task.pom / total) * 100) : 0,
      }))
      .sort((a, b) => b.pom - a.pom);
  }, [periodSessions, total, language, C.accent]);

  const recentSessions = sessions.slice(0, 5);

  const heatmapData = useMemo(() => {
    return buildHeatmapData(workSessions);
  }, [workSessions]);

  const getSessionColor = (session: PomodoroSession) => {
    if (session.type === "work") {
      return session.task?.tagColor ?? C.accent;
    }

    return C.success;
  };

  const getSessionLabel = (session: PomodoroSession) => {
    if (session.type === "work") {
      return t("focus");
    }

    return t("break");
  };

  const getSessionTitle = (session: PomodoroSession) => {
    if (session.type === "work") {
      return session.task?.title ?? t("noTaskFocus");
    }

    if (session.type === "short_break") {
      return t("shortBreak");
    }

    return t("longBreak");
  };

  const PERIOD_LABELS: Record<Period, string> = {
    day: t("thisDay"),
    week: t("thisWeek"),
    month: t("thisMonth"),
  };

  return (
    <View
      style={[styles.root, { backgroundColor: C.bg, paddingTop: insets.top }]}
    >
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: C.textPrimary }]}>
              {t("statsTitle")}
            </Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              {t("statsSubtitle")}
            </Text>
          </View>
          <View
            style={[
              styles.streakBadge,
              {
                backgroundColor: C.bgCard,
                borderColor: C.border,
                ...Shadow.subtle,
              },
            ]}
          >
            <Ionicons name="flame-outline" size={22} color={C.accent} />
            <Text style={[styles.streakNum, { color: C.accent }]}>
              {streak}
            </Text>
            <Text style={[styles.streakLbl, { color: C.textSecondary }]}>
              {t("dayStreak")}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.periodSelector,
            {
              backgroundColor: C.bgCard,
              borderColor: C.border,
              ...Shadow.subtle,
            },
          ]}
        >
          {(["day", "week", "month"] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodBtn,
                period === p && {
                  backgroundColor: C.bgCardElevated,
                  borderWidth: 1,
                  borderColor: C.borderStrong,
                },
              ]}
              onPress={() => setPeriod(p)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodText,
                  {
                    color: period === p ? C.textPrimary : C.textSecondary,
                    fontWeight:
                      period === p ? Typography.semibold : Typography.medium,
                  },
                ]}
              >
                {PERIOD_LABELS[p]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        {isLoading ? (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: C.bgCard,
                borderColor: C.border,
              },
            ]}
          >
            <Text style={[styles.infoText, { color: C.textSecondary }]}>
              {t("statsLoading")}
            </Text>
          </View>
        ) : null}

        {error ? (
          <View
            style={[
              styles.infoBox,
              {
                backgroundColor: C.accentDim,
                borderColor: C.accent,
              },
            ]}
          >
            <Text style={[styles.infoText, { color: C.accent }]}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.metricsRow}>
          {[
            {
              val: period === "day" ? completedToday : total,
              lbl: t("pomodoro"),
              color: C.accent,
            },
            {
              val:
                totalMin >= 60
                  ? `${Math.floor(totalMin / 60)}${t("hourShort")} ${totalMin % 60}${t("minuteShort")}`
                  : `${totalMin}${t("minuteShort")}`,
              lbl: t("totalFocus"),
              color: C.textPrimary,
            },
            {
              val: Math.round(total / daysCount),
              lbl: t("dailyAvg"),
              color: C.textPrimary,
            },
          ].map((m, i) => (
            <View
              key={i}
              style={[
                styles.metricCard,
                {
                  backgroundColor: C.bgCard,
                  borderColor: C.border,
                  ...Shadow.subtle,
                },
              ]}
            >
              <Text style={[styles.metricVal, { color: m.color }]}>
                {m.val}
              </Text>
              <Text style={[styles.metricLbl, { color: C.textSecondary }]}>
                {m.lbl}
              </Text>
            </View>
          ))}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: C.bgCard,
              borderColor: C.border,
              ...Shadow.card,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
              {t("dailyDist")}
            </Text>
            <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
              {t("max")}: {Math.max(...weekly.map((d) => d.count))}
            </Text>
          </View>
          <BarChart data={weekly} color={C.accent} />
        </View>

        {/* Heatmap */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: C.bgCard,
              borderColor: C.border,
              ...Shadow.card,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
              {t("activityMap")}
            </Text>
            <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
              {t("last35")}
            </Text>
          </View>
          <HeatmapCalendar data={heatmapData} />
        </View>

        {/* Task breakdown */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: C.bgCard,
              borderColor: C.border,
              ...Shadow.card,
            },
          ]}
        >
          <View style={styles.cardHeader}>
            <Text style={[styles.cardTitle, { color: C.textPrimary }]}>
              {t("taskFocus")}
            </Text>
            <Text style={[styles.cardMeta, { color: C.textSecondary }]}>
              {t("thisWeekLabel")}
            </Text>
          </View>

          {taskBreakdown.length === 0 ? (
            <Text style={{ color: C.textSecondary, fontSize: Typography.sm }}>
              {t("noTaskFocusData")}
            </Text>
          ) : (
            <>
              <View style={styles.breakdownBar}>
                {taskBreakdown.map((task, i) => (
                  <View
                    key={task.title}
                    style={[
                      styles.seg,
                      {
                        flex: task.pct,
                        backgroundColor: task.color,
                        borderTopLeftRadius: i === 0 ? 4 : 0,
                        borderBottomLeftRadius: i === 0 ? 4 : 0,
                        borderTopRightRadius:
                          i === taskBreakdown.length - 1 ? 4 : 0,
                        borderBottomRightRadius:
                          i === taskBreakdown.length - 1 ? 4 : 0,
                      },
                    ]}
                  />
                ))}
              </View>

              {taskBreakdown.map((task) => (
                <View key={task.title} style={styles.taskRow}>
                  <View
                    style={[styles.taskDot, { backgroundColor: task.color }]}
                  />

                  <Text
                    style={[styles.taskTitle, { color: C.textPrimary }]}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>

                  <View style={styles.taskPomRow}>
                    <Text style={[styles.taskPom, { color: C.textSecondary }]}>
                      {task.pom}
                    </Text>
                    <Ionicons
                      name="timer-outline"
                      size={13}
                      color={C.textSecondary}
                    />
                  </View>

                  <Text style={[styles.taskMin, { color: C.textMuted }]}>
                    {task.min}
                    {t("min")}
                  </Text>

                  <View
                    style={[
                      styles.pctBadge,
                      { backgroundColor: task.color + "22" },
                    ]}
                  >
                    <Text style={[styles.pctText, { color: task.color }]}>
                      %{task.pct}
                    </Text>
                  </View>
                </View>
              ))}
            </>
          )}
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: C.bgCard,
              borderColor: C.border,
              ...Shadow.card,
            },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: C.textPrimary, marginBottom: Spacing.sm },
            ]}
          >
            {t("recentSessions")}
          </Text>

          {recentSessions.length === 0 ? (
            <Text style={{ color: C.textSecondary, fontSize: Typography.sm }}>
              {t("noSessionRecords")}
            </Text>
          ) : (
            recentSessions.map((s, i) => {
              const sessionColor = getSessionColor(s);

              return (
                <View
                  key={s.id}
                  style={[
                    styles.sessionRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: C.border },
                  ]}
                >
                  <View
                    style={[
                      styles.sessionType,
                      { backgroundColor: sessionColor + "22" },
                    ]}
                  >
                    <Text
                      style={[
                        {
                          color: sessionColor,
                          fontSize: Typography.xs,
                          fontWeight: Typography.semibold,
                        },
                      ]}
                    >
                      {getSessionLabel(s)}
                    </Text>
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.sessionTask, { color: C.textPrimary }]}
                      numberOfLines={1}
                    >
                      {getSessionTitle(s)}
                    </Text>

                    <Text style={[styles.sessionTime, { color: C.textMuted }]}>
                      {formatTime(s.completedAt, language)}
                    </Text>
                  </View>

                  <Text style={[styles.sessionDur, { color: C.textSecondary }]}>
                    {s.durationMin}
                    {t("min")}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function buildHeatmapData(sessions: PomodoroSession[]) {
  const map: Record<string, number> = {};

  for (const session of sessions) {
    const key = getDateKey(new Date(session.completedAt));
    map[key] = (map[key] ?? 0) + 1;
  }

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (34 - index));

    const key = getDateKey(date);

    return {
      day: index,
      count: map[key] ?? 0,
    };
  });
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["4xl"] },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: Spacing.base,
    marginBottom: Spacing.lg,
  },
  title: { fontSize: Typography.xl, fontWeight: Typography.bold },
  subtitle: { fontSize: Typography.sm, marginTop: 2 },
  streakBadge: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    gap: 2,
  },
  streakNum: { fontSize: Typography.lg, fontWeight: Typography.bold },
  streakLbl: { fontSize: Typography.xs },
  periodSelector: {
    flexDirection: "row",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: Spacing.xl,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderRadius: Radius.md,
  },
  periodText: { fontSize: Typography.sm },
  metricsRow: {
    flexDirection: "row",
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.base,
    gap: 2,
  },
  metricVal: { fontSize: Typography["2xl"], fontWeight: Typography.bold },
  metricLbl: { fontSize: Typography.xs },
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    marginBottom: Spacing.base,
    gap: Spacing.base,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: { fontSize: Typography.base, fontWeight: Typography.semibold },
  cardMeta: { fontSize: Typography.xs },
  breakdownBar: {
    flexDirection: "row",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    gap: 2,
  },
  seg: { height: 8 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  taskDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  taskTitle: {
    flex: 1,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  taskPom: { fontSize: Typography.xs },
  taskMin: { fontSize: Typography.xs, minWidth: 32, textAlign: "right" },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    minWidth: 36,
    alignItems: "center",
  },
  pctText: { fontSize: Typography.xs, fontWeight: Typography.semibold },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  sessionType: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    minWidth: 44,
    alignItems: "center",
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.md,
  },

  infoText: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  sessionTask: { fontSize: Typography.sm, fontWeight: Typography.medium },
  sessionTime: { fontSize: Typography.xs, marginTop: 1 },
  sessionDur: { fontSize: Typography.xs, fontWeight: Typography.medium },
  taskPomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
});

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function buildChartData(
  sessions: PomodoroSession[],
  days: number,
  language: string,
) {
  const labelsTr = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];
  const labelsEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const labels = language === "tr" ? labelsTr : labelsEn;

  const map: Record<string, number> = {};

  for (const session of sessions) {
    const key = getDateKey(new Date(session.completedAt));
    map[key] = (map[key] ?? 0) + 1;
  }

  return Array.from({ length: days }, (_, index) => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (days - 1 - index));

    const key = getDateKey(date);

    return {
      label: days > 7 ? String(date.getDate()) : labels[date.getDay()],
      count: map[key] ?? 0,
    };
  });
}

function calculateStreak(sessions: PomodoroSession[]) {
  const completedDays = new Set(
    sessions.map((session) => getDateKey(new Date(session.completedAt))),
  );

  let streak = 0;

  for (let i = 0; i < 365; i++) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - i);

    if (completedDays.has(getDateKey(date))) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function formatTime(value: string, language: string) {
  return new Date(value).toLocaleTimeString(
    language === "tr" ? "tr-TR" : "en-US",
    {
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}
