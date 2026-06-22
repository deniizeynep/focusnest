import { StyleSheet, Text, View } from "react-native";
import { Radius, Spacing, Typography } from "../../theme";

interface TagChipProps {
  label: string;
  color: string;
  small?: boolean;
}

export function TagChip({ label, color, small = false }: TagChipProps) {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: color + "22",
          borderColor: color + "33",
        },
        small && styles.chipSmall,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: color },
          small && styles.dotSmall,
        ]}
      />

      <Text style={[styles.label, { color }, small && styles.labelSmall]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    alignSelf: "flex-start",
    borderWidth: 1,
  },

  chipSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
  },

  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  dotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  label: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },

  labelSmall: {
    fontSize: 10,
  },
});
