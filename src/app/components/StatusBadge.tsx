import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { colors, radius, spacing } from "../lib/theme";

type Status = "online" | "offline" | "alert";

const statusConfig: Record<Status, { color: string; label: string; bg: string }> = {
  online: { color: colors.sage, label: "Activo", bg: colors.sageSoft },
  offline: { color: colors.sandstone, label: "Sin conexión", bg: colors.creamDeep },
  alert: { color: colors.rose, label: "Alerta", bg: colors.roseSoft },
};

export function StatusBadge({ status }: { status: Status }) {
  const cfg = statusConfig[status];
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (status === "online") {
      pulse.value = withRepeat(withTiming(0.4, { duration: 1500 }), -1, true);
    }
  }, [status, pulse]);

  const dotAnim = useAnimatedStyle(() => ({
    opacity: status === "online" ? pulse.value : 1,
    transform: [{ scale: status === "online" ? 1 + (1 - pulse.value) * 0.3 : 1 }],
  }));

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Animated.View style={[styles.dot, { backgroundColor: cfg.color }, dotAnim]} />
      <Text style={[styles.text, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: radius.full,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
