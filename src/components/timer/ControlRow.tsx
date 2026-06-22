import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useAppStore } from "../../stores/appStore";
import { getColors, getShadow, Spacing } from "../../theme";

interface ControlRowProps {
  isRunning: boolean;
  onPlay: () => void;
  onPause: () => void;
  onReset: () => void;
  onSkip: () => void;
  color: string;
}

export function ControlRow({
  isRunning,
  onPlay,
  onPause,
  onReset,
  onSkip,
  color,
}: ControlRowProps) {
  const { themeMode } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);

  return (
    <View style={styles.row}>
      <TouchableOpacity
        style={[
          styles.secondaryBtn,
          {
            backgroundColor: C.bgCard,
            borderColor: C.border,
            ...Shadow.subtle,
          },
        ]}
        onPress={onReset}
        activeOpacity={0.7}
      >
        <Ionicons name="refresh-outline" size={22} color={C.textSecondary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.playBtn,
          {
            backgroundColor: color,
            ...Shadow.accent,
          },
        ]}
        onPress={isRunning ? onPause : onPlay}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isRunning ? "pause" : "play"}
          size={32}
          color="#fff"
          style={!isRunning ? { marginLeft: 3 } : undefined}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.secondaryBtn,
          {
            backgroundColor: C.bgCard,
            borderColor: C.border,
            ...Shadow.subtle,
          },
        ]}
        onPress={onSkip}
        activeOpacity={0.7}
      >
        <Ionicons
          name="play-skip-forward-outline"
          size={22}
          color={C.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xl,
    marginBottom: Spacing.xl,
  },

  playBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  secondaryBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
