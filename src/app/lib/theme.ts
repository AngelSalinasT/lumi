/**
 * Lumi Family — "Ember Hearth" Design System
 * Warm terracotta, amber gold, deep espresso.
 * The warm glow of a fireplace at dusk.
 */

export const colors = {
  // Core palette — terracotta warmth
  ember: "#C2694F",
  emberLight: "#D4896F",
  emberDark: "#A04E35",
  amber: "#E8A87C",
  amberSoft: "#F2C9A8",
  gold: "#D4A853",

  // Backgrounds — layered warm cream
  cream: "#FBF7F4",
  creamDeep: "#F5EDE6",
  warmWhite: "#FFFCFA",
  peachMist: "#FFF3EC",

  // Text — espresso tones
  espresso: "#2C1810",
  walnut: "#5C3D2E",
  driftwood: "#8B7355",
  sandstone: "#B8A08A",
  fog: "#D4C5B5",

  // Semantic
  sage: "#7A9E7E",
  sageSoft: "#E8F0E8",
  rose: "#D4736C",
  roseSoft: "#FAEAE8",
  sky: "#6B9EC2",
  skySoft: "#E8F0F7",
  honey: "#D4A853",
  honeySoft: "#FBF3E0",

  // Status
  online: "#7A9E7E",
  offline: "#B8A08A",
  alert: "#D4736C",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 12,
  md: 16,
  lg: 22,
  xl: 28,
  full: 999,
} as const;

export const shadows = {
  soft: {
    shadowColor: "#8B7355",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  warm: {
    shadowColor: "#C2694F",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 5,
  },
  lifted: {
    shadowColor: "#2C1810",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 4,
  },
} as const;

export const font = {
  // Georgia serif for headings — human, warm, literary
  hero: { fontSize: 34, fontFamily: "Georgia", fontWeight: "700" as const, color: colors.espresso, letterSpacing: -0.5 },
  heading: { fontSize: 26, fontFamily: "Georgia", fontWeight: "700" as const, color: colors.espresso, letterSpacing: -0.3 },
  title: { fontSize: 20, fontFamily: "Georgia", fontWeight: "600" as const, color: colors.espresso },
  subtitle: { fontSize: 16, fontWeight: "700" as const, color: colors.walnut },
  body: { fontSize: 15, color: colors.walnut, lineHeight: 22 },
  secondary: { fontSize: 14, color: colors.driftwood, lineHeight: 20 },
  caption: { fontSize: 12, color: colors.sandstone, letterSpacing: 0.3 },
  label: { fontSize: 11, fontWeight: "700" as const, color: colors.driftwood, letterSpacing: 1.2, textTransform: "uppercase" as const },
} as const;
