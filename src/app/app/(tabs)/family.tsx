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
import Animated, { FadeIn, FadeInUp, SlideInDown, FadeOut } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { Card } from "../../components/Card";
import { addFamilyContact, FamilyContact, getProfile, UserProfile } from "../../lib/api";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

export default function FamilyScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await getProfile();
      setProfile(res);
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
    if (!name.trim() || !relation.trim()) return;
    setSaving(true);
    try {
      await addFamilyContact({ name: name.trim(), relation: relation.trim(), phone: phone.trim() });
      setName("");
      setRelation("");
      setPhone("");
      setShowForm(false);
      await load();
    } catch {
      Alert.alert("Error", "No se pudo guardar el contacto");
    } finally {
      setSaving(false);
    }
  };

  const contacts = profile?.family_contacts ?? [];

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ember} />
      }
    >
      {/* Header */}
      <View style={styles.headerArea}>
        <Animated.View entering={FadeIn.duration(600)}>
          <Text style={font.label}>RED DE APOYO</Text>
          <Text style={[font.hero, { marginTop: 4 }]}>Familia</Text>
          <Text style={[font.secondary, { marginTop: 6 }]}>
            Lumi notifica a estos contactos en emergencias
          </Text>
        </Animated.View>
      </View>

      {loading && !profile ? (
        <ActivityIndicator size="large" color={colors.ember} style={{ marginTop: 60 }} />
      ) : (
        <View style={{ paddingHorizontal: spacing.lg }}>
          {/* Profile card */}
          <Card delay={100} style={styles.profileCard}>
            <View style={styles.profileRow}>
              <View style={styles.profileOrb}>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.espresso }} />
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.espresso }} />
                </View>
                <View style={{ width: 14, height: 7, borderBottomLeftRadius: 7, borderBottomRightRadius: 7, backgroundColor: colors.ember, marginTop: 4 }} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={font.heading}>{profile?.name ?? "Sin nombre"}</Text>
                <Text style={font.secondary}>
                  {profile?.age ? `${profile.age} años · ` : ""}Dispositivo conectado
                </Text>
              </View>
            </View>
          </Card>

          {/* Contacts */}
          <Animated.View entering={FadeInUp.delay(200)}>
            <Text style={[font.label, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
              CONTACTOS DE EMERGENCIA
            </Text>
          </Animated.View>

          {contacts.length === 0 && (
            <Card delay={300}>
              <View style={styles.emptyState}>
                <View style={styles.emptyOrb}>
                  <Ionicons name="heart-outline" size={32} color={colors.amberSoft} />
                </View>
                <Text style={[font.title, { marginTop: spacing.md, textAlign: "center" }]}>
                  Sin contactos
                </Text>
                <Text style={[font.secondary, { textAlign: "center", marginTop: 4 }]}>
                  Agrega familiares para que reciban{"\n"}alertas y recordatorios
                </Text>
              </View>
            </Card>
          )}

          {contacts.map((c, i) => (
            <Card key={i} delay={300 + i * 80} style={{ marginBottom: spacing.sm }}>
              <View style={styles.contactRow}>
                <View style={styles.contactOrb}>
                  <Text style={styles.contactInitial}>
                    {c.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={font.subtitle}>{c.name}</Text>
                  <Text style={font.secondary}>{c.relation}</Text>
                  {c.phone ? (
                    <View style={styles.phoneRow}>
                      <Ionicons name="call-outline" size={12} color={colors.sandstone} />
                      <Text style={font.caption}>{c.phone}</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.notifBadge}>
                  <Ionicons name="notifications" size={16} color={colors.ember} />
                </View>
              </View>
            </Card>
          ))}

          {/* Add form */}
          {showForm ? (
            <Animated.View entering={SlideInDown.springify().damping(18)} exiting={FadeOut.duration(200)}>
              <Card noAnimation style={styles.formCard}>
                <Text style={[font.title, { marginBottom: spacing.md }]}>Nuevo contacto</Text>
                <View style={styles.inputGroup}>
                  <Text style={font.label}>NOMBRE</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="María, Carlos..."
                    placeholderTextColor={colors.fog}
                    value={name}
                    onChangeText={setName}
                    autoFocus
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={font.label}>RELACIÓN</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Hija, nieto, vecina..."
                    placeholderTextColor={colors.fog}
                    value={relation}
                    onChangeText={setRelation}
                  />
                </View>
                <View style={styles.inputGroup}>
                  <Text style={font.label}>TELÉFONO (OPCIONAL)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+52 442 123 4567"
                    placeholderTextColor={colors.fog}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.formActions}>
                  <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                    <Text style={{ color: colors.driftwood, fontWeight: "700" }}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.saveBtn, (!name.trim() || !relation.trim()) && { opacity: 0.4 }]}
                    onPress={handleAdd}
                    disabled={!name.trim() || !relation.trim() || saving}
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
            <Animated.View entering={FadeInUp.delay(contacts.length * 80 + 400).duration(400)}>
              <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
                <View style={styles.addBtnIcon}>
                  <Ionicons name="person-add" size={18} color={colors.warmWhite} />
                </View>
                <Text style={styles.addBtnText}>Agregar contacto</Text>
              </Pressable>
            </Animated.View>
          )}
        </View>
      )}

      <View style={{ height: 40 }} />
    </Animated.ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.cream },
  content: { paddingBottom: 20 },
  headerArea: {
    paddingHorizontal: spacing.lg,
    paddingTop: 64,
    paddingBottom: spacing.lg,
  },
  profileCard: { ...shadows.lifted },
  profileRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
  profileOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  contactOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.peachMist,
    alignItems: "center",
    justifyContent: "center",
  },
  contactInitial: {
    fontSize: 18,
    fontFamily: "Georgia",
    fontWeight: "700",
    color: colors.ember,
  },
  phoneRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  notifBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.peachMist,
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
