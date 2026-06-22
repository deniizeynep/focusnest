import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PomodoroSession } from "../../api/sessions";
import * as sessionApi from "../../api/sessions";
import * as taskApi from "../../api/tasks";
import { translate, type TranslationKey } from "../../i18n/translations";
import type { Language } from "../../stores/appStore";
import { useAppStore } from "../../stores/appStore";
import { useAuthStore } from "../../stores/authStore";
import { SESSION_CONFIGS, useTimerStore } from "../../stores/timerStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

function SectionLabel({ label, C }: { label: string; C: any }) {
  return (
    <Text style={[s.sectionLabel, { color: C.textMuted }]}>
      {label.toUpperCase()}
    </Text>
  );
}

function SettingRow({
  label,
  sublabel,
  value,
  toggle,
  toggleValue,
  onToggle,
  onPress,
  accent,
  C,
}: {
  label: string;
  sublabel?: string;
  value?: string;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onPress?: () => void;
  accent?: boolean;
  C: any;
}) {
  return (
    <TouchableOpacity
      style={[s.settingRow, { borderBottomColor: C.border }]}
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress && !toggle}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={[s.settingLabel, { color: accent ? C.accent : C.textPrimary }]}
        >
          {label}
        </Text>
        {sublabel ? (
          <Text style={[s.settingSubLabel, { color: C.textMuted }]}>
            {sublabel}
          </Text>
        ) : null}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: C.bgMuted, true: C.accent }}
          thumbColor="#fff"
        />
      ) : value ? (
        <Text style={[s.settingValue, { color: C.textSecondary }]}>
          {value}
        </Text>
      ) : onPress ? (
        <Text style={[s.chevron, { color: C.textMuted }]}>›</Text>
      ) : null}
    </TouchableOpacity>
  );
}

function SectionCard({
  children,
  C,
  Shadow,
}: {
  children: React.ReactNode;
  C: any;
  Shadow: any;
}) {
  return (
    <View
      style={[
        s.sectionCard,
        { backgroundColor: C.bgCard, borderColor: C.border, ...Shadow.subtle },
      ]}
    >
      {children}
    </View>
  );
}

