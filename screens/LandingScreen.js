import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lang/LanguageContext";

export default function LandingScreen({ navigation }) {
  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

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
          <View style={[styles.topBar, isRTL && styles.rtlRow]}>
            <Text style={styles.logoText}>Wajbeh</Text>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnText}>
                {language === "en" ? "العربية" : "English"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hero text centered */}
          <View style={styles.heroCenter}>
            <View style={styles.tagPill}>
              <Text style={styles.tagPillText}>{t("ammanJordan")}</Text>
            </View>
            <Text style={[styles.heroTitle, isRTL && styles.rtl]}>{t("heroTitle")}</Text>
            <Text style={[styles.heroSub, isRTL && styles.rtl]}>{t("landingSubtitle")}</Text>
          </View>

          {/* Stats floating at bottom of hero */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>70%</Text>
              <Text style={styles.statLabel}>{t("offRetail")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>5+</Text>
              <Text style={styles.statLabel}>{t("restaurantsLabel")}</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{t("daily")}</Text>
              <Text style={styles.statLabel}>{t("freshBagsLabel")}</Text>
            </View>
          </View>
        </SafeAreaView>
      </ImageBackground>

      {/* Bottom sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.sheetHandle} />

        <Text style={[styles.sheetTitle, isRTL && styles.rtl]}>{t("joinMovement")}</Text>
        <Text style={[styles.sheetSubtitle, isRTL && styles.rtl]}>{t("joinMovementDesc")}</Text>

        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate("SignUp")}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryBtnText}>
              {t("createAccountLanding")}
            </Text>
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
            <Text style={styles.footerDividerText}>{t("forRestaurantOwners")}</Text>
            <View style={styles.footerLine} />
          </View>
          <Text style={styles.footerNote}>
            {t("restaurantQuestion")}{" "}
            <Text style={styles.footerLink} onPress={() => navigation.navigate("Contact")}>{t("contactUs")}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D2B0D" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

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
  logoText: {
    fontSize: 22,
    fontWeight: "700",
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
    fontSize: 40,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 48,
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
    maxWidth: 480,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNumber: {
    fontSize: 22,
    fontWeight: "700",
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 28,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DBDBDB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 24,
  },
  sheetTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F0F0F",
    textAlign: "center",
    marginBottom: 8,
  },
  sheetSubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 28,
    paddingHorizontal: 8,
  },

  // Buttons
  btnGroup: { gap: 12, marginBottom: 24 },
  primaryBtn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },
  secondaryBtnText: { color: "#737373", fontSize: 15, fontWeight: "500" },

  // Footer
  sheetFooter: { gap: 12 },
  footerDivider: { flexDirection: "row", alignItems: "center", gap: 12 },
  footerLine: { flex: 1, height: 1, backgroundColor: "#F0F0F0" },
  footerDividerText: { fontSize: 12, color: "#B8B8B8", fontWeight: "500" },
  footerNote: { fontSize: 13, color: "#737373", textAlign: "center" },
  footerLink: { color: "#2E7D32", fontWeight: "600" },
});
