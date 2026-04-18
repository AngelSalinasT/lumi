import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import { useOnboarding } from "../../lib/onboarding-context";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

export default function ProfileScreen() {
  const { data, updateData } = useOnboarding();

  const canContinue = data.elderlyName.trim().length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        {/* Progress dots */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>

        {/* Speech bubble + face */}
        <Animated.View entering={FadeInUp.delay(200).duration(500)} style={styles.bubbleArea}>
          <View style={styles.bubble}>
            <Text style={styles.bubbleText}>Como se llama tu ser querido?</Text>
          </View>
          <View style={styles.smallFace}>
            <View style={styles.eyeRow}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.mouth} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text style={styles.title}>Datos basicos</Text>
          <Text style={styles.subtitle}>
            Esta informacion ayuda a Lumi a conocer y tratar mejor a tu ser querido.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={font.label}>NOMBRE</Text>
            <TextInput
              style={styles.input}
              placeholder="Don Ernesto, Abuelita Rosa..."
              placeholderTextColor={colors.fog}
              value={data.elderlyName}
              onChangeText={(v) => updateData({ elderlyName: v })}
              autoFocus
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={font.label}>EDAD (OPCIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="78"
              placeholderTextColor={colors.fog}
              value={data.elderlyAge}
              onChangeText={(v) => updateData({ elderlyAge: v })}
              keyboardType="number-pad"
              maxLength={3}
            />
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.buttonRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.driftwood} />
            <Text style={styles.backBtnText}>Atras</Text>
          </Pressable>
          <Pressable
            style={[styles.primaryBtn, !canContinue && { opacity: 0.4 }]}
            onPress={() => router.push("/(onboarding)/health")}
            disabled={!canContinue}
          >
            <Text style={styles.primaryBtnText}>Siguiente</Text>
          </Pressable>
        </View>
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
  dots: {
    flexDirection: "row",
    gap: 8,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fog },
  dotActive: { backgroundColor: colors.ember, width: 24, borderRadius: 4 },
  bubbleArea: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    alignSelf: "center",
    marginBottom: spacing.xl,
  },
  bubble: {
    backgroundColor: colors.creamDeep,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderBottomRightRadius: 4,
    maxWidth: 220,
  },
  bubbleText: {
    ...font.body,
    color: colors.walnut,
    fontStyle: "italic",
  },
  smallFace: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  eyeRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  eye: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.espresso },
  mouth: {
    width: 12,
    height: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: colors.ember,
  },
  title: { ...font.heading, marginBottom: spacing.sm },
  subtitle: {
    ...font.body,
    color: colors.driftwood,
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  form: {},
  inputGroup: { marginBottom: spacing.md, gap: 6 },
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
});
