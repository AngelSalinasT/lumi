import { useEffect, useState } from "react";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { colors } from "../lib/theme";
import { isOnboardingComplete, setOnboardingComplete } from "../lib/storage";
import { getProfile } from "../lib/api";
import { useAlertPoller } from "../lib/alert-poller";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Polling de alertas cada 10s
  useAlertPoller();

  useEffect(() => {
    (async () => {
      const localDone = await isOnboardingComplete();
      if (localDone) {
        setNeedsOnboarding(false);
      } else {
        try {
          const profile = await getProfile();
          if (profile.name && profile.name !== "amigo") {
            await setOnboardingComplete();
            setNeedsOnboarding(false);
          } else {
            setNeedsOnboarding(true);
          }
        } catch {
          setNeedsOnboarding(true);
        }
      }
      setReady(true);
    })();
  }, []);

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.cream, alignItems: "center", justifyContent: "center" }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.ember} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
        }}
      >
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
      </Stack>
      {!needsOnboarding && <Redirect href="/(tabs)" />}
    </>
  );
}
