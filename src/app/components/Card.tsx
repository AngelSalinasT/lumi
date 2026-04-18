import { StyleSheet, View, ViewProps } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { colors, radius, shadows, spacing } from "../lib/theme";

interface CardProps extends ViewProps {
  variant?: "default" | "ember" | "sage" | "rose" | "honey";
  delay?: number;
  noAnimation?: boolean;
}

export function Card({
  variant = "default",
  delay = 0,
  noAnimation = false,
  style,
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: {},
    ember: { borderLeftWidth: 3, borderLeftColor: colors.ember },
    sage: { borderLeftWidth: 3, borderLeftColor: colors.sage },
    rose: { borderLeftWidth: 3, borderLeftColor: colors.rose },
    honey: { borderLeftWidth: 3, borderLeftColor: colors.honey },
  };

  const Wrapper = noAnimation ? View : Animated.View;
  const animProps = noAnimation
    ? {}
    : { entering: FadeInUp.delay(delay).duration(500).springify().damping(18) };

  return (
    <Wrapper style={[styles.card, variantStyles[variant], style]} {...animProps} {...props}>
      {children}
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.warmWhite,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadows.soft,
  },
});
