import { useEffect, useRef } from "react";
import { Alert, AppState } from "react-native";
import { getAlerts } from "./api";

const POLL_INTERVAL = 10_000; // 10 segundos

export function useAlertPoller() {
  const lastSeenCount = useRef(0);
  const shownAlertIds = useRef(new Set<string>());

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    const poll = async () => {
      // Solo pollear si la app está activa
      if (AppState.currentState !== "active") return;

      try {
        const res = await getAlerts();
        if (res.unseen > lastSeenCount.current) {
          // Hay alertas nuevas
          const newAlerts = res.alerts
            .filter((a) => !a.seen)
            .filter((a) => !shownAlertIds.current.has(a.timestamp));

          for (const alert of newAlerts) {
            shownAlertIds.current.add(alert.timestamp);
            Alert.alert(
              `Alerta — ${alert.user_name}`,
              alert.reason,
              [{ text: "OK" }]
            );
          }
        }
        lastSeenCount.current = res.unseen;
      } catch {
        // Backend no disponible, ignorar
      }
    };

    // Primera consulta inmediata
    poll();
    interval = setInterval(poll, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, []);
}
