import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import { useState } from "react";
import { useOnboarding } from "../../lib/onboarding-context";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

const COMMON_CONDITIONS = [
  "Diabetes",
  "Hipertension",
  "Problemas del corazon",
  "Problemas de movilidad",
  "Artritis",
  "Problemas de vision",
  "Problemas de audicion",
  "Depresion o ansiedad",
  "Problemas de memoria",
  "Problemas respiratorios",
];

export default function HealthScreen() {
  const { data, toggleCondition, updateData } = useOnboarding();
  const [customCondition, setCustomCondition] = useState("");

  const handleAddCustom = () => {
    const trimmed = customCondition.trim();
    if (trimmed && !data.healthConditions.includes(trimmed)) {
      updateData({ healthConditions: [...data.healthConditions, trimmed] });
      setCustomCondition("");
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.top} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress dots */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View style={styles.iconCircle}>
            <Ionicons name="heart-half" size={32} color={colors.ember} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text style={styles.title}>Condiciones de salud</Text>
          <Text style={styles.subtitle}>
            Esto ayuda a Lumi a ser mas empatica y cuidadosa con temas sensibles.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(500)}>
          <View style={styles.chips}>
            {COMMON_CONDITIONS.map((condition) => {
              const selected = data.healthConditions.includes(condition);
              return (
                <Pressable
                  key={condition}
                  style={[styles.chip, selected && styles.chipSelected]}
                  onPress={() => toggleCondition(condition)}
                >
                  <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                    {condition}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={16} color={colors.warmWhite} />
                  )}
                </Pressable>
              );
            })}
          </View>

          {/* Custom condition */}
          <View style={styles.customRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="Otro padecimiento..."
              placeholderTextColor={colors.fog}
              value={customCondition}
              onChangeText={setCustomCondition}
              onSubmitEditing={handleAddCustom}
              returnKeyType="done"
            />
            <Pressable
              style={[styles.addBtn, !customCondition.trim() && { opacity: 0.4 }]}
              onPress={handleAddCustom}
              disabled={!customCondition.trim()}
            >
              <Ionicons name="add" size={22} color={colors.warmWhite} />
            </Pressable>
          </View>

          {/* Custom conditions added */}
          {data.healthConditions
            .filter((c) => !COMMON_CONDITIONS.includes(c))
            .map((c) => (
              <View key={c} style={styles.customChip}>
                <Text style={styles.customChipText}>{c}</Text>
                <Pressable onPress={() => toggleCondition(c)} hitSlop={8}>
                  <Ionicons name="close-circle" size={20} color={colors.rose} />
                </Pressable>
              </View>
            ))}
        </Animated.View>
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.buttonRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.driftwood} />
            <Text style={styles.backBtnText}>Atras</Text>
          </Pressable>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push("/(onboarding)/medications")}
          >
            <Text style={styles.primaryBtnText}>Siguiente</Text>
          </Pressable>
        </View>
        <Pressable
          style={styles.skipBtn}
          onPress={() => router.push("/(onboarding)/medications")}
        >
          <Text style={styles.skipText}>Sin padecimientos conocidos</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.cream,
    paddingTop: 70,
    paddingHorizontal: spacing.lg,
  },
  top: { flex: 1 },
  scrollContent: { paddingBottom: spacing.lg },
  dots: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fog },
  dotActive: { backgroundColor: colors.ember, width: 24, borderRadius: 4 },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.roseSoft,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: spacing.lg,
  },
  title: { ...font.heading, textAlign: "center", marginBottom: spacing.sm },
  subtitle: {
    ...font.body,
    textAlign: "center",
    color: colors.driftwood,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: spacing.lg,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
    backgroundColor: colors.creamDeep,
    borderWidth: 1.5,
    borderColor: colors.creamDeep,
  },
  chipSelected: {
    backgroundColor: colors.ember,
    borderColor: colors.ember,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.walnut,
  },
  chipTextSelected: {
    color: colors.warmWhite,
  },
  customRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: spacing.md,
  },
  input: {
    borderWidth: 1.5,
    borderColor: colors.creamDeep,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 16,
    color: colors.espresso,
    backgroundColor: colors.warmWhite,
    fontWeight: "500",
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.ember,
    alignItems: "center",
    justifyContent: "center",
  },
  customChip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.sm,
    backgroundColor: colors.peachMist,
    marginBottom: spacing.sm,
  },
  customChipText: { fontSize: 14, fontWeight: "600", color: colors.walnut },
  bottom: { paddingBottom: 50 },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 18,
    paddingHorizontal: spacing.md,
  },
  backBtnText: { color: colors.driftwood, fontSize: 15, fontWeight: "700" },
  primaryBtn: {
    flex: 1,
    backgroundColor: colors.ember,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    ...shadows.warm,
  },
  primaryBtnText: {
    color: colors.warmWhite,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  skipBtn: { alignSelf: "center", marginTop: spacing.md, paddingVertical: 8 },
  skipText: { color: colors.driftwood, fontSize: 14, fontWeight: "600" },
});
