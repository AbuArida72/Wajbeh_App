import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { useLanguage } from "../lang/LanguageContext";

export default function ConfirmationScreen({ route, navigation }) {
  const { pickupCode, bag } = route.params;
  const { t, isRTL } = useLanguage();
  const savings = (bag.original_value - bag.price).toFixed(2);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Success banner */}
        <View style={styles.banner}>
          <View style={styles.bannerPattern}>
            {["🌿", "✨", "🌱", "⭐", "🍃"].map((e, i) => (
              <Text
                key={i}
                style={[
                  styles.patternItem,
                  {
                    top: `${15 + i * 15}%`,
                    left: i % 2 === 0 ? `${5 + i * 8}%` : undefined,
                    right: i % 2 !== 0 ? `${5 + i * 6}%` : undefined,
                    opacity: 0.12 + i * 0.04,
                    fontSize: 24 + i * 4,
                  },
                ]}
              >
                {e}
              </Text>
            ))}
          </View>

          <View style={styles.successRing}>
            <View style={styles.successRingInner}>
              <Text style={styles.successEmoji}>🎉</Text>
            </View>
          </View>

          <Text style={styles.bannerTitle}>{t("bagReserved")}</Text>
          <Text style={styles.bannerSubtitle}>
            {t("showCodeAt")}{" "}
            <Text style={styles.bannerRestaurant}>{bag.restaurant}</Text>{" "}
            {t("toCollect")}
          </Text>

          {/* Savings pill */}
          <View style={styles.savingsPill}>
            <Text style={styles.savingsPillText}>
              💰 You saved JD {savings} today!
            </Text>
          </View>

          <View style={styles.wave} />
        </View>

        {/* Pickup code card */}
        <View style={styles.codeSection}>
          <Text style={styles.codeSectionLabel}>{t("yourPickupCode")}</Text>
          <View style={styles.codeCard}>
            <View style={styles.codeCardInner}>
              {pickupCode.split("").map((char, i) => (
                <View key={i} style={styles.codeCharBox}>
                  <Text style={styles.codeChar}>{char}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.codeHint}>📱 {t("showAtCounter")}</Text>
          </View>
        </View>

        {/* Order details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsHeaderText}>Order Summary</Text>
          </View>

          {[
            { icon: "🏪", label: t("restaurant"), value: bag.restaurant },
            { icon: "🛍️", label: t("bag"), value: bag.title },
            {
              icon: "🕐",
              label: t("pickupWindow"),
              value: `${bag.pickup_start} – ${bag.pickup_end}`,
            },
            {
              icon: "📅",
              label: "Date",
              value: new Date().toLocaleDateString("en-JO", {
                day: "numeric",
                month: "long",
              }),
            },
          ].map((item, i, arr) => (
            <View key={i}>
              <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                <View style={styles.detailLeft}>
                  <Text style={styles.detailIcon}>{item.icon}</Text>
                  <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
                    {item.label}
                  </Text>
                </View>
                <Text
                  style={[styles.detailValue, isRTL && styles.rtl]}
                  numberOfLines={1}
                >
                  {item.value}
                </Text>
              </View>
              {i < arr.length - 1 && <View style={styles.detailDivider} />}
            </View>
          ))}

          <View style={styles.detailDivider} />
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <View style={styles.detailLeft}>
              <Text style={styles.detailIcon}>💳</Text>
              <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
                {t("amountPaid")}
              </Text>
            </View>
            <Text style={styles.detailValueGreen}>
              JD {parseFloat(bag.price).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* What happens next */}
        <View style={styles.nextSection}>
          <Text style={styles.nextTitle}>What happens next?</Text>
          {[
            {
              step: "1",
              text: `Head to ${bag.restaurant} during ${bag.pickup_start} – ${bag.pickup_end}`,
              icon: "🚶",
            },
            {
              step: "2",
              text: "Show the pickup code above to the staff",
              icon: "📱",
            },
            {
              step: "3",
              text: "Collect your surprise bag and enjoy!",
              icon: "🛍️",
            },
          ].map((item, i) => (
            <View key={i} style={styles.nextItem}>
              <View style={styles.nextStepBadge}>
                <Text style={styles.nextStepNum}>{item.step}</Text>
              </View>
              <Text style={styles.nextIcon}>{item.icon}</Text>
              <Text style={[styles.nextText, isRTL && styles.rtl]}>
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.btnGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            activeOpacity={0.88}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Tabs", params: { screen: "Orders" } }],
              })
            }
          >
            <Text style={styles.primaryBtnText}>{t("viewMyOrders")}</Text>
            <View style={styles.primaryBtnArrow}>
              <Text style={styles.primaryBtnArrowText}>→</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            activeOpacity={0.88}
            onPress={() =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Tabs" }],
              })
            }
          >
            <Text style={styles.secondaryBtnText}>{t("backToHome")}</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F7F0" },
  container: { flexGrow: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Banner
  banner: {
    backgroundColor: "#2E7D32",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 56,
    paddingHorizontal: 24,
    overflow: "hidden",
    position: "relative",
  },
  bannerPattern: { ...StyleSheet.absoluteFillObject },
  patternItem: { position: "absolute" },
  successRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  successRingInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  successEmoji: { fontSize: 42 },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  bannerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  bannerRestaurant: { color: "#FFFFFF", fontWeight: "800" },
  savingsPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  savingsPillText: { color: "#A5D6A7", fontSize: 13, fontWeight: "700" },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: "#F0F7F0",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  // Code section
  codeSection: {
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 16,
  },
  codeSectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888780",
    textAlign: "center",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeCard: {
    backgroundColor: "#1B5E20",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  codeCardInner: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  codeCharBox: {
    width: 44,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  codeChar: {
    fontSize: 26,
    fontWeight: "900",
    color: "#FFFFFF",
    fontVariant: ["tabular-nums"],
  },
  codeHint: { fontSize: 12, color: "#A5D6A7", fontWeight: "500" },

  // Details card
  detailsCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    overflow: "hidden",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  detailsHeader: {
    backgroundColor: "#F0F7F0",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E9",
  },
  detailsHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2E7D32",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    textAlign: "center",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailIcon: { fontSize: 16 },
  detailLabel: { fontSize: 13, color: "#888780" },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B5E20",
    maxWidth: "55%",
    textAlign: "right",
  },
  detailValueGreen: { fontSize: 16, fontWeight: "800", color: "#2E7D32" },
  detailDivider: {
    height: 1,
    backgroundColor: "#F0F7F0",
    marginHorizontal: 16,
  },

  // Next steps
  nextSection: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  nextTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888780",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
    textAlign: "center",
  },
  nextItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  nextStepBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  nextStepNum: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  nextIcon: { fontSize: 20 },
  nextText: { fontSize: 13, color: "#5F5E5A", flex: 1, lineHeight: 18 },

  // Buttons
  btnGroup: { paddingHorizontal: 20, gap: 10 },
  primaryBtn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    flex: 1,
    textAlign: "center",
  },
  primaryBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnArrowText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  secondaryBtn: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
  },
  secondaryBtnText: { color: "#2E7D32", fontSize: 16, fontWeight: "700" },
});
