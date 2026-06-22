import { useEffect, useRef } from "react";
import { Animated } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { useAppStore } from "../../stores/appStore";
import { getColors } from "../../theme";

interface CircularProgressProps {
  progress: number; // 0-1
  size: number;
  strokeWidth: number;
  color: string;
  isRunning?: boolean;
}

export function CircularProgress({
  progress,
  size,
  strokeWidth,
  color,
  isRunning = false,
}: CircularProgressProps) {
  const { themeMode } = useAppStore();
  const C = getColors(themeMode);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const safeProgress = Math.min(1, Math.max(0, progress));
  const strokeDashoffset = circumference * (1 - safeProgress);

  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isRunning) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.025,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
      );

      animation.start();

      return () => {
        animation.stop();
      };
    }

    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isRunning, pulseAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Svg
        width={size}
        height={size}
        style={{ transform: [{ rotate: "-90deg" }] }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={C.bgMuted}
          strokeWidth={strokeWidth}
          fill="none"
        />

        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
    </Animated.View>
  );
}
