import { StyleSheet, View } from "react-native";
import { useAppStore } from "../../stores/appStore";
import { getColors } from "../../theme";

interface PomodoroDotsProps {
  total: number;
  completed: number;
  color: string;
  size?: number;
  maxVisible?: number;
}

export function PomodoroDots({
  total,
  completed,
  color,
  size = 8,
  maxVisible = 8,
}: PomodoroDotsProps) {
  const { themeMode } = useAppStore();
  const C = getColors(themeMode);
  const styles = createStyles(C);

  const visible = Math.min(total, maxVisible);
  const radius = size / 2;

  return (
    <View style={styles.row}>
      {Array.from({ length: visible }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
            i < completed
              ? { backgroundColor: color }
              : {
                  backgroundColor: "transparent",
                  borderWidth: 1.5,
                  borderColor: C.bgMuted,
                },
          ]}
        />
      ))}

      {total > maxVisible && (
        <View
          style={[
            styles.dot,
            styles.overflow,
            {
              width: size,
              height: size,
              borderRadius: radius,
            },
          ]}
        />
      )}
    </View>
  );
}

const createStyles = (C: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexWrap: "nowrap",
    },

    dot: {},

    overflow: {
      backgroundColor: C.bgMuted,
    },
  });
