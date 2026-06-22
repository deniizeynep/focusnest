import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { translate, type TranslationKey } from "../../i18n/translations";
import { useAppStore } from "../../stores/appStore";
import type { NewTask } from "../../stores/taskStore";
import { getColors, getShadow, Radius, Spacing, Typography } from "../../theme";
interface AddTaskBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (task: NewTask) => void;
}

export function AddTaskBottomSheet({
  visible,
  onClose,
  onAdd,
}: AddTaskBottomSheetProps) {
  const { themeMode, language } = useAppStore();

  const C = getColors(themeMode);
  const Shadow = getShadow(themeMode);
  const styles = createStyles(C, Shadow);

  const t = (key: TranslationKey) => translate(language, key);
  const tagOptions = [
    { label: t("development"), color: C.info },
    { label: t("design"), color: C.accent },
    { label: t("research"), color: C.success },
    { label: t("meeting"), color: C.warning },
    { label: t("other"), color: C.textSecondary },
  ];

  const priorityOptions = [
    { value: 1, label: t("low"), color: C.success },
    { value: 2, label: t("medium"), color: C.warning },
    { value: 3, label: t("high"), color: C.accent },
  ];
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);
  const [priority, setPriority] = useState(2);
  const [selectedTagIndex, setSelectedTagIndex] = useState(0);
  const [titleError, setTitleError] = useState("");
  const selectedTag = tagOptions[selectedTagIndex];
  const reset = () => {
    setTitle("");
    setDescription("");
    setEstimatedPomodoros(1);
    setPriority(2);
    setSelectedTagIndex(0);
    setTitleError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleAdd = () => {
    if (!title.trim()) {
      setTitleError(t("taskNameRequired"));
      return;
    }
    onAdd({
      title: title.trim(),
      description: description.trim(),
      estimatedPomodoros,
      priority,
      tagLabel: selectedTag.label,
      tagColor: selectedTag.color,
    });
    reset();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      presentationStyle="fullScreen"
      statusBarTranslucent={false}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{t("newTask")}</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <Ionicons name="close" size={18} color={C.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              gap: Spacing.base,
              paddingBottom: Spacing["2xl"],
            }}
          >
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("taskName")}</Text>
              <TextInput
                style={[styles.input, titleError ? styles.inputError : null]}
                value={title}
                onChangeText={(v) => {
                  setTitle(v);
                  setTitleError("");
                }}
                placeholder={t("taskNamePlaceholder")}
                placeholderTextColor={C.textMuted}
                autoFocus
                returnKeyType="next"
              />
              {titleError ? (
                <Text style={styles.fieldError}>{titleError}</Text>
              ) : null}
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("taskDescription")}</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t("taskDescriptionPlaceholder")}
                placeholderTextColor={C.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("estimatedPomodoros")}</Text>
              <View style={styles.stepperRow}>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    estimatedPomodoros <= 1 && styles.stepperBtnDisabled,
                  ]}
                  onPress={() =>
                    setEstimatedPomodoros((v) => Math.max(1, v - 1))
                  }
                  disabled={estimatedPomodoros <= 1}
                >
                  <Ionicons name="remove" size={22} color={C.textPrimary} />
                </TouchableOpacity>
                <View style={styles.stepperValue}>
                  <Text style={styles.stepperNum}>{estimatedPomodoros}</Text>
                  <Text style={styles.stepperLabel}>
                    {estimatedPomodoros * 25} {t("minuteShort")}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[
                    styles.stepperBtn,
                    estimatedPomodoros >= 16 && styles.stepperBtnDisabled,
                  ]}
                  onPress={() =>
                    setEstimatedPomodoros((v) => Math.min(16, v + 1))
                  }
                  disabled={estimatedPomodoros >= 16}
                >
                  <Ionicons name="add" size={22} color={C.textPrimary} />
                </TouchableOpacity>
              </View>
              <View style={styles.dotsPreview}>
                {Array.from({ length: Math.min(estimatedPomodoros, 16) }).map(
                  (_, i) => (
                    <View key={i} style={styles.previewDot} />
                  ),
                )}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("priority")}</Text>
              <View style={styles.optionRow}>
                {priorityOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.optionBtn,
                      priority === opt.value && {
                        borderColor: opt.color,
                        backgroundColor: opt.color + "20",
                      },
                    ]}
                    onPress={() => setPriority(opt.value)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.priorityDot,
                        { backgroundColor: opt.color },
                      ]}
                    />
                    <Text
                      style={[
                        styles.optionBtnText,
                        priority === opt.value && { color: opt.color },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{t("category")}</Text>
              <View style={styles.tagGrid}>
                {tagOptions.map((tag, index) => (
                  <TouchableOpacity
                    key={tag.label}
                    style={[
                      styles.tagBtn,
                      selectedTagIndex === index && {
                        borderColor: tag.color,
                        backgroundColor: tag.color + "20",
                      },
                    ]}
                    onPress={() => setSelectedTagIndex(index)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[styles.tagDot, { backgroundColor: tag.color }]}
                    />
                    <Text
                      style={[
                        styles.tagBtnText,
                        selectedTagIndex === index && { color: tag.color },
                      ]}
                    >
                      {tag.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAdd}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>{t("addTaskButton")}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const createStyles = (
  C: ReturnType<typeof getColors>,
  Shadow: ReturnType<typeof getShadow>,
) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: C.bg,
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: C.bgCard,
      borderTopLeftRadius: Radius["2xl"],
      borderTopRightRadius: Radius["2xl"],
      borderWidth: 1,
      borderColor: C.border,
      padding: Spacing.xl,
      paddingTop: Spacing.md,
      maxHeight: "92%",
      ...Shadow.card,
    },
    handle: {
      width: 36,
      height: 4,
      backgroundColor: C.bgMuted,
      borderRadius: 2,
      alignSelf: "center",
      marginBottom: Spacing.base,
    },
    sheetHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    sheetTitle: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: C.textPrimary,
    },
    closeBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: C.bgMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    fieldGroup: { gap: Spacing.xs },
    fieldLabel: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: C.textSecondary,
    },
    fieldError: { fontSize: Typography.xs, color: C.accent },
    input: {
      backgroundColor: C.bgCardElevated,
      borderRadius: Radius.lg,
      borderWidth: 1,
      borderColor: C.border,
      paddingHorizontal: Spacing.base,
      paddingVertical: Spacing.md,
      fontSize: Typography.base,
      color: C.textPrimary,
    },
    inputError: { borderColor: C.accent },
    textArea: { height: 80, paddingTop: Spacing.md },

    stepperRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.base,
    },
    stepperBtn: {
      width: 44,
      height: 44,
      borderRadius: Radius.md,
      backgroundColor: C.bgCardElevated,
      borderWidth: 1,
      borderColor: C.border,
      alignItems: "center",
      justifyContent: "center",
    },
    stepperBtnDisabled: { opacity: 0.4 },
    stepperIcon: { fontSize: 20, color: C.textPrimary, lineHeight: 22 },
    stepperValue: { flex: 1, alignItems: "center" },
    stepperNum: {
      fontSize: Typography["2xl"],
      fontWeight: Typography.bold,
      color: C.textPrimary,
      lineHeight: 32,
    },
    stepperLabel: { fontSize: Typography.xs, color: C.textSecondary },
    dotsPreview: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
      marginTop: Spacing.xs,
    },
    previewDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: C.accent,
    },
    optionRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    optionBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.lg,
      backgroundColor: C.bgCardElevated,
      borderWidth: 1,
      borderColor: C.border,
    },
    priorityDot: { width: 8, height: 8, borderRadius: 4 },
    optionBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: C.textSecondary,
    },
    tagGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    tagBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: Spacing.md,
      paddingVertical: Spacing.sm,
      borderRadius: Radius.full,
      backgroundColor: C.bgCardElevated,
      borderWidth: 1,
      borderColor: C.border,
    },
    tagDot: { width: 8, height: 8, borderRadius: 4 },
    tagBtnText: {
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
      color: C.textSecondary,
    },
    addBtn: {
      backgroundColor: C.accent,
      borderRadius: Radius.lg,
      paddingVertical: Spacing.base,
      alignItems: "center",
      marginTop: Spacing.base,
      ...Shadow.accent,
    },
    addBtnText: {
      fontSize: Typography.base,
      fontWeight: Typography.semibold,
      color: "#fff",
    },
  });
