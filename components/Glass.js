/**
 * Liquid Glass design system — Zaytoon زيتون
 * Clean, minimal, frosted glass over warm cream wallpaper.
 */
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Animated } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef } from "react";

// ─── Arabic font (El Messiri) ─────────────────────────────────────────────────
export const ARABIC_FONTS = {
  regular:  "ElMessiri_400Regular",
  medium:   "ElMessiri_500Medium",
  semiBold: "ElMessiri_600SemiBold",
  bold:     "ElMessiri_700Bold",
};
// Helper: returns Arabic fontFamily style when RTL, empty object otherwise
export const ar = (isRTL, weight = "regular") =>
  isRTL ? { fontFamily: ARABIC_FONTS[weight] } : {};

// ─── Design tokens ───────────────────────────────────────────────────────────
export const T = {
  ink:        "#1a2218",
  mute:       "rgba(26,34,24,0.55)",
  muteStrong: "rgba(26,34,24,0.38)",
  green:      "#3d6b47",
  greenBright:"#6fb380",
  accent:     "#e8993a",
  urgent:     "#e05c4a",
};

// Pearl white wallpaper
export const WALLPAPER = {
  colors: ["#fdfcf9", "#f9f8f4", "#f3f2ec"],
  start:  { x: 0, y: 0 },
  end:    { x: 1, y: 1 },
};

// ─── WallpaperBackground — geometric circle composition ──────────────────────
export function WallpaperBackground() {
  return (
    <>
      {/* Warm cream gradient base */}
      <LinearGradient
        colors={WALLPAPER.colors}
        start={WALLPAPER.start}
        end={WALLPAPER.end}
        style={StyleSheet.absoluteFill}
      />

      {/* Top-right cluster */}
      <View pointerEvents="none" style={{ position:"absolute", top:-180, right:-180, width:460, height:460, borderRadius:230, backgroundColor:"rgba(82,138,58,0.04)" }} />
      <View pointerEvents="none" style={{ position:"absolute", top:-130, right:-130, width:340, height:340, borderRadius:170, backgroundColor:"rgba(82,138,58,0.06)" }} />
      <View pointerEvents="none" style={{ position:"absolute", top:-85,  right:-85,  width:220, height:220, borderRadius:110, backgroundColor:"rgba(82,138,58,0.07)" }} />

      {/* Bottom-left cluster — slightly larger, warm amber tint */}
      <View pointerEvents="none" style={{ position:"absolute", bottom:-200, left:-200, width:520, height:520, borderRadius:260, backgroundColor:"rgba(180,120,50,0.04)"  }} />
      <View pointerEvents="none" style={{ position:"absolute", bottom:-145, left:-145, width:380, height:380, borderRadius:190, backgroundColor:"rgba(180,120,50,0.055)" }} />
      <View pointerEvents="none" style={{ position:"absolute", bottom:-95,  left:-95,  width:250, height:250, borderRadius:125, backgroundColor:"rgba(180,120,50,0.065)" }} />
    </>
  );
}

// ─── Bloom — angled soft color bands peeking in from edges ───────────────────
// size controls the band length; shape is a wide flat rectangle rotated ~20°
export function Bloom({ color, size, top, left, right, bottom }) {
  // Decide rotation direction based on which corner the band anchors from
  const fromLeft = left !== undefined;
  const fromTop  = top  !== undefined;
  let rotate;
  if (fromTop  && fromLeft)  rotate = "-22deg";
  else if (fromTop  && !fromLeft) rotate = "22deg";
  else if (!fromTop && fromLeft)  rotate = "18deg";
  else                            rotate = "-18deg";

  return (
    <View
      pointerEvents="none"
      style={{
        position: "absolute",
        top, left, right, bottom,
        width:  size * 1.9,
        height: size * 0.52,
        borderRadius: size * 0.26,
        backgroundColor: color,
        transform: [{ rotate }],
      }}
    />
  );
}

// ─── GlassPanel — main card surface ──────────────────────────────────────────
export function GlassPanel({ children, style, radius = 20, padding = 0, intensity = 80 }) {
  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.85)",
          shadowColor: "rgba(40,55,35,0.14)",
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 1,
          shadowRadius: 16,
          elevation: 3,
        },
        style,
      ]}
    >
      {/* Frosted blur fill — higher opacity for readability */}
      <BlurView
        intensity={intensity}
        tint="light"
        style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.72)" }]}
      />
      {/* Top sheen */}
      <View
        style={{
          position: "absolute", top: 0, left: 0, right: 0, height: 1,
          backgroundColor: "rgba(255,255,255,0.95)",
        }}
      />
      {/* Content */}
      <View style={{ padding }}>
        {children}
      </View>
    </View>
  );
}

