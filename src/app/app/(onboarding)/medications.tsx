import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp, SlideInDown } from "react-native-reanimated";
import { router } from "expo-router";
import { useOnboarding } from "../../lib/onboarding-context";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

export default function MedicationsScreen() {
  const { data, addMedication, removeMedication } = useOnboarding();
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("");
  const [showForm, setShowForm] = useState(data.medications.length === 0);

  const handleAdd = () => {
    if (!name.trim()) return;
    addMedication({ name: name.trim(), dose: dose.trim(), time: time.trim() });
    setName("");
    setDose("");
    setTime("");
    setShowForm(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.top} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress dots */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.dots}>
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View style={styles.iconCircle}>
            <Ionicons name="leaf" size={32} color={colors.ember} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text style={styles.title}>Medicamentos</Text>
          <Text style={styles.subtitle}>
            Lumi recordara cada medicina a la hora indicada con mucho carino.
          </Text>
        </Animated.View>

        {/* List of added medications */}
        {data.medications.map((med, i) => (
          <Animated.View key={i} entering={SlideInDown.delay(i * 60).springify().damping(18)}>
            <View style={styles.medCard}>
              <View style={styles.medIcon}>
                <Ionicons name="leaf" size={20} color={colors.ember} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={font.subtitle}>{med.name}</Text>
                <Text style={font.secondary}>
                  {med.dose ? `${med.dose} · ` : ""}
                  {med.time || "sin horario"}
                </Text>
              </View>
              <Pressable onPress={() => removeMedication(i)} hitSlop={12} style={styles.removeBtn}>
                <Ionicons name="close" size={16} color={colors.rose} />
              </Pressable>
            </View>
          </Animated.View>
        ))}

        {/* Add form */}
        {showForm ? (
          <Animated.View entering={SlideInDown.springify().damping(18)}>
            <View style={styles.formCard}>
              <Text style={[font.title, { marginBottom: spacing.md }]}>Agregar medicamento</Text>
              <View style={styles.inputGroup}>
                <Text style={font.label}>NOMBRE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Metformina, Losartan..."
                  placeholderTextColor={colors.fog}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>
              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={font.label}>DOSIS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500mg"
                    placeholderTextColor={colors.fog}
                    value={dose}
                    onChangeText={setDose}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={font.label}>HORA</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="08:00"
                    placeholderTextColor={colors.fog}
                    value={time}
                    onChangeText={setTime}
                    keyboardType="numbers-and-punctuation"
                  />
                </View>
              </View>
              <View style={styles.formActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                  <Text style={{ color: colors.driftwood, fontWeight: "700" }}>Cancelar</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, !name.trim() && { opacity: 0.4 }]}
                  onPress={handleAdd}
                  disabled={!name.trim()}
                >
                  <Text style={styles.saveBtnText}>Agregar</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
            <View style={styles.addBtnIcon}>
              <Ionicons name="add" size={22} color={colors.warmWhite} />
            </View>
            <Text style={styles.addBtnText}>Agregar otro medicamento</Text>
          </Pressable>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <View style={styles.buttonRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.driftwood} />
            <Text style={styles.backBtnText}>Atras</Text>
          </Pressable>
          <Pressable
            style={styles.primaryBtn}
            onPress={() => router.push("/(onboarding)/contacts")}
          >
            <Text style={styles.primaryBtnText}>Siguiente</Text>
          </Pressable>
        </View>
        {data.medications.length === 0 && (
          <Pressable
            style={styles.skipBtn}
            onPress={() => router.push("/(onboarding)/contacts")}
          >
            <Text style={styles.skipText}>No toma medicamentos</Text>
          </Pressable>
        )}
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
    backgroundColor: colors.sageSoft,
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
  medCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.ember,
    ...shadows.soft,
  },
  medIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.peachMist,
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.roseSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    backgroundColor: colors.warmWhite,
    padding: spacing.lg,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    borderWidth: 2,
    borderColor: colors.amberSoft,
    ...shadows.warm,
  },
  inputGroup: { marginBottom: spacing.md, gap: 6 },
  inputRow: { flexDirection: "row", gap: spacing.md },
  input: {
    borderWidth: 1.5,
    borderColor: colors.creamDeep,
    borderRadius: radius.sm,
    padding: 14,
    fontSize: 16,
    color: colors.espresso,
    backgroundColor: colors.cream,
    fontWeight: "500",
  },
  formActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 12,
    borderRadius: radius.sm,
  },
  saveBtn: {
    backgroundColor: colors.ember,
    paddingHorizontal: spacing.xl,
    paddingVertical: 12,
    borderRadius: radius.sm,
    ...shadows.warm,
  },
  saveBtnText: { color: colors.warmWhite, fontWeight: "800", fontSize: 15 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.creamDeep,
    marginTop: spacing.md,
  },
  addBtnIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.ember,
    alignItems: "center",
    justifyContent: "center",
  },
  addBtnText: { color: colors.walnut, fontWeight: "700", fontSize: 15 },
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
