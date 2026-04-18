import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import { useOnboarding } from "../../lib/onboarding-context";
import { getBackendIp, setBackendIp, testConnection } from "../../lib/api";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

export default function WifiScreen() {
  const { data, updateData } = useOnboarding();
  const [ssid, setSsid] = useState(data.wifiSSID);
  const [password, setPassword] = useState(data.wifiPassword);
  const [showPassword, setShowPassword] = useState(false);
  const [backendIp, setIp] = useState("");
  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    setIp(getBackendIp());
  }, []);

  const handleTest = async () => {
    setTesting(true);
    setConnected(null);
    const ok = await testConnection(backendIp);
    setConnected(ok);
    if (ok) {
      await setBackendIp(backendIp);
    }
    setTesting(false);
  };

  const handleNext = async () => {
    updateData({ wifiSSID: ssid, wifiPassword: password });
    if (backendIp) {
      await setBackendIp(backendIp);
    }
    router.push("/(onboarding)/profile");
  };

  return (
    <View style={styles.container}>
      <View style={styles.top}>
        {/* Progress dots */}
        <Animated.View entering={FadeIn.delay(100)} style={styles.dots}>
          <View style={styles.dot} />
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(500)}>
          <View style={styles.iconCircle}>
            <Ionicons name="wifi" size={32} color={colors.ember} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(500)}>
          <Text style={styles.title}>Conexion</Text>
          <Text style={styles.subtitle}>
            Ingresa la IP de la computadora donde corre el backend de Lumi.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.form}>
          {/* Backend IP - lo mas importante */}
          <View style={styles.inputGroup}>
            <Text style={font.label}>IP DEL BACKEND</Text>
            <View style={styles.ipRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="172.20.10.3"
                placeholderTextColor={colors.fog}
                value={backendIp}
                onChangeText={(v) => { setIp(v); setConnected(null); }}
                keyboardType="numbers-and-punctuation"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={[styles.testBtn, connected === true && styles.testBtnOk, connected === false && styles.testBtnFail]}
                onPress={handleTest}
                disabled={testing || !backendIp.trim()}
              >
                {testing ? (
                  <ActivityIndicator size="small" color={colors.warmWhite} />
                ) : connected === true ? (
                  <Ionicons name="checkmark" size={22} color={colors.warmWhite} />
                ) : connected === false ? (
                  <Ionicons name="close" size={22} color={colors.warmWhite} />
                ) : (
                  <Text style={styles.testBtnText}>Probar</Text>
                )}
              </Pressable>
            </View>
            {connected === true && (
              <Text style={[font.caption, { color: colors.sage, marginTop: 4 }]}>
                Conectado al backend
              </Text>
            )}
            {connected === false && (
              <Text style={[font.caption, { color: colors.rose, marginTop: 4 }]}>
                No se pudo conectar. Verifica la IP y que el backend este corriendo.
              </Text>
            )}
          </View>

          {/* WiFi info (opcional) */}
          <View style={styles.inputGroup}>
            <Text style={font.label}>RED WIFI (OPCIONAL)</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre de la red"
              placeholderTextColor={colors.fog}
              value={ssid}
              onChangeText={setSsid}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={font.label}>CONTRASENA WIFI (OPCIONAL)</Text>
            <View style={styles.passwordRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Contrasena de la red"
                placeholderTextColor={colors.fog}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Pressable
                style={styles.eyeBtn}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={20}
                  color={colors.driftwood}
                />
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={styles.bottom}>
        <View style={styles.buttonRow}>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.driftwood} />
            <Text style={styles.backBtnText}>Atras</Text>
          </Pressable>
          <Pressable style={styles.primaryBtn} onPress={handleNext}>
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
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.peachMist,
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
    paddingHorizontal: spacing.md,
  },
  form: { gap: 0 },
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
  ipRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  testBtn: {
    height: 48,
    paddingHorizontal: 16,
    borderRadius: radius.sm,
    backgroundColor: colors.ember,
    alignItems: "center",
    justifyContent: "center",
  },
  testBtnOk: { backgroundColor: colors.sage },
  testBtnFail: { backgroundColor: colors.rose },
  testBtnText: { color: colors.warmWhite, fontWeight: "700", fontSize: 14 },
  passwordRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  eyeBtn: {
    width: 44,
    height: 48,
    borderRadius: radius.sm,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
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
