import { Stack } from "expo-router";
import { OnboardingProvider } from "../../lib/onboarding-context";
import { colors } from "../../lib/theme";

export default function OnboardingLayout() {
  return (
    <OnboardingProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: "slide_from_right",
        }}
      />
    </OnboardingProvider>
  );
}
