import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function BagDetailScreen({ route, navigation }) {
  const { bag } = route.params;
  const discount = Math.round((1 - bag.price / bag.original_value) * 100);
  const savings = (bag.original_value - bag.price).toFixed(2);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const { t, isRTL } = useLanguage();

  const handleReserve = async () => {
    setReserving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        window.alert("Please sign in to reserve a bag.");
        setReserving(false);
        return;
      }
      const { data, error } = await supabase.rpc("reserve_bag", {
        p_bag_id: bag.id,
        p_user_id: authData.user.id,
      });
      if (error) throw error;
      if (data.success) {
        setReserved(true);
        navigation.navigate("Confirmation", {
          pickupCode: data.pickup_code,
          bag,
        });
      } else {
        window.alert(data.error || "Could not reserve bag");
      }
    } catch (err) {
      window.alert("Something went wrong. Please try again.");
      console.log(err);
    }
    setReserving(false);
  };

  const expectItems = [
    { icon: "🌿", key: "freshFood" },
    { icon: "🎁", key: "surpriseContents" },
    { icon: "📱", key: "showApp" },
    { icon: "♻️", key: "fightWaste" },
    { icon: "💚", key: "supportLocal" },
    { icon: "🚫", key: "noRefunds" },
  ];

  return (
    <View style={styles.wrapper}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Hero */}
        <ImageBackground source={{ uri: bag.image }} style={styles.hero}>
          <View style={styles.heroGradient} />

          {/* Back button */}
          <SafeAreaView style={styles.heroTopBar}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backArrow}>{isRTL ? "→" : "←"}</Text>
            </TouchableOpacity>
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>🏷️ {discount}% off</Text>
            </View>
          </SafeAreaView>

          {/* Restaurant info overlay */}
          <View style={[styles.heroBottom, isRTL && styles.rtlRow]}>
            <Image source={{ uri: bag.logo }} style={styles.heroLogo} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, isRTL && styles.rtl]}>
                {bag.restaurant}
              </Text>
              <Text style={[styles.heroArea, isRTL && styles.rtl]}>
                📍 {bag.area} · {bag.category}
              </Text>
            </View>
            <View
              style={[
                styles.qtyBadge,
                bag.quantity_remaining === 1 && styles.qtyBadgeUrgent,
              ]}
            >
              <Text
                style={[
                  styles.qtyText,
                  bag.quantity_remaining === 1 && styles.qtyTextUrgent,
                ]}
              >
                {bag.quantity_remaining === 1
                  ? t("lastOne")
                  : `${bag.quantity_remaining} ${t("left")}`}
              </Text>
            </View>
          </View>
        </ImageBackground>

        {/* Content */}
        <View style={styles.content}>
          {/* Title + category */}
          <View style={styles.titleSection}>
            <Text style={[styles.bagTitle, isRTL && styles.rtl]}>
              {bag.title}
            </Text>
            <View
              style={[styles.categoryPill, isRTL && { alignSelf: "flex-end" }]}
            >
              <Text style={styles.categoryPillText}>
                {bag.category === "Bakery"
                  ? "🥐"
                  : bag.category === "Restaurant"
                    ? "🍽️"
                    : "☕"}{" "}
                {bag.category}
              </Text>
            </View>
          </View>

          {/* Price card */}
          <View style={styles.priceCard}>
            <View style={styles.priceCol}>
              <Text style={[styles.priceLabel, isRTL && styles.rtl]}>
                {t("youPay")}
              </Text>
              <Text style={styles.priceMain}>
                JD {parseFloat(bag.price).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={[styles.priceLabel, isRTL && styles.rtl]}>
                {t("originalValue")}
              </Text>
              <Text style={styles.priceOriginal}>
                JD {parseFloat(bag.original_value).toFixed(2)}
              </Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceCol}>
              <Text style={[styles.priceLabel, isRTL && styles.rtl]}>
                {t("youSave")}
              </Text>
              <Text style={styles.priceSavings}>JD {savings}</Text>
            </View>
          </View>

          {/* Pickup window */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>
              {t("pickupWindow")}
            </Text>
            <View style={styles.pickupCard}>
              <View style={styles.pickupTimeBlock}>
                <Text style={[styles.pickupLabel, isRTL && styles.rtl]}>
                  {t("from")}
                </Text>
                <Text style={styles.pickupTime}>{bag.pickup_start}</Text>
              </View>
              <View style={styles.pickupArrowBlock}>
                <View style={styles.pickupArrowLine} />
                <View style={styles.pickupArrowDot} />
              </View>
              <View style={styles.pickupTimeBlock}>
                <Text style={[styles.pickupLabel, isRTL && styles.rtl]}>
                  {t("until")}
                </Text>
                <Text style={styles.pickupTime}>{bag.pickup_end}</Text>
              </View>
              <View style={styles.todayPill}>
                <Text style={styles.todayText}>📅 {t("todayOnly")}</Text>
              </View>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>
              {t("aboutBag")}
            </Text>
            <View style={styles.aboutCard}>
              <Text style={[styles.aboutText, isRTL && styles.rtl]}>
                {isRTL
                  ? `كيس مفاجئ من ${bag.restaurant}! تتغير المحتويات يومياً بناءً على ما هو متاح عند الإغلاق. طعام عالي الجودة كان سيُهدر — بجزء من السعر.`
                  : `A surprise bag from ${bag.restaurant}! Contents vary daily based on what's freshly available at closing time. Quality food that would otherwise go to waste — at a fraction of the price.`}
              </Text>
            </View>
          </View>

          {/* What to expect */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>
              {t("whatToExpect")}
            </Text>
            <View style={styles.expectGrid}>
              {expectItems.map((item, i) => (
                <View key={i} style={styles.expectItem}>
                  <Text style={styles.expectIcon}>{item.icon}</Text>
                  <Text style={[styles.expectText, isRTL && styles.rtl]}>
                    {t(item.key)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, isRTL && styles.rtlRow]}>
        <View style={styles.footerPrices}>
          <Text style={[styles.footerLabel, isRTL && styles.rtl]}>
            {t("total")}
          </Text>
          <Text style={styles.footerPrice}>
            JD {parseFloat(bag.price).toFixed(2)}
          </Text>
          <Text style={styles.footerSave}>
            {t("youSave")} JD {savings}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.reserveBtn,
            (bag.quantity_remaining === 0 || reserved) &&
              styles.reserveBtnDisabled,
          ]}
          onPress={handleReserve}
          disabled={bag.quantity_remaining === 0 || reserved || reserving}
          activeOpacity={0.88}
        >
          {reserving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.reserveBtnText}>
              {reserved
                ? t("reserved")
                : bag.quantity_remaining === 0
                  ? t("soldOut")
                  : t("reserveBag")}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#F0F7F0" },
  scroll: { flex: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Hero
  hero: { height: 340, justifyContent: "space-between" },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
  },
  heroTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  backArrow: { fontSize: 20, color: "#1B5E20", fontWeight: "800" },
  discountPill: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  discountText: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heroLogo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  heroInfo: { flex: 1 },
  heroName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    marginBottom: 2,
  },
  heroArea: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  qtyBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qtyBadgeUrgent: { backgroundColor: "#FFEBEE" },
  qtyText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  qtyTextUrgent: { color: "#C62828" },

  // Content
  content: { padding: 20 },
  titleSection: { marginBottom: 16 },
  bagTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
  },
  categoryPill: {
    alignSelf: "flex-start",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  categoryPillText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },

  // Price card
  priceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  priceCol: { flex: 1, alignItems: "center" },
  priceDivider: { width: 1, height: 44, backgroundColor: "#E8F5E9" },
  priceLabel: {
    fontSize: 11,
    color: "#888780",
    marginBottom: 6,
    fontWeight: "500",
  },
  priceMain: { fontSize: 22, fontWeight: "800", color: "#2E7D32" },
  priceOriginal: {
    fontSize: 16,
    fontWeight: "600",
    color: "#B4B2A9",
    textDecorationLine: "line-through",
  },
  priceSavings: { fontSize: 20, fontWeight: "800", color: "#C62828" },

  // Sections
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 10,
  },

  // Pickup
  pickupCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  pickupTimeBlock: { flex: 1, alignItems: "center" },
  pickupLabel: { fontSize: 11, color: "#888780", marginBottom: 6 },
  pickupTime: { fontSize: 24, fontWeight: "800", color: "#1B5E20" },
  pickupArrowBlock: {
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupArrowLine: { width: 30, height: 2, backgroundColor: "#C8E6C9" },
  pickupArrowDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2E7D32",
    marginTop: -5,
    alignSelf: "flex-end",
  },
  todayPill: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },

  // About
  aboutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  aboutText: { fontSize: 14, color: "#5F5E5A", lineHeight: 22 },

  // Expect grid
  expectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  expectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    minWidth: "45%",
    flex: 1,
  },
  expectIcon: { fontSize: 18 },
  expectText: { fontSize: 13, color: "#2C2C2A", fontWeight: "500", flex: 1 },

  // Footer
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#E8F5E9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
  },
  footerPrices: { gap: 2 },
  footerLabel: { fontSize: 11, color: "#888780" },
  footerPrice: { fontSize: 28, fontWeight: "800", color: "#2E7D32" },
  footerSave: { fontSize: 12, color: "#C62828", fontWeight: "600" },
  reserveBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    minWidth: 160,
    alignItems: "center",
  },
  reserveBtnDisabled: { backgroundColor: "#B4B2A9", shadowOpacity: 0 },
  reserveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