const NOTIFICATION_SETTINGS_KEY = "notification_settings";

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { user, signOut, updateProfile, deleteAccount } = useAuthStore();
  const { themeMode, language, setTheme, setLanguage } = useAppStore();
  const t = (key: TranslationKey) => translate(language, key);
  const {
    setWorkDuration,
    setShortBreakDuration,
    setLongBreakDuration,
    loadTimerSettings,
    longBreakInterval,
    autoStartBreaks,
    autoStartPomodoros,
    setLongBreakInterval,
    setAutoStartBreaks,
    setAutoStartPomodoros,
  } = useTimerStore();
  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);

  const [workMin, setWorkMin] = useState(25);
  const [shortMin, setShortMin] = useState(5);
  const [longMin, setLongMin] = useState(15);

  const [notifOn, setNotifOn] = useState(true);
  const [soundOn, setSoundOn] = useState(true);
  const [vibOn, setVibOn] = useState(true);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [infoModal, setInfoModal] = useState<"privacy" | "terms" | null>(null);

  const [editName, setEditName] = useState(user?.displayName ?? "");

  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);

  const saveNotificationSettings = async (settings: {
    notifications: boolean;
    sound: boolean;
    vibration: boolean;
  }) => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_SETTINGS_KEY,
        JSON.stringify(settings),
      );
    } catch (error: any) {
      console.log("Notification settings could not be saved:", error.message);
    }
  };

  useEffect(() => {
    async function loadProfileStats() {
      try {
        setStatsLoading(true);

        const data = await sessionApi.fetchSessions();
        setSessions(data);
      } catch (error: any) {
        console.log("Profile stats could not be loaded:", error.message);
      } finally {
        setStatsLoading(false);
      }
    }

    loadProfileStats();
  }, []);

  useEffect(() => {
    async function initTimerSettings() {
      await loadTimerSettings();

      setWorkMin(Math.round(SESSION_CONFIGS.work.duration / 60));
      setShortMin(Math.round(SESSION_CONFIGS.short_break.duration / 60));
      setLongMin(Math.round(SESSION_CONFIGS.long_break.duration / 60));
    }

    initTimerSettings();
  }, []);

  useEffect(() => {
    async function loadNotificationSettings() {
      try {
        const raw = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);

        if (!raw) return;

        const settings = JSON.parse(raw);

        setNotifOn(Boolean(settings.notifications));
        setSoundOn(Boolean(settings.sound));
        setVibOn(Boolean(settings.vibration));
      } catch (error: any) {
        console.log(
          "Notification settings could not be loaded:",
          error.message,
        );
      }
    }

    loadNotificationSettings();
  }, []);

  const workSessions = useMemo(() => {
    return sessions.filter(
      (session) => session.type === "work" && !session.wasInterrupted,
    );
  }, [sessions]);

  const totalPomodoros = workSessions.length;

  const totalFocusMinutes = workSessions.reduce(
    (sum, session) => sum + session.durationMin,
    0,
  );

  const profileStreak = useMemo(() => {
    return calculateStreak(workSessions);
  }, [workSessions]);

  const badges = useMemo(() => {
    return [
      {
        icon: "flame-outline" as const,
        color: C.accent,
        label: statsLoading ? "..." : `${profileStreak} ${t("dayStreakBadge")}`,
      },
      {
        icon: "timer-outline" as const,
        color: C.accent,
        label: statsLoading ? "..." : `${totalPomodoros} ${t("pomodoros")}`,
      },
      {
        icon: "stopwatch-outline" as const,
        color: C.info,
        label: statsLoading ? "..." : formatFocusBadge(totalFocusMinutes, t),
      },
    ];
  }, [
    statsLoading,
    profileStreak,
    totalPomodoros,
    totalFocusMinutes,
    language,
    t,
  ]);

  const handleExportData = async () => {
    try {
      const [tasks, exportedSessions] = await Promise.all([
        taskApi.fetchTasks(),
        sessionApi.fetchSessions(),
      ]);

      const exportData = {
        exportedAt: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
          displayName: user?.displayName,
        },
        summary: {
          totalPomodoros,
          totalFocusMinutes,
          streak: profileStreak,
        },
        tasks,
        sessions: exportedSessions,
      };

      await Share.share({
        title: t("exportShareTitle"),
        message: JSON.stringify(exportData, null, 2),
      });
    } catch (error: any) {
      console.log("Export failed:", error.message);
      Alert.alert(t("error"), t("exportError"));
    }
  };

  const cycleVal = (
    cur: number,
    opts: number[],
    setter: (v: number) => void,
  ) => {
    const idx = opts.indexOf(cur);
    setter(opts[(idx + 1) % opts.length]);
  };

  const handleSaveTimerSettings = () => {
    setWorkDuration(workMin);
    setShortBreakDuration(shortMin);
    setLongBreakDuration(longMin);
    Alert.alert(t("savedTitle"), t("timerSettingsUpdated"));
  };

  const handleSaveProfile = async () => {
    await updateProfile({ displayName: editName });
    setShowEditProfile(false);
  };

  const handleSignOut = () => {
    Alert.alert(t("signOutConfirmTitle"), t("signOutConfirmMsg"), [
      { text: t("cancel"), style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: signOut },
    ]);
  };

  const handleToggleNotifications = (value: boolean) => {
    setNotifOn(value);

    saveNotificationSettings({
      notifications: value,
      sound: soundOn,
      vibration: vibOn,
    });
  };

  const handleToggleSound = (value: boolean) => {
    setSoundOn(value);

    saveNotificationSettings({
      notifications: notifOn,
      sound: value,
      vibration: vibOn,
    });
  };

  const handleToggleVibration = (value: boolean) => {
    setVibOn(value);

    saveNotificationSettings({
      notifications: notifOn,
      sound: soundOn,
      vibration: value,
    });
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("deleteConfirmTitle"), t("deleteConfirmMsg"), [
      {
        text: t("cancel"),
        style: "cancel",
      },
      {
        text: t("delete"),
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAccount();
          } catch (error: any) {
            console.log("Delete account failed:", error.message);
            Alert.alert(t("error"), t("deleteAccountError"));
          }
        },
      },
    ]);
  };

  const handleExport = () => {
    setShowExport(true);
  };

  const infoContent =
    infoModal === "privacy"
      ? {
          icon: "lock-closed-outline" as const,
          iconColor: C.accent,
          title: t("privacyPolicy"),
          subtitle: t("privacySubtitle"),
          items: [
            { title: t("privacyStoredTitle"), text: t("privacyStoredText") },
            {
              title: t("privacyPasswordTitle"),
              text: t("privacyPasswordText"),
            },
            { title: t("privacyControlTitle"), text: t("privacyControlText") },
          ],
        }
      : {
          icon: "document-text-outline" as const,
          iconColor: C.info,
          title: t("termsOfService"),
          subtitle: t("termsSubtitle"),
          items: [
            { title: t("termsPurposeTitle"), text: t("termsPurposeText") },
            {
              title: t("termsResponsibilityTitle"),
              text: t("termsResponsibilityText"),
            },
            { title: t("termsDeleteTitle"), text: t("termsDeleteText") },
          ],
        };

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
      >
        <View style={s.profileHeader}>
          <View style={[s.avatar, { backgroundColor: C.accent }]}>
            <Text style={s.avatarText}>
              {(user?.displayName ?? "U")[0].toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[s.displayName, { color: C.textPrimary }]}>
              {user?.displayName ?? t("userFallback")}
            </Text>
            <Text style={[s.email, { color: C.textSecondary }]}>
              {user?.email ?? ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[s.editBtn, { borderColor: C.border }]}
            onPress={() => {
              setEditName(user?.displayName ?? "");
              setShowEditProfile(true);
            }}
          >
            <Text style={[s.editBtnText, { color: C.textSecondary }]}>
              {t("editProfile")}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={s.badgeRow}>
          {badges.map((badge) => {
            return (
              <View
                key={badge.icon}
                style={[
                  s.badge,
                  {
                    backgroundColor: C.bgCard,
                    borderColor: C.border,
                    ...Shadow.subtle,
                  },
                ]}
              >
                <Ionicons name={badge.icon} size={24} color={badge.color} />

                <Text style={[s.badgeLabel, { color: C.textSecondary }]}>
                  {badge.label}
                </Text>
              </View>
            );
          })}
        </View>

        <SectionLabel label={t("timer")} C={C} />
        <SectionCard C={C} Shadow={Shadow}>
          <SettingRow
            C={C}
            label={t("workDuration")}
            value={`${workMin} ${t("min")}`}
            onPress={() =>
              cycleVal(workMin, [15, 20, 25, 30, 45, 50, 60], setWorkMin)
            }
          />
          <SettingRow
            C={C}
            label={t("shortBreak")}
            value={`${shortMin} ${t("min")}`}
            onPress={() => cycleVal(shortMin, [3, 5, 10], setShortMin)}
          />
          <SettingRow
            C={C}
            label={t("longBreak")}
            value={`${longMin} ${t("min")}`}
            onPress={() => cycleVal(longMin, [10, 15, 20, 30], setLongMin)}
          />
          <SettingRow
            C={C}
            label={t("longBreakInterval")}
            sublabel={t("longBreakIntervalSub")}
            value={`${longBreakInterval} ${t("pomodoros")}`}
            onPress={() =>
              cycleVal(longBreakInterval, [2, 3, 4, 5, 6], setLongBreakInterval)
            }
          />
          <SettingRow
            C={C}
            label={t("autoStartBreaks")}
            toggle
            toggleValue={autoStartBreaks}
            onToggle={setAutoStartBreaks}
          />
          <SettingRow
            C={C}
            label={t("autoStartPomodoros")}
            toggle
            toggleValue={autoStartPomodoros}
            onToggle={setAutoStartPomodoros}
          />
          <TouchableOpacity
            style={[
              s.saveBtn,
              {
                backgroundColor: C.accent,
                ...Shadow.accent,
              },
            ]}
            onPress={handleSaveTimerSettings}
            activeOpacity={0.8}
          >
            <Text style={s.saveBtnText}>{t("saveSettings")}</Text>
          </TouchableOpacity>
        </SectionCard>

        <SectionLabel label={t("notifications")} C={C} />
        <SectionCard C={C} Shadow={Shadow}>
          <SettingRow
            C={C}
            label={t("notificationsLabel")}
            toggle
            toggleValue={notifOn}
            onToggle={handleToggleNotifications}
          />
          <SettingRow
            C={C}
            label={t("soundEffects")}
            toggle
            toggleValue={soundOn}
            onToggle={handleToggleSound}
          />
          <SettingRow
            C={C}
            label={t("vibration")}
            toggle
            toggleValue={vibOn}
            onToggle={handleToggleVibration}
          />
        </SectionCard>

        <SectionLabel label={t("appearance")} C={C} />
        <SectionCard C={C} Shadow={Shadow}>
          <View style={[s.settingRow, { borderBottomColor: C.border }]}>
            <Text style={[s.settingLabel, { color: C.textPrimary }]}>
              {t("theme")}
            </Text>
            <View style={s.inlineToggle}>
              {(["dark", "light"] as const).map((mode) => (
                <TouchableOpacity
                  key={mode}
                  style={[
                    s.toggleOption,
                    {
                      borderColor: themeMode === mode ? C.accent : C.border,
                      backgroundColor:
                        themeMode === mode ? C.accentDim : C.bgCardElevated,
                    },
                  ]}
                  onPress={() => setTheme(mode)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={mode === "dark" ? "moon-outline" : "sunny-outline"}
                    size={16}
                    color={themeMode === mode ? C.accent : C.textSecondary}
                  />
                  <Text
                    style={[
                      s.toggleText,
                      {
                        color: themeMode === mode ? C.accent : C.textSecondary,
                      },
                    ]}
                  >
                    {mode === "dark" ? t("darkTheme") : t("lightTheme")}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={[s.settingRow, { borderBottomWidth: 0 }]}>
            <Text style={[s.settingLabel, { color: C.textPrimary }]}>
              {t("language")}
            </Text>
            <View style={s.inlineToggle}>
              {(["tr", "en"] as Language[]).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  style={[
                    s.toggleOption,
                    {
                      borderColor: language === lang ? C.accent : C.border,
                      backgroundColor:
                        language === lang ? C.accentDim : C.bgCardElevated,
                    },
                  ]}
                  onPress={() => setLanguage(lang)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      s.languageCode,
                      {
                        color: language === lang ? C.accent : C.textSecondary,
                      },
                    ]}
                  >
                    {lang === "tr" ? "TR" : "EN"}
                  </Text>
                  <Text
                    style={[
                      s.toggleText,
                      { color: language === lang ? C.accent : C.textSecondary },
                    ]}
                  >
                    {lang === "tr" ? "Türkçe" : "English"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SectionCard>

        <SectionLabel label={t("app")} C={C} />
        <SectionCard C={C} Shadow={Shadow}>
          <SettingRow C={C} label={t("exportData")} onPress={handleExport} />
          <SettingRow
            C={C}
            label={t("privacyPolicy")}
            onPress={() => setInfoModal("privacy")}
          />

          <SettingRow
            C={C}
            label={t("termsOfService")}
            onPress={() => setInfoModal("terms")}
          />
        </SectionCard>

        <SectionLabel label={t("account")} C={C} />
        <SectionCard C={C} Shadow={Shadow}>
          <SettingRow
            C={C}
            label={t("signOut")}
            accent
            onPress={handleSignOut}
          />
          <SettingRow
            C={C}
            label={t("deleteAccount")}
            accent
            onPress={handleDeleteAccount}
          />
        </SectionCard>

        <Text style={[s.version, { color: C.textMuted }]}>{t("version")}</Text>
      </ScrollView>

      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        statusBarTranslucent={false}
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            paddingTop: insets.top + Spacing.xl,
            paddingHorizontal: Spacing.xl,
            paddingBottom: insets.bottom + 80,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: C.bgCard,
              borderRadius: Radius.xl,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <Text
              style={{
                color: C.textPrimary,
                fontSize: 28,
                fontWeight: "800",
                marginBottom: Spacing.xl,
                textAlign: "center",
              }}
            >
              {t("editProfileTitle")}
            </Text>

            <Text
              style={{
                color: C.textSecondary,
                fontSize: 14,
                marginBottom: Spacing.sm,
              }}
            >
              {t("fullName")}
            </Text>

            <TextInput
              style={{
                backgroundColor: C.bgCardElevated,
                borderColor: C.border,
                color: C.textPrimary,
                borderRadius: Radius.md,
                borderWidth: 1,
                paddingHorizontal: Spacing.base,
                paddingVertical: Spacing.md,
                fontSize: Typography.base,
                minHeight: 52,
                marginBottom: Spacing.xl,
              }}
              value={editName}
              onChangeText={setEditName}
              placeholder={t("fullNamePlaceholder")}
              placeholderTextColor={C.textMuted}
            />

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSaveProfile}
              style={{
                backgroundColor: C.accent,
                height: 56,
                borderRadius: Radius.lg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Spacing.md,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {t("save")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowEditProfile(false)}
              style={{
                height: 56,
                borderRadius: Radius.lg,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: C.textSecondary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showExport}
        animationType="slide"
        transparent={false}
        presentationStyle="fullScreen"
        statusBarTranslucent={false}
        onRequestClose={() => setShowExport(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            paddingTop: insets.top + Spacing.xl,
            paddingHorizontal: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: C.bgCard,
              borderRadius: Radius.xl,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: C.border,
              alignItems: "center",
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: C.accentDim,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Spacing.lg,
              }}
            >
              <Ionicons name="archive-outline" size={38} color={C.accent} />
            </View>

            <Text
              style={{
                color: C.textPrimary,
                fontSize: 28,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: Spacing.md,
              }}
            >
              {t("exportData")}
            </Text>

            <Text
              style={{
                color: C.textSecondary,
                fontSize: 16,
                textAlign: "center",
                lineHeight: 24,
                marginBottom: Spacing.xl,
              }}
            >
              {t("exportDesc")}
            </Text>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleExportData}
              style={{
                backgroundColor: C.accent,
                width: "100%",
                height: 56,
                borderRadius: Radius.lg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: Spacing.md,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {t("exportMyData")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowExport(false)}
              style={{
                width: "100%",
                height: 56,
                borderRadius: Radius.lg,
                borderWidth: 1,
                borderColor: C.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: C.textSecondary,
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {t("cancel")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <Modal
        visible={infoModal !== null}
        animationType="slide"
        onRequestClose={() => setInfoModal(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: C.bg,
            paddingTop: insets.top + Spacing.xl,
            paddingHorizontal: Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
            justifyContent: "center",
          }}
        >
          <View
            style={{
              backgroundColor: C.bgCard,
              borderRadius: Radius.xl,
              padding: Spacing.xl,
              borderWidth: 1,
              borderColor: C.border,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: C.accentDim,
                alignItems: "center",
                justifyContent: "center",
                alignSelf: "center",
                marginBottom: Spacing.md,
              }}
            >
              <Ionicons
                name={infoContent.icon}
                size={38}
                color={infoContent.iconColor}
              />
            </View>

            <Text
              style={{
                color: C.textPrimary,
                fontSize: 26,
                fontWeight: "800",
                textAlign: "center",
                marginBottom: Spacing.sm,
              }}
            >
              {infoContent.title}
            </Text>

            <Text
              style={{
                color: C.textSecondary,
                fontSize: 15,
                lineHeight: 22,
                textAlign: "center",
                marginBottom: Spacing.xl,
              }}
            >
              {infoContent.subtitle}
            </Text>

            <ScrollView
              style={{ maxHeight: 330 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: Spacing.md }}
            >
              {infoContent.items.map((item, index) => (
                <View
                  key={item.title}
                  style={{
                    backgroundColor: C.bgCardElevated,
                    borderRadius: Radius.lg,
                    borderWidth: 1,
                    borderColor: C.border,
                    padding: Spacing.base,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: Spacing.sm,
                      marginBottom: Spacing.xs,
                    }}
                  >
                    <View
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: 13,
                        backgroundColor: C.accentDim,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: C.accent,
                          fontSize: 13,
                          fontWeight: "800",
                        }}
                      >
                        {index + 1}
                      </Text>
                    </View>

                    <Text
                      style={{
                        flex: 1,
                        color: C.textPrimary,
                        fontSize: 15,
                        fontWeight: "700",
                      }}
                    >
                      {item.title}
                    </Text>
                  </View>

                  <Text
                    style={{
                      color: C.textSecondary,
                      fontSize: 14,
                      lineHeight: 22,
                    }}
                  >
                    {item.text}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setInfoModal(null)}
              style={{
                backgroundColor: C.accent,
                height: 56,
                borderRadius: Radius.lg,
                alignItems: "center",
                justifyContent: "center",
                marginTop: Spacing.xl,
              }}
            >
              <Text
                style={{
                  color: "#FFFFFF",
                  fontSize: 16,
                  fontWeight: "700",
                }}
              >
                {t("ok")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

function formatFocusBadge(
  totalMinutes: number,
  t: (key: TranslationKey) => string,
) {
  if (totalMinutes < 60) {
    return `${totalMinutes} ${t("min")}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return minutes > 0
    ? `${hours}${t("hourShort")} ${minutes}${t("min")}`
    : `${hours} ${t("hours")}`;
}

const s = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing["4xl"] },

  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.base,
    marginBottom: Spacing.base,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 24, color: "#fff", fontWeight: "700" },
  displayName: { fontSize: Typography.base, fontWeight: Typography.semibold },
  email: { fontSize: Typography.sm, marginTop: 2 },
  editBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  editBtnText: { fontSize: Typography.sm },

  badgeRow: { flexDirection: "row", gap: Spacing.sm, marginBottom: Spacing.xl },
  badge: {
    flex: 1,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: "center",
    gap: 4,
  },
  badgeLabel: { fontSize: 10, textAlign: "center" },

  sectionLabel: {
    fontSize: Typography.xs,
    fontWeight: Typography.semibold,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
  },
  sectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
  },

  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.base,
    gap: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  settingLabel: { fontSize: Typography.base },
  settingSubLabel: { fontSize: Typography.xs, marginTop: 2 },
  settingValue: { fontSize: Typography.sm },
  chevron: { fontSize: 22, lineHeight: 24 },

  saveBtn: {
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.md,
    paddingVertical: Spacing.md,
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    color: "#fff",
  },

  inlineToggle: { flexDirection: "row", gap: Spacing.sm },
  toggleOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  toggleText: { fontSize: Typography.xs, fontWeight: Typography.medium },

  version: {
    textAlign: "center",
    fontSize: Typography.xs,
    marginTop: Spacing.base,
  },
  languageCode: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
