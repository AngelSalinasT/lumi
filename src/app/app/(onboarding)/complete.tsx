import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useOnboarding } from "../../lib/onboarding-context";
import { activateDevice } from "../../lib/api";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

export default function CompleteScreen() {
  const { data, submit } = useOnboarding();
  const [step, setStep] = useState<"summary" | "saving" | "saved" | "activating" | "done">("summary");
  const [error, setError] = useState("");

  const handleSave = async () => {
    setStep("saving");
    setError("");
    try {
      await submit();
      setStep("saved");
    } catch {
      setError("No se pudo conectar. Verifica que el backend este corriendo.");
      setStep("summary");
    }
  };

  const handleActivate = async () => {
    setStep("activating");
    setError("");
    try {
      await activateDevice();
      setStep("done");
      // Ir al dashboard despues de un momento
      setTimeout(() => {
        router.replace("/(tabs)");
      }, 2500);
    } catch {
      setError("No se pudo activar Lumi. Intenta de nuevo.");
      setStep("saved");
    }
  };

  // --- Pantalla de Lumi activada ---
  if (step === "done") {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <Animated.View entering={ZoomIn.springify()} style={styles.activatedFace}>
          <View style={styles.face}>
            <View style={styles.eyeRow}>
              <View style={styles.eyeHappy} />
              <View style={styles.eyeHappy} />
            </View>
            <View style={styles.mouthBig} />
          </View>
        </Animated.View>
        <Animated.View entering={FadeInUp.delay(400)}>
          <Text style={[styles.title, { marginTop: spacing.xl }]}>
            Lumi esta lista!
          </Text>
          <Text style={[styles.hint, { marginTop: spacing.sm }]}>
            {data.elderlyName} ya puede empezar a platicar con Lumi.{"\n"}
            Los ojos de Lumi ya estan activos.
          </Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        {/* Progress dots */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
        </Animated.View>

        {/* Lumi face */}
        <Animated.View entering={ZoomIn.delay(300).duration(600).springify()} style={styles.faceContainer}>
          <View style={styles.face}>
            <View style={styles.eyeRow}>
              <View style={styles.eyeHappy} />
              <View style={styles.eyeHappy} />
            </View>
            <View style={styles.mouthBig} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(500)}>
          <Text style={styles.title}>
            {step === "saved"
              ? "Datos guardados!"
              : `Listo! Lumi ya conoce\na ${data.elderlyName || "tu ser querido"}`}
          </Text>
        </Animated.View>

        {/* Summary */}
        <Animated.View entering={FadeInUp.delay(700).duration(500)} style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.peachMist }]}>
              <Ionicons name="person" size={18} color={colors.ember} />
            </View>
            <Text style={font.body}>
              {data.elderlyName}
              {data.elderlyAge ? `, ${data.elderlyAge} anos` : ""}
            </Text>
          </View>

          {data.healthConditions.length > 0 && (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryIcon, { backgroundColor: colors.roseSoft }]}>
                <Ionicons name="heart-half" size={18} color={colors.rose} />
              </View>
              <Text style={font.body}>
                {data.healthConditions.length} padecimiento{data.healthConditions.length > 1 ? "s" : ""}
              </Text>
            </View>
          )}

          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.sageSoft }]}>
              <Ionicons name="leaf" size={18} color={colors.sage} />
            </View>
            <Text style={font.body}>
              {data.medications.length > 0
                ? `${data.medications.length} medicamento${data.medications.length > 1 ? "s" : ""}`
                : "Sin medicamentos"}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <View style={[styles.summaryIcon, { backgroundColor: colors.honeySoft }]}>
              <Ionicons name="people" size={18} color={colors.gold} />
            </View>
            <Text style={font.body}>
              {data.contacts.length > 0
                ? `${data.contacts.length} contacto${data.contacts.length > 1 ? "s" : ""} de emergencia`
                : "Sin contactos"}
            </Text>
          </View>
        </Animated.View>

        {step === "saved" && (
          <Animated.View entering={FadeInUp.delay(200).duration(400)}>
            <Text style={styles.activateHint}>
              Cuando estes listo, activa a Lumi para que empiece a conversar
              con {data.elderlyName || "tu ser querido"}.
            </Text>
          </Animated.View>
        )}

        {step === "summary" && (
          <Animated.View entering={FadeInUp.delay(900).duration(500)}>
            <Text style={styles.hint}>
              Primero guardaremos los datos y luego podras activar a Lumi
              cuando estes listo.
            </Text>
          </Animated.View>
        )}

        {error ? (
          <Animated.View entering={FadeIn} style={styles.errorBox}>
            <Ionicons name="warning" size={18} color={colors.rose} />
            <Text style={[font.secondary, { color: colors.rose, flex: 1 }]}>{error}</Text>
          </Animated.View>
        ) : null}
      </View>

      <Animated.View entering={FadeInDown.delay(1100).duration(500)} style={styles.bottom}>
        {step === "summary" && (
          <>
            <Pressable style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={20} color={colors.driftwood} />
              <Text style={styles.backBtnText}>Atras</Text>
            </Pressable>
            <Pressable
              style={styles.saveBtn}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>Guardar datos</Text>
            </Pressable>
          </>
        )}

        {step === "saving" && (
          <View style={[styles.saveBtn, { flex: 1, opacity: 0.7 }]}>
            <ActivityIndicator size="small" color={colors.warmWhite} />
          </View>
        )}

        {step === "saved" && (
          <Pressable
            style={styles.activateBtn}
            onPress={handleActivate}
          >
            <Ionicons name="power" size={22} color={colors.warmWhite} />
            <Text style={styles.activateBtnText}>Activar Lumi</Text>
          </Pressable>
        )}

        {step === "activating" && (
          <View style={[styles.activateBtn, { opacity: 0.7 }]}>
            <ActivityIndicator size="small" color={colors.warmWhite} />
            <Text style={styles.activateBtnText}>Activando...</Text>
          </View>
        )}
      </Animated.View>
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
  top: { flex: 1, alignItems: "center" },
  dots: {
    flexDirection: "row",
    gap: 8,
    marginBottom: spacing.xl,
  },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fog },
  dotActive: { backgroundColor: colors.ember, width: 24, borderRadius: 4 },
  faceContainer: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    ...shadows.lifted,
  },
  activatedFace: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.sageSoft,
    alignItems: "center",
    justifyContent: "center",
    ...shadows.warm,
  },
  face: { alignItems: "center", gap: 8 },
  eyeRow: { flexDirection: "row", gap: 16, marginTop: 4 },
  eyeHappy: {
    width: 12,
    height: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    backgroundColor: colors.espresso,
  },
  mouthBig: {
    width: 28,
    height: 14,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    backgroundColor: colors.ember,
  },
  title: {
    ...font.heading,
    textAlign: "center",
    marginBottom: spacing.lg,
  },
  summaryCard: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.md,
    padding: spacing.lg,
    width: "100%",
    gap: 14,
    ...shadows.soft,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  hint: {
    ...font.secondary,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.md,
    lineHeight: 22,
  },
  activateHint: {
    ...font.body,
    textAlign: "center",
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
    lineHeight: 24,
    color: colors.walnut,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.roseSoft,
    padding: spacing.md,
    borderRadius: radius.sm,
    marginTop: spacing.md,
    width: "100%",
  },
  bottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md,
    paddingBottom: 50,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 18,
    paddingHorizontal: spacing.md,
  },
  backBtnText: { color: colors.driftwood, fontSize: 15, fontWeight: "700" },
  saveBtn: {
    flex: 1,
    backgroundColor: colors.ember,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    ...shadows.warm,
  },
  saveBtnText: {
    color: colors.warmWhite,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  activateBtn: {
    flex: 1,
    backgroundColor: colors.sage,
    paddingVertical: 18,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    ...shadows.warm,
  },
  activateBtnText: {
    color: colors.warmWhite,
    fontSize: 17,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
});
