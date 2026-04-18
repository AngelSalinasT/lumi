import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp } from "react-native-reanimated";
import { router } from "expo-router";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";

export default function WelcomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.top}>
        <Animated.View entering={FadeIn.delay(200)} style={styles.dots}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(400).duration(800)} style={styles.faceContainer}>
          <View style={styles.face}>
            <View style={styles.eyeRow}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.mouth} />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(600).duration(600)}>
          <Text style={styles.title}>Hola, bienvenido a{"\n"}Lumi Family</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(800).duration(600)}>
          <Text style={styles.subtitle}>
            Vamos a configurar a Lumi para tu ser querido. Solo toma unos minutos y
            todo quedara listo para que Lumi lo acompane.
          </Text>
        </Animated.View>
      </View>

      <Animated.View entering={FadeInDown.delay(1000).duration(500)} style={styles.bottom}>
        <Pressable
          style={styles.primaryBtn}
          onPress={() => router.push("/(onboarding)/wifi")}
        >
          <Text style={styles.primaryBtnText}>Comenzar</Text>
        </Pressable>
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
    marginBottom: spacing.xxl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fog,
  },
  dotActive: {
    backgroundColor: colors.ember,
    width: 24,
    borderRadius: 4,
  },
  faceContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    ...shadows.lifted,
  },
  face: { alignItems: "center", gap: 10 },
  eyeRow: { flexDirection: "row", gap: 18, marginTop: 4 },
  eye: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.espresso,
  },
  mouth: {
    width: 22,
    height: 11,
    borderBottomLeftRadius: 11,
    borderBottomRightRadius: 11,
    backgroundColor: colors.ember,
  },
  title: {
    ...font.hero,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  subtitle: {
    ...font.body,
    textAlign: "center",
    color: colors.driftwood,
    paddingHorizontal: spacing.lg,
    lineHeight: 24,
  },
  bottom: {
    paddingBottom: 50,
  },
  primaryBtn: {
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
