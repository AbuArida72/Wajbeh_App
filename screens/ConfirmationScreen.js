import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { useLanguage } from "../lang/LanguageContext";

export default function ConfirmationScreen({ route, navigation }) {
  const { pickupCode, bag } = route.params;
  const { t, isRTL } = useLanguage();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.successCircle}>
          <Text style={styles.successEmoji}>🎉</Text>
        </View>

        <Text style={[styles.title, isRTL && styles.rtl]}>
          {t("bagReserved")}
        </Text>
        <Text style={[styles.subtitle, isRTL && styles.rtl]}>
          {t("showCodeAt")} {bag.restaurant} {t("toCollect")}
        </Text>

        {/* Pickup code */}
        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>{t("yourPickupCode")}</Text>
          <Text style={styles.code}>{pickupCode}</Text>
          <View style={styles.codeDivider} />
          <Text style={styles.codeHint}>{t("showAtCounter")}</Text>
        </View>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
              {t("restaurant")}
            </Text>
            <Text style={[styles.detailValue, isRTL && styles.rtl]}>
              {bag.restaurant}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
              {t("bag")}
            </Text>
            <Text style={[styles.detailValue, isRTL && styles.rtl]}>
              {bag.title}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
              {t("pickupWindow")}
            </Text>
            <Text style={[styles.detailValue, isRTL && styles.rtl]}>
              {bag.pickup_start} – {bag.pickup_end}
            </Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
            <Text style={[styles.detailLabel, isRTL && styles.rtl]}>
              {t("amountPaid")}
            </Text>
            <Text style={styles.detailValueGreen}>
              JD {parseFloat(bag.price).toFixed(2)}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.ordersBtn}
          onPress={() =>
            navigation.reset({
              index: 0,
              routes: [{ name: "Tabs", params: { screen: "Orders" } }],
            })
          }
        >
          <Text style={styles.ordersBtnText}>{t("viewMyOrders")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate("Tabs", { screen: "Home" })}
        >
          <Text style={styles.homeBtnText}>{t("backToHome")}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F7F0" },
  container: { flex: 1, alignItems: "center", padding: 24, paddingTop: 40 },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#C8E6C9",
  },
  successEmoji: { fontSize: 48 },
  title: { fontSize: 28, fontWeight: "800", color: "#1B5E20", marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    color: "#888780",
    textAlign: "center",
    marginBottom: 28,
    lineHeight: 20,
  },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
  codeCard: {
    backgroundColor: "#2E7D32",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    width: "100%",
    marginBottom: 16,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  codeLabel: {
    fontSize: 13,
    color: "#A5D6A7",
    marginBottom: 10,
    fontWeight: "500",
  },
  code: { fontSize: 48, fontWeight: "800", color: "#FFFFFF", letterSpacing: 8 },
  codeDivider: {
    width: "80%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginVertical: 12,
  },
  codeHint: { fontSize: 12, color: "#A5D6A7" },
  detailsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    width: "100%",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  detailDivider: { height: 1, backgroundColor: "#F0F7F0" },
  detailLabel: { fontSize: 13, color: "#888780" },
  detailValue: { fontSize: 13, fontWeight: "600", color: "#1B5E20" },
  detailValueGreen: { fontSize: 15, fontWeight: "800", color: "#2E7D32" },
  ordersBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  ordersBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  homeBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: "100%",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
  },
  homeBtnText: { color: "#2E7D32", fontSize: 16, fontWeight: "700" },
});
