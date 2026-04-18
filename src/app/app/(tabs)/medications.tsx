import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInUp, FadeIn, SlideInDown, FadeOut, LinearTransition } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { Card } from "../../components/Card";
import {
  addMedication,
  getMedications,
  Medication,
  removeMedication,
} from "../../lib/api";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";
import { formatTime } from "../../lib/utils";

export default function MedicationsScreen() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [time, setTime] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getMedications();
      setMeds(res.medications);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const handleAdd = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await addMedication({ name: name.trim(), dose: dose.trim(), time: time.trim() });
      setName("");
      setDose("");
      setTime("");
      setShowForm(false);
      await load();
    } catch {
      Alert.alert("Error", "No se pudo guardar el medicamento");
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = (medName: string) => {
    Alert.alert("Eliminar", `¿Eliminar ${medName}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await removeMedication(medName);
          await load();
        },
      },
    ]);
  };

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ember} />
      }
    >
      <View style={styles.headerArea}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={font.label}>CUIDADO DIARIO</Text>
          <Text style={[font.hero, { marginTop: 4 }]}>Medicamentos</Text>
          <Text style={[font.secondary, { marginTop: 6 }]}>
            Lumi recordará cada medicina a la hora indicada
          </Text>
        </Animated.View>
      </View>

      {loading && meds.length === 0 ? (
        <ActivityIndicator size="large" color={colors.ember} style={{ marginTop: 60 }} />
      ) : (
        <View style={{ paddingHorizontal: spacing.lg }}>
          {meds.map((med, i) => (
            <Card key={med.name} variant="ember" delay={100 + i * 80} style={{ marginBottom: spacing.sm }}>
              <View style={styles.medRow}>
                <View style={styles.medIcon}>
                  <Ionicons name="leaf" size={20} color={colors.ember} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={font.subtitle}>{med.name}</Text>
                  <Text style={font.secondary}>
                    {med.dose ? `${med.dose} · ` : ""}
                    {med.time ? formatTime(med.time) : "sin horario"}
                  </Text>
                </View>
                <Pressable onPress={() => handleRemove(med.name)} hitSlop={12} style={styles.removeBtn}>
                  <Ionicons name="close" size={16} color={colors.rose} />
                </Pressable>
              </View>
            </Card>
          ))}

          {meds.length === 0 && (
            <Card delay={100}>
              <View style={styles.emptyState}>
                <View style={styles.emptyOrb}>
                  <Ionicons name="leaf-outline" size={32} color={colors.amberSoft} />
                </View>
                <Text style={[font.title, { marginTop: spacing.md, textAlign: "center" }]}>
                  Sin medicamentos
                </Text>
                <Text style={[font.secondary, { textAlign: "center", marginTop: 4 }]}>
                  Agrega medicamentos y Lumi se encargará{"\n"}de recordarlos con cariño
                </Text>
              </View>
            </Card>
          )}

          {/* Add form */}
          {showForm ? (
            <Animated.View entering={SlideInDown.springify().damping(18)} exiting={FadeOut.duration(200)}>
              <Card noAnimation style={styles.formCard}>
                <Text style={[font.title, { marginBottom: spacing.md }]}>Nuevo medicamento</Text>
                <View style={styles.inputGroup}>
                  <Text style={font.label}>NOMBRE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Metformina, Losartán..."
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
                    disabled={!name.trim() || saving}
                  >
                    {saving ? (
                      <ActivityIndicator size="small" color={colors.warmWhite} />
                    ) : (
                      <Text style={styles.saveBtnText}>Guardar</Text>
                    )}
                  </Pressable>
                </View>
              </Card>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInUp.delay(meds.length * 80 + 200).duration(400)}>
              <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
                <View style={styles.addBtnIcon}>
                  <Ionicons name="add" size={22} color={colors.warmWhite} />
                </View>
                <Text style={styles.addBtnText}>Agregar medicamento</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      )}
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingBottom: 40 },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  medRow: { flexDirection: "row", alignItems: "center", gap: 14 },
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
  emptyState: { alignItems: "center", paddingVertical: spacing.xxl },
  emptyOrb: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  formCard: {
    marginTop: spacing.md,
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
    marginTop: spacing.lg,
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
});
