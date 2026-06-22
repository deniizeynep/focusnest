import { StyleSheet, View } from "react-native";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";
import { useAppStore } from "../../stores/appStore";
import { getColors } from "../../theme";

interface BarData {
  label: string;
  count: number;
}

interface BarChartProps {
  data: BarData[];
  color?: string;
  height?: number;
}

export function BarChart({ data, color, height = 120 }: BarChartProps) {
  const { themeMode } = useAppStore();
  const C = getColors(themeMode);

  const chartColor = color ?? C.accent;

  const safeData =
    data.length > 0
      ? data
      : [
          {
            label: "",
            count: 0,
          },
        ];

  const CHART_W = 320;
  const PAD_H = 6;
  const PAD_TOP = 20;
  const LABEL_H = 20;
  const barAreaH = height - PAD_TOP;

  const maxCount = Math.max(...safeData.map((d) => d.count), 1);
  const totalGap = PAD_H * (safeData.length - 1);
  const barW = (CHART_W - totalGap) / safeData.length;

  return (
    <View style={styles.wrapper}>
      <Svg
        width="100%"
        height={height + LABEL_H}
        viewBox={`0 0 ${CHART_W} ${height + LABEL_H}`}
      >
        {[0.25, 0.5, 0.75, 1].map((ratio) => (
          <Line
            key={ratio}
            x1={0}
            y1={PAD_TOP + barAreaH * (1 - ratio)}
            x2={CHART_W}
            y2={PAD_TOP + barAreaH * (1 - ratio)}
            stroke={C.bgMuted}
            strokeWidth={0.5}
            strokeDasharray="4,4"
          />
        ))}

        {safeData.map((d, i) => {
          const barH = d.count > 0 ? (d.count / maxCount) * barAreaH : 2;
          const x = i * (barW + PAD_H);
          const y = PAD_TOP + barAreaH - barH;
          const isLast = i === safeData.length - 1;

          return (
            <G key={`${d.label}-${i}`}>
              <Rect
                x={x}
                y={y}
                width={barW}
                height={barH}
                rx={4}
                fill={isLast ? chartColor : chartColor + "55"}
              />

              <SvgText
                x={x + barW / 2}
                y={height + LABEL_H - 2}
                fontSize={9}
                fill={C.textMuted}
                textAnchor="middle"
                fontFamily="System"
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
  },
});