// ─── TextBackdrop — semi-transparent frosted panel behind text for readability ─
export function TextBackdrop({ children, style, padding = 14, radius = 16 }) {
  return (
    <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
      <BlurView intensity={28} tint="light" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.55)" }]} />
      <View style={{ padding }}>{children}</View>
    </View>
  );
}

// ─── Chip — small pill badge / filter button ──────────────────────────────────
export function Chip({ children, active = false, onPress, style }) {
  const Wrapper = onPress ? TouchableOpacity : View;
  return (
    <Wrapper
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        {
          overflow: "hidden",
          borderRadius: 100,
          borderWidth: 1,
          // Active: solid green — no BlurView (light tint washes out color)
          // Inactive: glass with blur
          backgroundColor: active ? T.green : "transparent",
          borderColor: active ? "rgba(61,107,71,0.50)" : "rgba(255,255,255,0.82)",
        },
        style,
      ]}
    >
      {/* Only blur inactive chips — active gets solid green */}
      {!active && (
        <BlurView
          intensity={55}
          tint="light"
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.30)" }]}
        />
      )}
      <View style={{ paddingHorizontal: 13, paddingVertical: 6 }}>
        <Text style={{ fontSize: 11, fontWeight: "700", color: active ? "#fff" : T.ink }}>
          {children}
        </Text>
      </View>
    </Wrapper>
  );
}

// ─── GlassButton — primary (green) or secondary (glass) CTA ──────────────────
export function GlassButton({ children, primary = false, danger = false, accent = false, onPress, disabled, loading, style }) {
  if (primary) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.83}
        style={[
          {
            backgroundColor: T.green,
            borderRadius: 100,
            paddingVertical: 15,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
            shadowColor: "rgba(30,58,33,0.45)",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: disabled ? 0 : 1,
            shadowRadius: 18,
            elevation: 5,
            opacity: disabled ? 0.55 : 1,
            overflow: "hidden",
          },
          style,
        ]}
      >
        {/* Inner highlight sheen */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", backgroundColor: "rgba(255,255,255,0.14)" }} />
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 }}>{children}</Text>
        }
      </TouchableOpacity>
    );
  }
  // Accent button — warm amber
  if (accent) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.83}
        style={[
          {
            backgroundColor: T.accent,
            borderRadius: 100,
            paddingVertical: 15,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.28)",
            shadowColor: "rgba(200,120,30,0.40)",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: disabled ? 0 : 1,
            shadowRadius: 18,
            elevation: 5,
            opacity: disabled ? 0.55 : 1,
            overflow: "hidden",
          },
          style,
        ]}
      >
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: "50%", backgroundColor: "rgba(255,255,255,0.14)" }} />
        {loading
          ? <ActivityIndicator color="#fff" />
          : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15, letterSpacing: 0.2 }}>{children}</Text>
        }
      </TouchableOpacity>
    );
  }
  // Secondary / danger glass button
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      style={[
        {
          borderRadius: 100,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: danger ? "rgba(224,92,74,0.45)" : "rgba(255,255,255,0.85)",
          shadowColor: "rgba(40,55,35,0.08)",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 10,
          elevation: 2,
          opacity: disabled ? 0.55 : 1,
        },
        style,
      ]}
    >
      <BlurView intensity={65} tint="light" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.42)" }]} />
      <View style={{ paddingVertical: 15, alignItems: "center", justifyContent: "center" }}>
        {loading
          ? <ActivityIndicator color={danger ? T.urgent : T.ink} />
          : <Text style={{ color: danger ? T.urgent : T.ink, fontWeight: "600", fontSize: 15 }}>{children}</Text>
        }
      </View>
    </TouchableOpacity>
  );
}

// ─── SkeletonBox — animated shimmer placeholder ───────────────────────────────
export function SkeletonBox({ width, height, radius = 8, style }) {
  const anim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.7, duration: 700, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.35, duration: 700, useNativeDriver: true }),
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
          backgroundColor: "rgba(26,34,24,0.10)",
          opacity: anim,
        },
        style,
      ]}
    />
  );
}

// ─── InlineError — replaces Alert.alert for in-screen errors ─────────────────
export function InlineError({ message, onDismiss, style }) {
  if (!message) return null;
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          backgroundColor: "rgba(224,92,74,0.10)",
          borderWidth: 1,
          borderColor: "rgba(224,92,74,0.28)",
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
