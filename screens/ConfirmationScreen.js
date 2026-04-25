import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../lang/LanguageContext";
import { GlassPanel, GlassButton, T, WallpaperBackground, ar } from "../components/Glass";

const isPickupTimeActive = (pickupStart) => {
  if (!pickupStart) return false;
  const now = new Date();
  const [h, m] = pickupStart.slice(0, 5).split(":").map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  return now >= start;
};

export default function ConfirmationScreen({ route, navigation }) {
  const { pickupCode, bag } = route.params;
  const { t, isRTL } = useLanguage();
  const savings = (bag.original_value - bag.price).toFixed(2);
  const pickupActive = isPickupTimeActive(bag.pickup_start);

  const nextSteps = [
    t("step1Confirm", { restaurant: bag.restaurant, start: bag.pickup_start, end: bag.pickup_end }),
    t("step2Confirm"),
    t("step3Confirm"),
  ];

  return (
    <View style={styles.root}>

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* Success banner — solid green */}
          <View style={styles.successBand}>
            <View style={styles.checkCircle}>
              <Ionicons name="checkmark" size={36} color={T.green} />
            </View>
            <Text style={[styles.successTitle, ar(isRTL, "bold")]}>{t("bagReserved")}</Text>
            <Text style={styles.successSub}>
              {t("showCodeAt")}{" "}
              <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>{bag.restaurant}</Text>{" "}
              {t("toCollect")}
            </Text>
          </View>

          {/* Thank you card */}
          <GlassPanel radius={18} padding={16} style={styles.thankYouCard}>
            <View style={styles.thankYouRow}>
              <Ionicons name="leaf-outline" size={20} color={T.green} />
              <View style={{ flex: 1 }}>
                <Text style={styles.thankYouTitle}>{t("thankYouTitle")}</Text>
                <Text style={styles.thankYouSub}>{t("thankYouSub")}</Text>
              </View>
            </View>
          </GlassPanel>

          {/* Pickup code */}
          <GlassPanel radius={22} padding={20} style={styles.codeCard}>
            <Text style={styles.codeLabel}>{t("yourPickupCode")}</Text>
            {pickupActive ? (
              <>
                <Text style={styles.codeText}>{pickupCode}</Text>
                <View style={styles.dashedRow}>
                  {Array.from({ length: 20 }).map((_, i) => (
                    <View key={i} style={styles.dashedDot} />
                  ))}
                </View>
                <Text style={styles.codeHint}>· {t("showAtCounter")} ·</Text>
              </>
            ) : (
              <View style={styles.lockBox}>
                <Ionicons name="lock-closed-outline" size={28} color={T.muteStrong} />
                <Text style={styles.lockTitle}>{t("codeHidden")}</Text>
                <Text style={styles.lockSub}>{t("availableAt")} {bag.pickup_start}</Text>
              </View>
            )}
          </GlassPanel>

          {/* Savings + amount row */}
          <GlassPanel radius={18} padding={16} style={styles.savingsCard}>
            <View style={styles.savingsRow}>
              <View style={styles.savingsItem}>
                <Text style={styles.savingsCap}>{t("amountPaid")}</Text>
                <Text style={styles.savingsPrice}>JD {parseFloat(bag.price).toFixed(2)}</Text>
              </View>
              <View style={styles.savingsDivider} />
              <View style={styles.savingsItem}>
                <Text style={styles.savingsCap}>{t("youSavedAmount")}</Text>
                <Text style={[styles.savingsPrice, { color: T.green }]}>JD {savings}</Text>
              </View>
            </View>
          </GlassPanel>

          {/* Order summary */}
          <Text style={styles.sectionLabel}>· {t("orderSummary") || "Order Summary"}</Text>
          <GlassPanel radius={18} style={{ marginBottom: 16, overflow: "hidden" }}>
            {[
              { icon: "storefront-outline", label: t("restaurant"), value: bag.restaurant },
              { icon: "bag-handle-outline", label: t("bag"), value: bag.title },
              { icon: "time-outline", label: t("pickupWindow"), value: `${bag.pickup_start} – ${bag.pickup_end}` },
            ].map((item, i, arr) => (
              <View key={i}>
                <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                  <View style={[styles.detailLeft, isRTL && styles.rtlRow]}>
                    <Ionicons name={item.icon} size={14} color={T.muteStrong} />
                    <Text style={[styles.detailLabel, isRTL && styles.rtl]}>{item.label}</Text>
                  </View>
                  <Text
                    style={[styles.detailValue, isRTL && styles.rtl]}
                    numberOfLines={1}
                  >
                    {item.value}
                  </Text>
                </View>
                {i < arr.length - 1 && <View style={styles.rowDivider} />}
              </View>
            ))}
          </GlassPanel>

          {/* What's next */}
          <Text style={styles.sectionLabel}>· {t("whatsNext")}</Text>
          <GlassPanel radius={18} style={{ marginBottom: 24, overflow: "hidden" }}>
            {nextSteps.map((step, i) => (
              <View key={i} style={[styles.stepRow, i < nextSteps.length - 1 && styles.stepBorder, isRTL && styles.rtlRow]}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNum}>{i + 1}</Text>
                </View>
                <Text style={[styles.stepText, isRTL && styles.rtl, ar(isRTL, "regular")]}>{step}</Text>
              </View>
            ))}
          </GlassPanel>

          {/* Buttons */}
          <GlassButton primary onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "Tabs", params: { screen: "Orders" } }] })
          }>
            {t("viewMyOrders")}
          </GlassButton>
          <View style={{ height: 10 }} />
          <GlassButton onPress={() =>
            navigation.reset({ index: 0, routes: [{ name: "Tabs" }] })
          }>
            {t("backToHome")}
          </GlassButton>

          <View style={{ height: 32 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Success banner
  successBand: {
    backgroundColor: T.green,
    alignItems: "center",
    marginHorizontal: -20,
    marginTop: -16,
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 32,
    marginBottom: 24,
  },
  checkCircle: {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: "#FFFFFF",
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  successTitle: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.6, textAlign: "center", marginBottom: 8 },
  successSub: { fontSize: 13, color: "rgba(255,255,255,0.80)", textAlign: "center", lineHeight: 20 },

  // Thank you card
  thankYouCard: { marginBottom: 16 },
  thankYouRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  thankYouTitle: { fontSize: 14, fontWeight: "700", color: T.green, marginBottom: 4 },
  thankYouSub: { fontSize: 12, color: T.mute, lineHeight: 18 },

  // Code card
  codeCard: { alignItems: "center", marginBottom: 16 },
  codeLabel: { fontSize: 9, letterSpacing: 1.5, textTransform: "uppercase", color: T.muteStrong, fontWeight: "700", marginBottom: 14 },
  codeText: { fontSize: 40, fontWeight: "800", color: T.green, letterSpacing: 6 },
  dashedRow: { flexDirection: "row", gap: 3, marginTop: 16, marginBottom: 12 },
  dashedDot: { width: 4, height: 1.5, backgroundColor: "rgba(15,23,42,0.15)", borderRadius: 1 },
  codeHint: { fontSize: 10, color: T.muteStrong },
  lockBox: { alignItems: "center", gap: 8, paddingVertical: 8 },
  lockTitle: { fontSize: 14, fontWeight: "600", color: T.ink },
  lockSub: { fontSize: 12, color: T.mute },

  // Savings card
  savingsCard: { marginBottom: 20 },
  savingsRow: { flexDirection: "row", alignItems: "center" },
  savingsItem: { flex: 1, alignItems: "center" },
  savingsDivider: { width: 1, height: 36, backgroundColor: "rgba(15,23,42,0.08)" },
  savingsCap: { fontSize: 9, color: T.muteStrong, textTransform: "uppercase", letterSpacing: 0.8, fontWeight: "600", marginBottom: 4 },
  savingsPrice: { fontSize: 18, fontWeight: "800", color: T.accent, letterSpacing: -0.3 },

  // Section labels
  sectionLabel: { fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: T.muteStrong, fontWeight: "700", marginBottom: 8 },

  // Detail rows
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 13, paddingHorizontal: 16 },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  detailLabel: { fontSize: 13, color: T.mute },
  detailValue: { fontSize: 13, fontWeight: "600", color: T.ink, maxWidth: "50%", textAlign: "right" },
  rowDivider: { height: 1, backgroundColor: "rgba(15,23,42,0.05)", marginHorizontal: 16 },

  // Steps
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  stepBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.05)" },
  stepBadge: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: "rgba(21,128,61,0.10)",
    borderWidth: 1, borderColor: "rgba(21,128,61,0.18)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  stepNum: { fontSize: 12, fontWeight: "700", color: T.green },
  stepText: { fontSize: 13, color: T.ink, flex: 1, lineHeight: 19, paddingTop: 2 },
});
