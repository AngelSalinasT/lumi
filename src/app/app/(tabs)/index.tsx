import { Ionicons } from "@expo/vector-icons";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert as RNAlert,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown, FadeInUp, LinearTransition } from "react-native-reanimated";
import { useFocusEffect } from "expo-router";
import { Card } from "../../components/Card";
import { StatusBadge } from "../../components/StatusBadge";
import { ActivitySummary, Alert, getActivity, getAlerts, markAlertsSeen, deleteAlert, deleteAllAlerts } from "../../lib/api";
import { colors, font, radius, shadows, spacing } from "../../lib/theme";
import { formatTime, timeAgo } from "../../lib/utils";

export default function HomeScreen() {
  const [data, setData] = useState<ActivitySummary | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [unseenAlerts, setUnseenAlerts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setError("");
      const [actRes, alertRes] = await Promise.all([
        getActivity(),
        getAlerts(),
      ]);
      setData(actRes);
      setAlerts(alertRes.alerts);
      setUnseenAlerts(alertRes.unseen);
    } catch {
      setError("No se pudo conectar con Lumi");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleDismissAlerts = useCallback(async () => {
    await markAlertsSeen();
    setUnseenAlerts(0);
    setAlerts((prev) => prev.map((a) => ({ ...a, seen: true })));
  }, []);

  const handleDeleteAlert = useCallback((timestamp: string) => {
    RNAlert.alert("Eliminar alerta", "¿Eliminar esta alerta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteAlert(timestamp);
          setAlerts((prev) => prev.filter((a) => a.timestamp !== timestamp));
        },
      },
    ]);
  }, []);

  const handleDeleteAll = useCallback(() => {
    RNAlert.alert("Eliminar todas", "¿Eliminar todas las alertas?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar todas",
        style: "destructive",
        onPress: async () => {
          await deleteAllAlerts();
          setAlerts([]);
          setUnseenAlerts(0);
        },
      },
    ]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      load();
    }, [load])
  );

  const isOnline =
    data?.last_interaction &&
    Date.now() - new Date(data.last_interaction).getTime() < 3600000;

  return (
    <Animated.ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.ember} />
      }
    >
      {/* Warm gradient header area */}
      <View style={styles.headerArea}>
        <Animated.View entering={FadeIn.duration(800)} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={font.label}>LUMI FAMILY</Text>
            <Text style={[font.hero, { marginTop: 4 }]}>
              {data?.user_name ? data.user_name : "..."}
            </Text>
          </View>
          <View style={styles.botFace}>
            <View style={styles.eyeRow}>
              <View style={styles.eye} />
              <View style={styles.eye} />
            </View>
            <View style={styles.mouth} />
          </View>
        </Animated.View>
      </View>

      {error ? (
        <Card variant="rose" delay={100}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={styles.alertIcon}>
              <Ionicons name="warning" size={18} color={colors.rose} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[font.subtitle, { color: colors.rose }]}>{error}</Text>
              <Text style={font.secondary}>Verifica que el backend esté corriendo</Text>
            </View>
          </View>
        </Card>
      ) : loading && !data ? (
        <ActivityIndicator size="large" color={colors.ember} style={{ marginTop: 80 }} />
      ) : (
        <>
          {/* Status hero card */}
          <Card delay={100} style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <StatusBadge status={isOnline ? "online" : "offline"} />
              <Text style={font.caption}>{timeAgo(data?.last_interaction ?? null)}</Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: colors.peachMist }]}>
                  <Text style={[styles.statNum, { color: colors.ember }]}>
                    {data?.interactions_today ?? 0}
                  </Text>
                </View>
                <Text style={font.caption}>pláticas hoy</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: colors.sageSoft }]}>
                  <Text style={[styles.statNum, { color: colors.sage }]}>
                    {data?.medications?.length ?? 0}
                  </Text>
                </View>
                <Text style={font.caption}>medicinas</Text>
              </View>
              <View style={styles.statItem}>
                <View style={[styles.statCircle, { backgroundColor: colors.honeySoft }]}>
                  <Text style={[styles.statNum, { color: colors.gold }]}>
                    {data?.family_contacts?.length ?? 0}
                  </Text>
                </View>
                <Text style={font.caption}>familia</Text>
              </View>
            </View>
          </Card>

          {/* Emergency alerts */}
          {alerts.length > 0 && (
            <>
              <Animated.View entering={FadeInUp.delay(150).duration(400)}>
                <Text style={[font.label, { marginTop: spacing.lg, marginBottom: spacing.sm, paddingHorizontal: spacing.lg }]}>
                  {unseenAlerts > 0 ? `ALERTAS (${unseenAlerts} nuevas)` : "ALERTAS RECIENTES"}
                </Text>
              </Animated.View>
              {alerts.slice(-5).reverse().map((alert, i) => (
                <Card
                  key={alert.timestamp + i}
                  variant={alert.seen ? "default" : "rose"}
                  delay={200 + i * 60}
                  style={{ marginBottom: spacing.xs + 4, marginHorizontal: spacing.lg }}
                >
                  <View style={styles.alertRow}>
                    <View style={[styles.alertIcon, !alert.seen && { backgroundColor: colors.rose + "20" }]}>
                      <Ionicons
                        name={alert.seen ? "alert-circle-outline" : "alert-circle"}
                        size={22}
                        color={alert.seen ? colors.sandstone : colors.rose}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[font.subtitle, !alert.seen && { color: colors.rose }]}>
                        {alert.reason}
                      </Text>
                      <Text style={font.caption}>{timeAgo(alert.timestamp)}</Text>
                    </View>
                    <Pressable
                      onPress={() => handleDeleteAlert(alert.timestamp)}
                      hitSlop={12}
                      style={styles.deleteAlertBtn}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.rose} />
                    </Pressable>
                  </View>
                </Card>
              ))}
              <View style={styles.alertActions}>
                {unseenAlerts > 0 && (
                  <Pressable style={styles.dismissBtn} onPress={handleDismissAlerts}>
                    <Text style={styles.dismissText}>Marcar como vistas</Text>
                  </Pressable>
                )}
                <Pressable style={styles.dismissBtn} onPress={handleDeleteAll}>
                  <Text style={[styles.dismissText, { color: colors.rose }]}>Eliminar todas</Text>
                </Pressable>
              </View>
            </>
          )}

          {/* Medications section */}
          <Animated.View entering={FadeInUp.delay(200).duration(500)}>
            <Text style={[font.label, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
              MEDICAMENTOS DE HOY
            </Text>
          </Animated.View>

          {(data?.medications?.length ?? 0) === 0 ? (
            <Card delay={300}>
              <View style={styles.emptyRow}>
                <View style={[styles.iconBubble, { backgroundColor: colors.creamDeep }]}>
                  <Ionicons name="leaf-outline" size={22} color={colors.sandstone} />
                </View>
                <Text style={font.secondary}>Sin medicamentos configurados</Text>
              </View>
            </Card>
          ) : (
            data?.medications?.map((med, i) => (
              <Card key={i} variant="ember" delay={300 + i * 80} style={{ marginBottom: spacing.sm }}>
                <View style={styles.medRow}>
                  <View style={[styles.iconBubble, { backgroundColor: colors.peachMist }]}>
                    <Ionicons name="leaf" size={18} color={colors.ember} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={font.subtitle}>{med.name}</Text>
                    <Text style={font.secondary}>
                      {med.dose ? `${med.dose} · ` : ""}
                      {med.time ? formatTime(med.time) : "sin horario"}
                    </Text>
                  </View>
                  <View style={styles.timePill}>
                    <Text style={styles.timePillText}>
                      {med.time ? formatTime(med.time) : "—"}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}

          {/* Emergency contacts */}
          <Animated.View entering={FadeInUp.delay(400).duration(500)}>
            <Text style={[font.label, { marginTop: spacing.xl, marginBottom: spacing.md }]}>
              CONTACTOS DE EMERGENCIA
            </Text>
          </Animated.View>

          {(data?.family_contacts?.length ?? 0) === 0 ? (
            <Card delay={500}>
              <View style={styles.emptyRow}>
                <View style={[styles.iconBubble, { backgroundColor: colors.creamDeep }]}>
                  <Ionicons name="heart-outline" size={22} color={colors.sandstone} />
                </View>
                <Text style={font.secondary}>Sin contactos registrados</Text>
              </View>
            </Card>
          ) : (
            data?.family_contacts?.map((c, i) => (
              <Card key={i} delay={500 + i * 80} style={{ marginBottom: spacing.sm }}>
                <View style={styles.medRow}>
                  <View style={[styles.iconBubble, { backgroundColor: colors.honeySoft }]}>
                    <Ionicons name="heart" size={18} color={colors.gold} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={font.subtitle}>{c.name}</Text>
                    <Text style={font.secondary}>
                      {c.relation}{c.phone ? ` · ${c.phone}` : ""}
                    </Text>
                  </View>
                </View>
              </Card>
            ))
          )}

          <View style={{ height: 40 }} />
        </>
      )}
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  botFace: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  eyeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  eye: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.espresso,
  },
  mouth: {
    width: 12,
    height: 6,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
    backgroundColor: colors.ember,
  },
  statusCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    ...shadows.lifted,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  statsGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
    gap: 8,
  },
  statCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Georgia",
    fontWeight: "700",
  },
  medRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  iconBubble: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  timePill: {
    backgroundColor: colors.creamDeep,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  timePillText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.driftwood,
    letterSpacing: 0.5,
  },
  emptyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  alertRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.creamDeep,
    alignItems: "center",
    justifyContent: "center",
  },
  deleteAlertBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.roseSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  alertActions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: spacing.lg,
    marginTop: spacing.xs,
  },
  dismissBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dismissText: {
    color: colors.driftwood,
    fontSize: 13,
    fontWeight: "600",
  },
});
