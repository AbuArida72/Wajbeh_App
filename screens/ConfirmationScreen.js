import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useLanguage } from "../lang/LanguageContext";

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
  const codeVisible = isPickupTimeActive(bag.pickup_start);

  const orderDetails = [
    { iconName: "storefront-outline", label: t("restaurant"), value: bag.restaurant },
    { iconName: "bag-handle-outline", label: t("bag"), value: bag.title },
    {
      iconName: "time-outline",
      label: t("pickupWindow"),
      value: `${bag.pickup_start} – ${bag.pickup_end}`,
    },
    {
      iconName: "calendar-outline",
      label: "Date",
      value: new Date().toLocaleDateString("en-JO", {
        day: "numeric",
        month: "long",
      }),
    },
  ];

  const nextSteps = [
    {
      step: "1",
      text: `Head to ${bag.restaurant} during ${bag.pickup_start} – ${bag.pickup_end}`,
    },
    {
      step: "2",
      text: "Show the pickup code in your Orders tab to the staff",
    },
    {
      step: "3",
      text: "Collect your surprise bag and enjoy",
    },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Success icon */}
        <View style={styles.successSection}>
          <View style={styles.successCircle}>
            <Ionicons name="checkmark-circle" size={64} color="#2E7D32" />
          </View>
          <Text style={styles.successTitle}>{t("bagReserved")}</Text>
          <Text style={styles.successSubtitle}>
            {t("showCodeAt")}{" "}
            <Text style={styles.successRestaurant}>{bag.restaurant}</Text>{" "}
            {t("toCollect")}
          </Text>
          <View style={styles.savingsPill}>
            <Text style={styles.savingsPillText}>
              You saved JD {savings}
            </Text>
          </View>
        </View>

        {/* Pickup code card */}
        <View style={styles.codeSection}>
          <Text style={styles.codeSectionLabel}>{t("yourPickupCode")}</Text>
          <View style={[styles.codeCard, !codeVisible && styles.codeCardLocked]}>
            {codeVisible ? (
              <View style={styles.codeCardInner}>
                {pickupCode.split("").map((char, i) => (
                  <View key={i} style={styles.codeCharBox}>
                    <Text style={styles.codeChar}>{char}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.codeLockedContent}>
                <Ionicons name="lock-closed-outline" size={28} color="#B8B8B8" />
                <Text style={styles.codeLockTitle}>Code Hidden</Text>
                <Text style={styles.codeLockSub}>Available at {bag.pickup_start}</Text>
              </View>
            )}
            <Text style={styles.codeHint}>
              {codeVisible ? "Show at counter" : "Check your orders when pickup time arrives"}
            </Text>
          </View>
        </View>

        {/* Order summary */}
        <View style={styles.detailsCard}>
          <Text style={styles.detailsHeader}>Order Summary</Text>

          {orderDetails.map((item, i, arr) => (
            <View key={i}>
              <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                <View style={styles.detailLeft}>
                  <Ionicons name={item.iconName} size={16} color="#737373" />
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
              <Ionicons name="card-outline" size={16} color="#737373" />
              <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
                {t("amountPaid")}
              </Text>
            </View>
            <Text style={styles.detailValueGreen}>
              JD {parseFloat(bag.price).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* What's next */}
        <View style={styles.nextSection}>
          <Text style={styles.nextTitle}>What's next?</Text>
          {nextSteps.map((item, i) => (
            <View key={i} style={styles.nextItem}>
              <View style={styles.nextStepBadge}>
                <Text style={styles.nextStepNum}>{item.step}</Text>
              </View>
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

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flexGrow: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Success section
  successSection: {
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  successCircle: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F0F0F",
    marginBottom: 8,
    textAlign: "center",
  },
  successSubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  successRestaurant: { color: "#0F0F0F", fontWeight: "600" },
  savingsPill: {
    backgroundColor: "#F2F8F2",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },
  savingsPillText: { color: "#2E7D32", fontSize: 13, fontWeight: "600" },

  // Code section
  codeSection: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  codeSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8B8B8",
    textAlign: "center",
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  codeCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  codeCardInner: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  codeCharBox: {
    width: 44,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#A5D6A7",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  codeChar: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1B5E20",
  },
  codeHint: { fontSize: 12, color: "#2E7D32", fontWeight: "500", textAlign: "center", marginTop: 8 },
  codeLockedContent: { alignItems: "center", paddingVertical: 12, gap: 8 },
  codeCardLocked: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  codeLockTitle: { fontSize: 15, fontWeight: "600", color: "#0F0F0F", textAlign: "center" },
  codeLockSub: { fontSize: 12, color: "#737373", textAlign: "center" },

  // Details card
  detailsCard: {
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
  },
  detailsHeader: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8B8B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
    backgroundColor: "#FAFAFA",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  detailLabel: { fontSize: 13, color: "#737373" },
  detailValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0F0F0F",
    maxWidth: "55%",
    textAlign: "right",
  },
  detailValueGreen: { fontSize: 15, fontWeight: "700", color: "#2E7D32" },
  detailDivider: {
    height: 1,
    backgroundColor: "#F5F5F5",
    marginHorizontal: 16,
  },

  // Next steps
  nextSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  nextTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8B8B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: "center",
  },
  nextItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  nextStepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nextStepNum: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  nextText: { fontSize: 13, color: "#737373", flex: 1, lineHeight: 19 },

  // Buttons
  btnGroup: { paddingHorizontal: 20, gap: 10 },
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
});
