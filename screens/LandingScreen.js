import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ImageBackground,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lang/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { T, ar, FONTS } from "../components/Glass";
import { useLocation } from "../lib/LocationContext";

export default function LandingScreen({ navigation }) {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const { cityName } = useLocation();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-screen food hero */}
      <ImageBackground
        source={{ uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200" }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        {/* Dark overlay */}
        <View style={styles.overlay} />

        <SafeAreaView style={{ flex: 1 }}>
          {/* Top bar */}
          <View style={[styles.topBar, isRTL && styles.rtlRow]}>
            <Text style={[styles.brandName, ar(isRTL, "bold")]}>{t("appName")}</Text>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage} activeOpacity={0.8}>
              <Text style={styles.langBtnText}>
                {language === "en" ? "العربية" : "English"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Center text */}
          <View style={styles.heroCenter}>
            <View style={[styles.locationRow, isRTL && styles.rtlRow]}>
              <View style={styles.locationDot} />
              <Text style={styles.locationText}>
                {cityName || t("ammanJordan")}
              </Text>
            </View>
            <Text style={[styles.heroTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>
              {t("heroTitle")}
            </Text>
            <Text style={[styles.heroSub, isRTL && styles.rtl, isRTL && { maxWidth: "100%", alignSelf: "flex-end" }, ar(isRTL, "regular")]}>
              {t("landingSubtitle")}
            </Text>
          </View>

          {/* Stats row */}
          <View style={styles.statsContainer}>
            <View style={[styles.statsRow, isRTL && styles.rtlRow]}>
              {[
                { n: "70%", l: t("statOffRetail") },
                { n: "5+",  l: t("statRestaurants") },
                { n: t("freshBagsLabel"), l: t("statBagsDaily") },
              ].map((s, i) => (
                <View key={i} style={[styles.statItem, i < 2 && styles.statDivider]}>
                  <Text style={styles.statNum}>{s.n}</Text>
                  <Text style={styles.statLabel}>{s.l}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Bottom sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />

        <Text style={[styles.sheetTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>
          {t("joinMovement")}
        </Text>
        <Text style={[styles.sheetSubtitle, isRTL && styles.rtl, ar(isRTL, "regular")]}>
          {t("joinMovementDesc")}
        </Text>

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("SignUp")}
            activeOpacity={0.87}
          >
            <Text style={styles.primaryBtnText}>{t("createAccountLanding")}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("SignIn")}
            activeOpacity={0.87}
          >
            <Text style={styles.secondaryBtnText}>{t("signInLanding")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footerRow, isRTL && styles.rtlRow]}>
          <View style={styles.footerLine} />
          <Text style={styles.footerNote}>
            {t("restaurantQuestion")}{" "}
            <Text
              style={styles.footerLink}
              onPress={() => navigation.navigate("Contact")}
            >
              {t("contactUs")}
            </Text>
          </Text>
          <View style={styles.footerLine} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0D2010" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Hero
  hero: { flex: 1 },
  heroImage: { resizeMode: "cover" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.52)",
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  brandName: {
    fontSize: 34,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.8,
    fontFamily: FONTS.bold,
  },
  langBtn: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  langBtnText: { fontSize: 12, fontWeight: "600", color: "#FFFFFF" },

  // Center hero text
  heroCenter: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 28,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  locationDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: T.greenBright,
  },
  locationText: {
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    color: "rgba(255,255,255,0.70)",
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.6,
    lineHeight: 34,
    marginBottom: 14,
    fontFamily: FONTS.bold,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.72)",
    lineHeight: 23,
    maxWidth: 300,
  },

  // Stats
  statsContainer: {
    marginHorizontal: 20,
    marginBottom: 28,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 14,
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 8,
  },
  statItem: { flex: 1, alignItems: "center" },
  statDivider: {
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.18)",
  },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.60)",
    textAlign: "center",
  },

  // Bottom sheet
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(26,26,26,0.12)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: T.ink,
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: T.mute,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  // Buttons
  btnGroup: { gap: 12, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: T.green,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 4,
  },
  primaryBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "rgba(26,26,26,0.14)",
  },
  secondaryBtnText: { color: T.ink, fontSize: 15, fontWeight: "600" },

  // Footer
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  footerLine: { flex: 1, height: 1, backgroundColor: "rgba(15,23,42,0.06)" },
  footerNote: { fontSize: 12, color: T.mute, textAlign: "center" },
  footerLink: { color: T.green, fontWeight: "700" },
});
