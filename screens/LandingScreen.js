import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lang/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { GlassPanel, GlassButton, Chip, T, WallpaperBackground, ar } from "../components/Glass";
import { useLocation } from "../lib/LocationContext";

export default function LandingScreen({ navigation }) {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { cityName } = useLocation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* Wallpaper */}
      <WallpaperBackground />

      <SafeAreaView style={styles.safe}>
        <View style={[styles.content, { paddingBottom: insets.bottom + 20 }]}>

          {/* Top bar — language toggle only */}
          <View style={[styles.topBar, isRTL && styles.rtlRow]}>
            <View />
            <Chip onPress={toggleLanguage}>
              {language === "en" ? "العربية" : "English"}
            </Chip>
          </View>

          {/* Brand hero — centered Zaytoon */}
          <View style={styles.brandHero}>
            {/* Top leaf sprigs */}
            <View style={styles.plantTop}>
              <Ionicons name="leaf" size={18} color={T.green} style={{ opacity: 0.55, transform: [{ rotate: "40deg" }] }} />
              <Ionicons name="leaf" size={24} color={T.green} style={{ opacity: 0.70, transform: [{ rotate: "10deg" }] }} />
              <Ionicons name="leaf" size={18} color={T.green} style={{ opacity: 0.55, transform: [{ rotate: "-30deg" }] }} />
            </View>

            <Text style={[styles.brandName, ar(isRTL, "bold")]}>{t("appName")}</Text>

            <View style={[styles.locationRow, isRTL && styles.rtlRow]}>
              <View style={styles.locationDot} />
              <Text style={[styles.locationText, isRTL && styles.rtl]}>
                {cityName || t("ammanJordan")}
              </Text>
            </View>
          </View>

          {/* Hero text */}
          <View style={styles.hero}>
            <Text style={[styles.heroTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>
              {t("heroTitle") || "Save food.\nSave money."}
            </Text>
            <Text style={[styles.heroSub, isRTL && styles.rtl, ar(isRTL, "regular")]}>
              {t("landingSubtitle") || "Surplus food from the best restaurants in Amman — up to 70% off."}
            </Text>
          </View>

          {/* Stats strip */}
          <GlassPanel radius={18} padding={16} style={{ marginBottom: 32 }}>
            <View style={[styles.statsRow, isRTL && styles.rtlRow]}>
              {[
                { n: "70%",       l: t("offRetail") || "off retail" },
                { n: "5+",        l: t("restaurantsLabel") || "restaurants" },
                { n: t("daily") || "Daily", l: t("freshBagsLabel") || "fresh bags" },
              ].map((s, i) => (
                <View key={i} style={[styles.statItem, i < 2 && styles.statDivider]}>
                  <Text style={styles.statNum}>{s.n}</Text>
                  <Text style={styles.statLabel}>{s.l}</Text>
                </View>
              ))}
            </View>
          </GlassPanel>

          <View style={{ flex: 1 }} />

          {/* CTAs */}
          <GlassButton primary onPress={() => navigation.navigate("SignUp")}>
            {t("createAccountLanding") || "Create account"}
          </GlassButton>
          <View style={{ height: 10 }} />
          <GlassButton onPress={() => navigation.navigate("SignIn")}>
            {t("signInLanding") || "Sign in"}
          </GlassButton>

          <TouchableOpacity onPress={() => navigation.navigate("Contact")} style={{ marginTop: 18, alignItems: "center" }}>
            <Text style={[styles.restaurantNote, isRTL && styles.rtl]}>
              {t("restaurantQuestion") || "Are you a restaurant?"}{" "}
              <Text style={styles.restaurantLink}>{t("contactUs") || "Contact us"}</Text>
            </Text>
          </TouchableOpacity>

        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 10 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  topBar: { flexDirection: "row", justifyContent: "flex-end", alignItems: "center", marginBottom: 16 },

  brandHero: { alignItems: "center", marginBottom: 36 },
  plantTop: { flexDirection: "row", alignItems: "flex-end", gap: 4, marginBottom: 2 },
  brandName: {
    fontSize: 72,
    fontWeight: "800",
    color: T.ink,
    letterSpacing: -3,
    lineHeight: 76,
    marginBottom: 40,
  },

  hero: { marginBottom: 32 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 7, marginBottom: 16 },
  locationDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: T.greenBright,
    shadowColor: T.greenBright, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 6,
  },
  locationText: { fontSize: 10, letterSpacing: 1.4, textTransform: "uppercase", color: T.muteStrong, fontWeight: "700" },

  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -1,
    lineHeight: 38,
    marginBottom: 14,
  },
  heroSub: { fontSize: 14, lineHeight: 21, color: T.mute, maxWidth: 290 },

  statsRow: { flexDirection: "row" },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: { borderRightWidth: 1, borderRightColor: "rgba(255,255,255,0.4)" },
  statNum: { fontSize: 20, fontWeight: "800", color: T.ink, letterSpacing: -0.5, marginBottom: 3 },
  statLabel: { fontSize: 9, color: T.mute, letterSpacing: 0.4, textAlign: "center" },

  restaurantNote: { fontSize: 12, color: T.mute },
  restaurantLink: { color: T.accent, fontWeight: "700" },
});
