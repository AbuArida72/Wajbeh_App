/**
 * Wajbeh design system — Modern Solid
 */
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

// ─── Arabic font (El Messiri) ─────────────────────────────────────────────────
export const ARABIC_FONTS = {
  regular:  "ElMessiri_400Regular",
  medium:   "ElMessiri_500Medium",
  semiBold: "ElMessiri_600SemiBold",
  bold:     "ElMessiri_700Bold",
};
export const ar = (isRTL, weight = "regular") =>
  isRTL ? { fontFamily: ARABIC_FONTS[weight] } : {};

// ─── English font (DM Sans) ───────────────────────────────────────────────────
export const FONTS = {
  regular:  "DMSans_400Regular",
  medium:   "DMSans_500Medium",
  semiBold: "DMSans_600SemiBold",
  bold:     "DMSans_700Bold",
};
export const dm = (weight = "regular") => ({ fontFamily: FONTS[weight] });

// ─── Design tokens ────────────────────────────────────────────────────────────
export const T = {
  ink:         "#1C1917",   // stone-900
  mute:        "#78716C",   // stone-500
  muteStrong:  "#A8A29E",   // stone-400

  // Green — primary actions & CTAs only
  green:       "#15803D",   // buttons, active states, links
  greenBright: "#22C55E",   // success indicators, confirmed badges
  greenLight:  "#DCFCE7",   // tint backgrounds only

  // Amber — pricing, pickup times, secondary warnings
  accent:      "#B45309",
  accentLight: "#FEF3C7",

  // Red — errors and destructive actions only
  urgent:      "#DC2626",
  urgentLight: "#FEE2E2",

  bg:          "#FAF7F4",   // warm cream base
  surface2:    "#F2EDE8",   // second surface tier for nested cards
  surface:     "#FFFFFF",
  border:      "#EDE7DF",   // warm stone border
};

// Backward compat — kept so any remaining import won't break
export const WALLPAPER = {
  colors: [T.bg, T.bg, T.bg],
  start:  { x: 0, y: 0 },
  end:    { x: 1, y: 1 },
};

// ─── Background ───────────────────────────────────────────────────────────────
export function WallpaperBackground() {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: T.bg }]}
    />
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function GlassPanel({ children, style, radius = 16, padding = 0 }) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: T.surface,
          borderWidth: 1,
          borderColor: T.border,
          shadowColor: "#64748B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.14,
          shadowRadius: 8,
          elevation: 3,
        },
        style,
      ]}
    >
      <View style={padding ? { padding } : undefined}>
        {children}
      </View>
    </View>
  );
}

// ─── TextBackdrop → same as GlassPanel ───────────────────────────────────────
export function TextBackdrop({ children, style, padding = 14, radius = 14 }) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          backgroundColor: T.surface,
          borderWidth: 1,
          borderColor: T.border,
          shadowColor: "#64748B",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.14,
          shadowRadius: 8,
          elevation: 3,
        },
        style,
      ]}
    >
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

// ─── Chip — filter pill ───────────────────────────────────────────────────────
export function Chip({ children, active = false, onPress, style }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        {
          borderRadius: 100,
          borderWidth: 1,
          backgroundColor: active ? T.green : T.surface,
          borderColor:     active ? T.green : T.border,
        },
        style,
      ]}
    >
      <View style={{ paddingHorizontal: 14, paddingVertical: 7 }}>
        <Text style={{ fontSize: 12, fontWeight: "600", color: active ? "#fff" : T.ink, fontFamily: FONTS.semiBold }}>
          {children}
        </Text>
      </View>
    </Wrapper>
  );
}

// ─── GlassButton ─────────────────────────────────────────────────────────────
export function GlassButton({ children, primary = false, danger = false, accent = false, onPress, disabled, loading, style }) {
  if (primary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[
          {
            backgroundColor: disabled ? "#86EFAC" : T.green,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: T.green,
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: disabled ? 0 : 0.25,
            shadowRadius: 10,
            elevation: disabled ? 0 : 4,
          },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2, fontFamily: FONTS.bold }}>{children}</Text>
        }
      </TouchableOpacity>
    );
  }
  if (accent) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.85}
        style={[
          {
            backgroundColor: disabled ? "#FDE68A" : T.accent,
            borderRadius: 14,
            paddingVertical: 16,
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, fontFamily: FONTS.bold }}>{children}</Text>
        }
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[
        {
          borderRadius: 14,
          paddingVertical: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: T.surface,
          borderWidth: 1,
          borderColor: danger ? T.urgent : T.border,
          opacity: disabled ? 0.50 : 1,
        },
        style,
      ]}
    >
      {loading
        ? <ActivityIndicator color={danger ? T.urgent : T.ink} />
        : <Text style={{ color: danger ? T.urgent : T.ink, fontWeight: "600", fontSize: 15, fontFamily: FONTS.semiBold }}>{children}</Text>
      }
    </TouchableOpacity>
  );
}

// ─── SkeletonBox ──────────────────────────────────────────────────────────────
export function SkeletonBox({ width, height, radius = 8, style }) {
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.9, duration: 750, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: T.border,
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

// ─── InlineError ─────────────────────────────────────────────────────────────
export function InlineError({ message, onDismiss, style }) {
  if (!message) return null;
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: T.urgentLight,
          borderWidth: 1,
          borderColor: "rgba(220,38,38,0.20)",
          borderRadius: 12,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 12,
        },
        style,
      ]}
    >
      <Ionicons name="warning-outline" size={16} color={T.urgent} />
      <Text style={{ flex: 1, fontSize: 13, color: T.urgent, lineHeight: 18 }}>{message}</Text>
      {onDismiss && (
        <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close" size={14} color={T.urgent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Bloom — backward compat stub ────────────────────────────────────────────
export function Bloom() { return null; }
