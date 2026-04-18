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

export default function ContactsScreen() {
  const { data, addContact, removeContact } = useOnboarding();
  const [name, setName] = useState("");
  const [relation, setRelation] = useState("");
  const [phone, setPhone] = useState("");
  const [showForm, setShowForm] = useState(data.contacts.length === 0);

  const handleAdd = () => {
    if (!name.trim() || !relation.trim()) return;
    addContact({ name: name.trim(), relation: relation.trim(), phone: phone.trim() });
    setName("");
    setRelation("");
    setPhone("");
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
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View style={styles.iconCircle}>
            <Ionicons name="people" size={32} color={colors.ember} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text style={styles.title}>Contactos de emergencia</Text>
          <Text style={styles.subtitle}>
            Lumi avisara a estas personas si detecta una caida o emergencia.
          </Text>
        </Animated.View>

        {/* List of added contacts */}
        {data.contacts.map((contact, i) => (
          <Animated.View key={i} entering={SlideInDown.delay(i * 60).springify().damping(18)}>
            <View style={styles.contactCard}>
              <View style={styles.contactOrb}>
                <Text style={styles.contactInitial}>
                  {contact.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={font.subtitle}>{contact.name}</Text>
                <Text style={font.secondary}>
                  {contact.relation}
                  {contact.phone ? ` · ${contact.phone}` : ""}
                </Text>
              </View>
              <Pressable onPress={() => removeContact(i)} hitSlop={12} style={styles.removeBtn}>
                <Ionicons name="close" size={16} color={colors.rose} />
              </Pressable>
            </View>
          </Animated.View>
        ))}

        {/* Add form */}
        {showForm ? (
          <Animated.View entering={SlideInDown.springify().damping(18)}>
            <View style={styles.formCard}>
              <Text style={[font.title, { marginBottom: spacing.md }]}>Nuevo contacto</Text>
              <View style={styles.inputGroup}>
                <Text style={font.label}>NOMBRE</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Maria, Carlos..."
                  placeholderTextColor={colors.fog}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={font.label}>RELACION</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Hija, nieto, vecina..."
                  placeholderTextColor={colors.fog}
                  value={relation}
                  onChangeText={setRelation}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={font.label}>TELEFONO (OPCIONAL)</Text>
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
                {data.contacts.length > 0 && (
                  <Pressable style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                    <Text style={{ color: colors.driftwood, fontWeight: "700" }}>Cancelar</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.saveBtn, (!name.trim() || !relation.trim()) && { opacity: 0.4 }]}
                  onPress={handleAdd}
                  disabled={!name.trim() || !relation.trim()}
                >
                  <Text style={styles.saveBtnText}>Agregar</Text>
                </Pressable>
              </View>
            </View>
          </Animated.View>
        ) : (
          <Pressable style={styles.addBtn} onPress={() => setShowForm(true)}>
            <View style={styles.addBtnIcon}>
              <Ionicons name="person-add" size={18} color={colors.warmWhite} />
            </View>
            <Text style={styles.addBtnText}>Agregar otro contacto</Text>
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
            onPress={() => router.push("/(onboarding)/complete")}
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
    backgroundColor: colors.honeySoft,
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
  contactCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.warmWhite,
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    ...shadows.soft,
  },
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
});
