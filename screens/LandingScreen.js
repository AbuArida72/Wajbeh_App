import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { useLanguage } from "../lang/LanguageContext";

export default function LandingScreen({ navigation }) {
  const { t, language, toggleLanguage } = useLanguage();

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Hero section */}
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200",
        }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.overlay} />

        <SafeAreaView style={styles.heroContent}>
          {/* Top bar */}
          <View style={styles.topBar}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoEmoji}>🌿</Text>
              </View>
              <Text style={styles.logoText}>Wajbeh وجبة</Text>
            </View>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnText}>
                {language === "en" ? "العربية" : "English"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero text centered */}
          <View style={styles.heroCenter}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>🇯🇴 Amman, Jordan</Text>
            </View>
            <Text style={styles.heroTitle}>{t("landingTitle")}</Text>
            <Text style={styles.heroSub}>{t("landingSubtitle")}</Text>
          </View>

          {/* Stats floating at bottom of hero */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>70%</Text>
              <Text style={styles.statLabel}>Off retail</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5+</Text>
              <Text style={styles.statLabel}>Restaurants</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>Daily</Text>
              <Text style={styles.statLabel}>Fresh bags</Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Bottom sheet */}
      <View style={styles.sheet}>
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>Join the movement 🌱</Text>
        <Text style={styles.sheetSubtitle}>
          Get restaurant-quality food at a fraction of the price — while helping
          reduce food waste in Jordan
        </Text>

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("SignUp")}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              {t("createAccountLanding")}
            </Text>
            <View style={styles.btnArrow}>
              <Text style={styles.btnArrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate("SignIn")}
            activeOpacity={0.88}
          >
            <Text style={styles.secondaryBtnText}>{t("signInLanding")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sheetFooter}>
          <View style={styles.footerDivider}>
            <View style={styles.footerLine} />
            <Text style={styles.footerDividerText}>for restaurant owners</Text>
            <View style={styles.footerLine} />
          </View>
          <Text style={styles.footerNote}>
            🏪 {t("restaurantQuestion")}{" "}
            <Text style={styles.footerLink}>{t("contactUs")}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D2B0D" },

  // Hero
  hero: { flex: 1 },
  heroImage: { resizeMode: "cover" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(5,20,5,0.55)",
  },
  heroContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 24,
    justifyContent: "space-between",
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
  },
  logoEmoji: { fontSize: 20 },
  logoText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
  },
  langBtn: {
    backgroundColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  langBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },

  // Hero center
  heroCenter: { flex: 1, justifyContent: "center", paddingVertical: 20 },
  tagPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(46,125,50,0.75)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(165,214,167,0.35)",
  },
  tagPillText: { color: "#A5D6A7", fontSize: 13, fontWeight: "600" },
  heroTitle: {
    fontSize: 44,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 52,
    marginBottom: 16,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  heroSub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
    maxWidth: 480,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: 8,
  },

  // Bottom sheet
  sheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 28,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 24,
  },
  sheetHandle: {
    width: 44,
    height: 5,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1B5E20",
    textAlign: "center",
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#888780",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 16,
  },

  // Buttons
  btnGroup: { gap: 12, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 17,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
  btnArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  btnArrowText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#F0F7F0",
    paddingVertical: 17,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
  },
  secondaryBtnText: { color: "#2E7D32", fontSize: 16, fontWeight: "700" },

  // Footer
  sheetFooter: { gap: 12 },
  footerDivider: { flexDirection: "row", alignItems: "center", gap: 12 },
  footerLine: { flex: 1, height: 1, backgroundColor: "#F0F0F0" },
  footerDividerText: { fontSize: 12, color: "#C0BDB8", fontWeight: "500" },
  footerNote: { fontSize: 13, color: "#888780", textAlign: "center" },
  footerLink: { color: "#2E7D32", fontWeight: "700" },
});
