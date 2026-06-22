import { Ionicons } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useMemo, useState } from "react";
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
import BrandLogo from "../../components/BrandLogo";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { useAuthStore } from "../../stores/authStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { signIn, signInWithGoogle, isLoading, error, clearError } =
    useAuthStore();
  const { themeMode, language, toggleTheme, toggleLanguage } = useAppStore();
  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = useMemo(() => createStyles(C, Shadow), [C, Shadow]);

  const t = (key: TranslationKey) => translate(language, key);

  const [email, setEmail] = useState("");
  const [screenError, setScreenError] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) return;

    try {
      clearError();
      setScreenError("");

      await signIn(email.trim().toLowerCase(), password);

      console.log("LOGIN SUCCESS, ROUTING TO HOME");

      router.replace("/");
    } catch (e: any) {
      setScreenError(e.message ?? "Giriş yapılamadı.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setScreenError("");
      await signInWithGoogle();
    } catch (e: any) {
      setScreenError(e.message ?? t("googleLoginError"));
    }
  };

  const isValidEmail = (value: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  };

  const canLogin =
    isValidEmail(email) && password.trim().length > 0 && !isLoading;

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
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {/* Logo */}
          <View style={styles.hero}>
            <View style={styles.logoWrap}>
              <BrandLogo size="small" />
            </View>

            <Text style={styles.appTitle}>{t("welcomeTitle")}</Text>
            <Text style={styles.appSubtitle}>{t("welcomeSubtitle")}</Text>
          </View>
          {/* Form kartı */}
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{t("loginTitle")}</Text>

              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={toggleLanguage}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardActionText}>
                    {language === "tr" ? "EN" : "TR"}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardActionBtn}
                  onPress={toggleTheme}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={
                      themeMode === "dark" ? "sunny-outline" : "moon-outline"
                    }
                    size={17}
                    color={C.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {error ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={C.accent}
                />
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
                  clearError();
                  setScreenError("");
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
              <View style={styles.passwordField}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
                    setScreenError("");
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

            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => router.push("/(auth)/forgot-password")}
            >
              <Text style={styles.forgotLinkText}>{t("forgotPassword")}</Text>
            </TouchableOpacity>

            {screenError ? (
              <View style={styles.errorBox}>
                <Ionicons
                  name="alert-circle-outline"
                  size={18}
                  color={C.accent}
                />
                <Text style={styles.errorText}>{screenError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.primaryBtn,
                !canLogin && styles.primaryBtnDisabled,
              ]}
              onPress={handleLogin}
              disabled={!canLogin}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryBtnText}>{t("signIn")}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>{t("or")}</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={[styles.oauthBtn, isLoading && styles.primaryBtnDisabled]}
              activeOpacity={0.7}
              onPress={() => {
                clearError();
                handleGoogleLogin();
              }}
              disabled={isLoading}
            >
              <Text style={styles.oauthIcon}>G</Text>
              <Text style={styles.oauthText}>{t("continueWithGoogle")}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>{t("noAccount")}</Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>{t("signUp")}</Text>
              </TouchableOpacity>
            </Link>
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
    root: {
      flex: 1,
      backgroundColor: C.bg,
    },
    kav: {
      flex: 1,
    },
    scroll: {
      flexGrow: 1,
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing.lg,
      justifyContent: "center",
    },
    hero: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    card: {
      backgroundColor: C.bgCard,
      borderRadius: Radius.xl,
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.xl,
      gap: Spacing.base,
      ...Shadow.card,
    },
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
    forgotLink: { alignSelf: "flex-end" },
    forgotLinkText: {
      fontSize: Typography.sm,
      color: C.accent,
      fontWeight: Typography.medium,
    },
    primaryBtn: {
      backgroundColor: C.accent,
      borderRadius: Radius.md,
      paddingVertical: Spacing.base,
      minHeight: 52,
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
      letterSpacing: 0.3,
    },
    divider: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.border },
    dividerText: { fontSize: Typography.xs, color: C.textMuted },
    oauthBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      backgroundColor: C.bgCardElevated,
      borderRadius: Radius.md,
      borderWidth: 1,
      borderColor: C.border,
      paddingVertical: Spacing.base,
      minHeight: 52,
    },
    oauthIcon: {
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: C.textPrimary,
    },
    oauthText: {
      fontSize: Typography.base,
      color: C.textPrimary,
      fontWeight: Typography.medium,
    },

    footer: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginTop: Spacing.xl,
      paddingBottom: Spacing.base,
    },
    footerText: { fontSize: Typography.sm, color: C.textSecondary },
    footerLink: {
      fontSize: Typography.sm,
      color: C.accent,
      fontWeight: Typography.semibold,
    },
    passwordField: {
      width: "100%",
      position: "relative",
    },
    passwordInput: {
      paddingRight: 82,
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
    errorBox: {
      width: "100%",
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: C.bgCardElevated,
      borderWidth: 1,
      borderColor: C.accent,
      borderRadius: Radius.md,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    errorText: {
      flex: 1,
      color: C.accent,
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
    },
    logoWrap: {
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
    },
    appTitle: {
      fontSize: 34,
      fontWeight: Typography.bold,
      color: C.textPrimary,
      letterSpacing: -0.8,
      marginTop: Spacing.sm,
    },
    appSubtitle: {
      fontSize: Typography.sm,
      color: C.textSecondary,
      marginTop: 8,
      textAlign: "center",
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: Spacing.sm,
    },
    cardTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: C.textPrimary,
    },
    cardActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    cardActionBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: C.bgCardElevated,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    cardActionText: {
      fontSize: Typography.xs,
      fontWeight: Typography.bold,
      color: C.textSecondary,
      letterSpacing: 0.4,
    },
  });
