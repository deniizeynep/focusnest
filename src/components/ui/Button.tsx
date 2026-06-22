import React from "react";
import {
  ActivityIndicator,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  ViewStyle,
} from "react-native";
import { useAppStore } from "../../stores/appStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  leftIcon?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  labelStyle,
  leftIcon,
}: ButtonProps) {
  const { themeMode } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = createStyles(C, Shadow);

  const containerStyle = [
    styles.base,
    styles[`variant_${variant}`],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
    style,
  ];

  const textStyle = [
    styles.label,
    styles[`label_${variant}`],
    styles[`labelSize_${size}`],
    labelStyle,
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={
            variant === "primary" || variant === "danger" ? "#fff" : C.accent
          }
          size="small"
        />
      ) : (
        <>
          {leftIcon}
          <Text style={textStyle}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (
  C: ReturnType<typeof getColors>,
  Shadow: ReturnType<typeof getShadow>,
) =>
  StyleSheet.create({
    base: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      borderRadius: Radius.lg,
    },

    fullWidth: {
      alignSelf: "stretch",
    },

    disabled: {
      opacity: 0.5,
    },

    variant_primary: {
      backgroundColor: C.accent,
      ...Shadow.accent,
    },

    variant_secondary: {
      backgroundColor: C.bgCard,
      borderWidth: 1,
      borderColor: C.border,
      ...Shadow.subtle,
    },

    variant_ghost: {
      backgroundColor: "transparent",
    },

    variant_danger: {
      backgroundColor: C.danger,
      ...Shadow.accent,
    },

    size_sm: {
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
    },

    size_md: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
    },

    size_lg: {
      paddingHorizontal: Spacing["2xl"],
      paddingVertical: Spacing.base,
    },

    label: {
      fontWeight: Typography.semibold,
    },

    label_primary: {
      color: "#fff",
    },

    label_secondary: {
      color: C.textPrimary,
    },

    label_ghost: {
      color: C.accent,
    },

    label_danger: {
      color: "#fff",
    },

    labelSize_sm: {
      fontSize: Typography.sm,
    },

    labelSize_md: {
      fontSize: Typography.base,
    },

    labelSize_lg: {
      fontSize: Typography.md,
    },
  });
