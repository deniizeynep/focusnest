import { StyleSheet, Text, View } from "react-native";
import Svg, { Rect } from "react-native-svg";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import { getColors, Spacing } from "../../theme";

interface HeatmapCalendarProps {
  data?: { day: number; count: number }[];
}

export function HeatmapCalendar({ data = [] }: HeatmapCalendarProps) {
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const styles = createStyles(C);

  const t = (key: TranslationKey) => translate(language, key);

  const dayLabels = [
    t("mon"),
    t("tue"),
    t("wed"),
    t("thu"),
    t("fri"),
    t("sat"),
    t("sun"),
  ];

  const safeData =
    data.length > 0
      ? data
      : Array.from({ length: 35 }, (_, i) => ({
          day: i,
          count: 0,
        }));

  const cellSize = 36;
  const gap = 4;
  const cols = 7;
  const rows = Math.ceil(safeData.length / cols);
  const maxCount = Math.max(...safeData.map((d) => d.count), 1);

  const totalWidth = cols * cellSize + (cols - 1) * gap;
  const totalHeight = rows * cellSize + (rows - 1) * gap;

  const getColor = (count: number): string => {
    if (count === 0) return C.bgMuted;

    const intensity = count / maxCount;

    if (intensity < 0.25) return C.accent + "40";
    if (intensity < 0.5) return C.accent + "70";
    if (intensity < 0.75) return C.accent + "AA";

    return C.accent;
  };

  return (
    <View style={styles.wrapper}>
      <View style={[styles.dayLabels, { gap }]}>
        {dayLabels.map((label) => (
          <Text key={label} style={[styles.dayLabel, { width: cellSize }]}>
            {label}
          </Text>
        ))}
      </View>

      <Svg width={totalWidth} height={totalHeight}>
        {safeData.map((d, i) => {
          const col = i % cols;
          const row = Math.floor(i / cols);
          const x = col * (cellSize + gap);
          const y = row * (cellSize + gap);

          return (
            <Rect
              key={`${d.day}-${i}`}
              x={x}
              y={y}
              width={cellSize}
              height={cellSize}
              rx={7}
              fill={getColor(d.count)}
            />
          );
        })}
      </Svg>

      <View style={styles.legend}>
        <Text style={styles.legendLabel}>{t("lowActivity")}</Text>

        {[0, 0.25, 0.5, 0.75, 1].map((v, i) => (
          <View
            key={i}
            style={[
              styles.legendCell,
              {
                backgroundColor:
                  v === 0
                    ? C.bgMuted
                    : C.accent +
                      Math.round(v * 255)
                        .toString(16)
                        .padStart(2, "0"),
              },
            ]}
          />
        ))}

        <Text style={styles.legendLabel}>{t("highActivity")}</Text>
      </View>
    </View>
  );
}

const createStyles = (C: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    wrapper: {
      gap: Spacing.sm,
    },

    dayLabels: {
      flexDirection: "row",
    },

    dayLabel: {
      fontSize: 9,
      color: C.textMuted,
      textAlign: "center",
    },

    legend: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: Spacing.xs,
    },

    legendLabel: {
      fontSize: 9,
      color: C.textMuted,
    },

    legendCell: {
      width: 10,
      height: 10,
      borderRadius: 2,
    },
  });
