import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { confirmPasswordReset, requestPasswordReset } from "../../api/auth";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

type Step = "email" | "reset" | "success";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = createStyles(C, Shadow);

  const t = (key: TranslationKey) => translate(language, key);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [passwordAgain, setPasswordAgain] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordAgain, setShowPasswordAgain] = useState(false);

  const [resendSeconds, setResendSeconds] = useState(0);

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError(t("emailRequired"));
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await requestPasswordReset(email.trim().toLowerCase());
      setStep("reset");
      setToken("");
      setResendSeconds(60);
    } catch (e: any) {
      setError(e.message ?? t("resetStartError"));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!/^\d{6}$/.test(token.trim())) {
      setError(t("codeSixDigitsError"));
      return;
    }
    if (!password || !passwordAgain) {
      setError(t("passwordRequired"));
      return;
    }

    if (password.length < 8) {
      setError(t("passwordMinError"));
      return;
    }

    if (password !== passwordAgain) {
      setError(t("passwordsNotMatch"));
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      await confirmPasswordReset(token.trim(), password);
      setStep("success");
    } catch (e: any) {
      setError(e.message ?? t("passwordUpdateError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (resendSeconds <= 0) return;

    const interval = setInterval(() => {
      setResendSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [resendSeconds]);

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const canSendCode = isValidEmail(email) && !isLoading;

  const canResetPassword =
    /^\d{6}$/.test(token.trim()) &&
    password.length >= 8 &&
    passwordAgain === password &&
    !isLoading;

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={22} color={C.textSecondary} />{" "}
            <Text style={styles.backText}>{t("back")}</Text>
          </TouchableOpacity>

          <View style={styles.centered}>
            {step === "email" ? (
              <View style={styles.card}>
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="key-outline"
                    size={34}
                    color={C.accent}
                  />{" "}
                </View>

                <Text style={styles.cardTitle}>{t("forgotPasswordTitle")}</Text>

                <Text style={styles.cardDesc}>{t("forgotPasswordDesc")}</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("email")}</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={(value) => {
                      setEmail(value);
                      setError("");
                    }}
                    placeholder={t("emailPlaceholder")}
                    placeholderTextColor={C.textMuted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={handleSendCode}
                  />
                  {email.length > 0 && !isValidEmail(email) ? (
                    <Text style={styles.fieldError}>{t("invalidEmail")}</Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    !canSendCode && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={!canSendCode}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>{t("sendCode")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}

            {step === "reset" ? (
              <View style={styles.card}>
                <View
                  style={[styles.iconCircle, { backgroundColor: C.successDim }]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={34}
                    color={C.success}
                  />{" "}
                </View>

                <Text style={styles.cardTitle}>{t("resetPasswordTitle")}</Text>

                {error ? (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                <Text style={styles.infoText}>{t("checkEmail")}</Text>
                <Text style={styles.infoCode}>{t("codeValidInfo")}</Text>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("resetCode")}</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={token}
                    onChangeText={(value) => {
                      const onlyNumbers = value.replace(/\D/g, "");
                      setToken(onlyNumbers.slice(0, 6));
                      setError("");
                    }}
                    placeholder={t("resetCodePlaceholder")}
                    placeholderTextColor={C.textMuted}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("newPassword")}</Text>

                  <View style={styles.passwordField}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={password}
                      onChangeText={(value) => {
                        setPassword(value);
                        setError("");
                      }}
                      placeholder={t("passwordPlaceholder")}
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                    />

                    <TouchableOpacity
                      style={styles.passwordIconBtn}
                      onPress={() => setShowPassword((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={showPassword ? "eye-off-outline" : "eye-outline"}
                        size={22}
                        color={C.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>{t("newPasswordAgain")}</Text>

                  <View style={styles.passwordField}>
                    <TextInput
                      style={[styles.input, styles.passwordInput]}
                      value={passwordAgain}
                      onChangeText={(value) => {
                        setPasswordAgain(value);
                        setError("");
                      }}
                      placeholder={t("passwordPlaceholder")}
                      placeholderTextColor={C.textMuted}
                      secureTextEntry={!showPasswordAgain}
                      autoCapitalize="none"
                    />

                    <TouchableOpacity
                      style={styles.passwordIconBtn}
                      onPress={() => setShowPasswordAgain((prev) => !prev)}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={
                          showPasswordAgain ? "eye-off-outline" : "eye-outline"
                        }
                        size={22}
                        color={C.textMuted}
                      />
                    </TouchableOpacity>
                  </View>

                  {passwordAgain.length > 0 && passwordAgain !== password ? (
                    <Text style={styles.fieldError}>
                      {t("passwordsNotMatch")}
                    </Text>
                  ) : null}
                </View>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    !canResetPassword && styles.primaryBtnDisabled,
                  ]}
                  onPress={handleResetPassword}
                  disabled={!canResetPassword}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>
                      {t("updatePassword")}
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryBtn,
                    (isLoading || resendSeconds > 0) &&
                      styles.secondaryBtnDisabled,
                  ]}
                  onPress={handleSendCode}
                  disabled={isLoading || resendSeconds > 0}
                >
                  <Text style={styles.secondaryBtnText}>
                    {resendSeconds > 0
                      ? `${t("resendCode")}  (${resendSeconds}s)`
                      : t("resendCode")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setStep("email");
                    setToken("");
                    setPassword("");
                    setPasswordAgain("");
                    setError("");
                  }}
                >
                  <Text style={styles.secondaryBtnText}>
                    {t("tryAnotherEmail")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            {step === "success" ? (
              <View style={styles.card}>
                <View
                  style={[styles.iconCircle, { backgroundColor: C.successDim }]}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={38}
                    color={C.success}
                  />{" "}
                </View>

                <Text style={styles.cardTitle}>
                  {t("passwordUpdatedTitle")}
                </Text>

                <Text style={styles.cardDesc}>{t("passwordUpdatedDesc")}</Text>

                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => router.replace("/(auth)/login")}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryBtnText}>{t("backToLogin")}</Text>
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const createStyles = (
  C: ReturnType<typeof getColors>,
  Shadow: ReturnType<typeof getShadow>,
) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: C.bg },
    kav: { flex: 1 },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing["2xl"],
    },

    backBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      marginBottom: Spacing["2xl"],
      alignSelf: "flex-start",
      paddingVertical: Spacing.sm,
      paddingRight: Spacing.md,
    },
    backIcon: { fontSize: Typography.lg, color: C.textSecondary },
    backText: { fontSize: Typography.base, color: C.textSecondary },

    centered: {
      flex: 1,
      justifyContent: "center",
    },

    card: {
      backgroundColor: C.bgCard,
      borderRadius: Radius["2xl"],
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.xl,
      gap: Spacing.base,
      alignItems: "center",
      ...Shadow.card,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 24,
      backgroundColor: C.accentDim,
      borderWidth: 1,
      borderColor: C.borderStrong,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xs,
    },
    iconEmoji: { fontSize: 30 },
    cardTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: C.textPrimary,
      textAlign: "center",
    },
    cardDesc: {
      fontSize: Typography.sm,
      color: C.textSecondary,
      textAlign: "center",
      lineHeight: 20,
    },
    errorBox: {
      width: "100%",
      backgroundColor: C.accent + "18",
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.accent + "44",
      padding: Spacing.md,
    },
    errorText: { fontSize: Typography.sm, color: C.accent },
    infoBox: {
      width: "100%",
      backgroundColor: C.bgCardElevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.md,
      gap: 4,
    },
    infoText: {
      color: C.textSecondary,
      fontSize: Typography.sm,
      textAlign: "center",
    },
    infoCode: {
      color: C.textPrimary,
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      textAlign: "center",
    },
    fieldGroup: { gap: Spacing.xs, width: "100%" },
    fieldLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: C.textSecondary,
    },
    input: {
      backgroundColor: C.bgCardElevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: Spacing.base,
      paddingVertical: Platform.OS === "android" ? 10 : Spacing.md,
      fontSize: Typography.base,
      color: C.textPrimary,
      width: "100%",
      minHeight: 48,
    },
    primaryBtn: {
      width: "100%",
      backgroundColor: C.accent,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      minHeight: 54,
      alignItems: "center",
      justifyContent: "center",
      ...Shadow.accent,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: "#fff",
    },
    secondaryBtn: {
      width: "100%",
      paddingVertical: Spacing.md,
      alignItems: "center",
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      backgroundColor: C.bgCardElevated,
      minHeight: 48,
      justifyContent: "center",
    },
    secondaryBtnText: {
      fontSize: Typography.base,
      color: C.textSecondary,
      fontWeight: Typography.medium,
    },
    codeInput: {
      textAlign: "center",
      letterSpacing: 8,
      fontSize: 22,
      fontWeight: "700",
    },
    secondaryBtnDisabled: {
      opacity: 0.5,
    },
    passwordField: {
      width: "100%",
      position: "relative",
    },
    passwordInput: {
      paddingRight: 52,
    },
    passwordIconBtn: {
      position: "absolute",
      right: 14,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    fieldError: {
      marginTop: 6,
      fontSize: Typography.xs,
      color: C.accent,
    },
  });
