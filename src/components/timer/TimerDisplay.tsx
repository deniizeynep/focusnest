import { StyleSheet, Text } from "react-native";

interface TimerDisplayProps {
  timeLeft: number;
  color: string;
}

export function TimerDisplay({ timeLeft, color }: TimerDisplayProps) {
  const minutes = Math.floor(timeLeft / 60)
    .toString()
    .padStart(2, "0");

  const seconds = (timeLeft % 60).toString().padStart(2, "0");

  return (
    <Text style={[styles.display, { color }]}>
      {minutes}:{seconds}
    </Text>
  );
}

const styles = StyleSheet.create({
  display: {
    fontFamily: "Courier New",
    fontSize: 72,
    fontWeight: "700",
    letterSpacing: -2,
    lineHeight: 80,
  },
});
