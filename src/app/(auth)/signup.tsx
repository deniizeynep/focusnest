import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
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
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { useAuthStore } from "../../stores/authStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

export default function SignUpScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signUp, isLoading, error: authError, clearError } = useAuthStore();

  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = createStyles(C, Shadow);

  const t = (key: TranslationKey) => translate(language, key);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = async () => {
    setLocalError("");
    clearError();

    if (!displayName.trim()) {
      setLocalError(t("nameRequired"));
      return;
    }

    if (!email.trim()) {
      setLocalError(t("emailRequired"));
      return;
    }

    if (password.length < 8) {
      setLocalError(t("passwordMinError"));
      return;
    }

    if (password !== confirmPassword) {
      setLocalError(t("passwordsNotMatch"));
      return;
    }

    await signUp(email.trim().toLowerCase(), password, displayName.trim());
  };

  const displayedError = localError || authError;

  const passwordStrength = (() => {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  })();

  const strengthColor =
    passwordStrength <= 1
      ? C.accent
      : passwordStrength === 2
        ? C.warning
        : C.success;

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const canSignUp =
    displayName.trim().length >= 2 &&
    isValidEmail(email) &&
    password.length >= 8 &&
    confirmPassword === password &&
    !isLoading;

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top, paddingBottom: insets.bottom },
      ]}
    >
      <StatusBar barStyle={C.statusBar} backgroundColor={C.bg} />{" "}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
            <Ionicons name="arrow-back" size={22} color={C.textSecondary} />
            <Text style={styles.backText}>{t("back")}</Text>
          </TouchableOpacity>

          <View style={styles.titleBlock}>
            <Text style={styles.screenTitle}>{t("signupTitle")}</Text>
            <Text style={styles.screenSubtitle}>{t("signupSubtitle")}</Text>
          </View>

          <View style={styles.card}>
            {displayedError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{displayedError}</Text>
              </View>
            ) : null}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("displayName")}</Text>
              <TextInput
                style={styles.input}
                value={displayName}
                onChangeText={(value) => {
                  setDisplayName(value);
                  setLocalError("");
                  clearError();
                }}
                placeholder={t("displayNamePlaceholder")}
                placeholderTextColor={C.textMuted}
                autoCapitalize="words"
                returnKeyType="next"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("email")}</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setLocalError("");
                  clearError();
                }}
                placeholder={t("emailPlaceholder")}
                placeholderTextColor={C.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
              {email.length > 0 && !isValidEmail(email) ? (
                <Text style={styles.fieldError}>{t("invalidEmail")}</Text>
              ) : null}
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("password")}</Text>

              <View style={styles.passwordWrap}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    setLocalError("");
                    clearError();
                  }}
                  placeholder={t("passwordPlaceholder")}
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
                  autoCapitalize="none"
                />

                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((level) => (
                    <View
                      key={level}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            passwordStrength >= level
                              ? strengthColor
                              : C.bgMuted,
                        },
                      ]}
                    />
                  ))}

                  <Text
                    style={[styles.strengthLabel, { color: strengthColor }]}
                  >
                    {passwordStrength <= 1
                      ? t("weak")
                      : passwordStrength === 2
                        ? t("medium")
                        : passwordStrength === 3
                          ? t("good")
                          : t("strong")}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("confirmPassword")}</Text>

              <View style={styles.passwordWrap}>
                <TextInput
                  style={[
                    styles.input,
                    styles.passwordInput,
                    confirmPassword.length > 0 &&
                      confirmPassword !== password && {
                        borderColor: C.accent,
                      },
                  ]}
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    setLocalError("");
                    clearError();
                  }}
                  placeholder={t("passwordPlaceholder")}
                  placeholderTextColor={C.textMuted}
                  secureTextEntry={!showConfirmPassword}
                  returnKeyType="done"
                  autoCapitalize="none"
                  onSubmitEditing={handleSignUp}
                />

                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword((v) => !v)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={22}
                    color={C.textMuted}
                  />
                </TouchableOpacity>
              </View>

              {confirmPassword.length > 0 && confirmPassword !== password ? (
                <Text style={styles.matchError}>{t("passwordsNotMatch")}</Text>
              ) : null}
            </View>

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !canSignUp && styles.primaryBtnDisabled,
              ]}
              onPress={handleSignUp}
              disabled={!canSignUp}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t("signUpButton")}</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.privacyNote}>
              {t("privacyPrefix")}{" "}
              <Text style={styles.privacyLink}>{t("termsOfUse")}</Text>{" "}
              {t("privacyMiddle")}{" "}
              <Text style={styles.privacyLink}>{t("privacyPolicy")}</Text>
              {t("privacySuffix")}
            </Text>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("alreadyHaveAccount")}</Text>
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.footerLink}>{t("loginButton")}</Text>
            </TouchableOpacity>
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
      marginBottom: Spacing.xl,
      alignSelf: "flex-start",
      paddingVertical: Spacing.sm,
      paddingRight: Spacing.md,
    },
    backText: { fontSize: Typography.base, color: C.textSecondary },
    titleBlock: { marginBottom: Spacing.xl },
    screenTitle: {
      fontSize: 34,
      fontWeight: Typography.extraBold,
      color: C.textPrimary,
      letterSpacing: -0.8,
    },
    screenSubtitle: {
      fontSize: Typography.sm,
      color: C.textSecondary,
      marginTop: 4,
    },
    card: {
      backgroundColor: C.bgCard,
      borderRadius: Radius["2xl"],
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.xl,
      gap: Spacing.base,
      ...Shadow.card,
    },
    errorBox: {
      backgroundColor: C.accent + "18",
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.accent + "44",
      padding: Spacing.md,
    },
    errorText: { fontSize: Typography.sm, color: C.accent },
    fieldGroup: { gap: Spacing.xs },
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
      minHeight: 48,
    },

    eyeIcon: { fontSize: 16 },

    strengthRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 6,
    },
    strengthBar: {
      flex: 1,
      height: 3,
      borderRadius: 2,
    },
    strengthLabel: {
      fontSize: Typography.xs,
      fontWeight: Typography.medium,
      minWidth: 36,
      textAlign: "right",
    },
    primaryBtn: {
      backgroundColor: C.accent,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      minHeight: 54,
      alignItems: "center",
      justifyContent: "center",
      marginTop: Spacing.xs,
      ...Shadow.accent,
    },
    primaryBtnDisabled: { opacity: 0.6 },
    primaryBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: "#fff",
    },
    privacyNote: {
      fontSize: Typography.xs,
      color: C.textMuted,
      textAlign: "center",
      lineHeight: 18,
    },
    privacyLink: { color: C.accent },
    footer: {
      flexDirection: "row",
      justifyContent: "center",
      marginTop: Spacing.xl,
      paddingBottom: Spacing.base,
    },
    footerText: { fontSize: Typography.sm, color: C.textSecondary },
    footerLink: {
      fontSize: Typography.sm,
      color: C.accent,
      fontWeight: Typography.semibold,
    },
    passwordWrap: {
      position: "relative",
      width: "100%",
    },
    passwordInput: {
      paddingRight: 52,
    },
    eyeBtn: {
      position: "absolute",
      right: 14,
      top: 0,
      bottom: 0,
      justifyContent: "center",
      alignItems: "center",
    },
    matchError: {
      marginTop: 6,
      fontSize: Typography.xs,
      color: C.accent,
    },
    fieldError: {
      marginTop: 6,
      fontSize: Typography.xs,
      color: C.accent,
    },
  });
