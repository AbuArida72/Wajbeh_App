import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function BagDetailScreen({ route, navigation }) {
  const { bag } = route.params;
  const discount = Math.round((1 - bag.price / bag.original_value) * 100);
  const savings = (bag.original_value - bag.price).toFixed(2);
  const [checking, setChecking] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  // Step 1: tap Reserve — check for payment method first
  const handleReserveTap = async () => {
    setChecking(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        Alert.alert(t("signIn"), t("signInSubtitle"));
        return;
      }
      const { data: pm } = await supabase
        .from("payment_methods")
        .select("*")
        .eq("user_id", authData.user.id)
        .single();

      if (!pm) {
        Alert.alert(t("noPaymentTitle"), t("noPaymentMessage"), [
          {
            text: t("goToProfile"),
            onPress: () =>
              navigation.reset({
                index: 0,
                routes: [{ name: "Tabs", params: { screen: "Profile" } }],
              }),
          },
          { text: t("notNow"), style: "cancel" },
        ]);
        return;
      }

      setPaymentMethod(pm);
      setConfirmModal(true);
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setChecking(false);
    }
  };

  // Step 2: user confirmed in modal — do the actual reservation
  const handleConfirmReserve = async () => {
    setReserving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc("reserve_bag", {
        p_bag_id: bag.id,
        p_user_id: authData.user.id,
      });
      if (error) throw error;
      if (data.success) {
        setReserved(true);
        setConfirmModal(false);
        navigation.navigate("Confirmation", {
          pickupCode: data.pickup_code,
          bag,
        });
      } else {
        Alert.alert("Could Not Reserve", data.error || "Could not reserve bag");
      }
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setReserving(false);
    }
  };

  const expectItems = [
    { iconName: "checkmark-circle-outline", key: "freshFood" },
    { iconName: "checkmark-circle-outline", key: "surpriseContents" },
    { iconName: "checkmark-circle-outline", key: "showApp" },
    { iconName: "checkmark-circle-outline", key: "fightWaste" },
    { iconName: "checkmark-circle-outline", key: "supportLocal" },
    { iconName: "close-circle-outline", key: "noRefunds" },
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
              <Ionicons name="arrow-back" size={20} color="#0F0F0F" />
            </TouchableOpacity>
            <View style={styles.discountPill}>
              <Text style={styles.discountText}>-{discount}%</Text>
            </View>
          </SafeAreaView>

          {/* Restaurant info overlay */}
          <View style={[styles.heroBottom, isRTL && styles.rtlRow]}>
            <Image source={{ uri: bag.logo }} style={styles.heroLogo} />
            <View style={styles.heroInfo}>
              <Text style={[styles.heroName, isRTL && styles.rtl]}>
                {bag.restaurant}
              </Text>
              <View style={[styles.heroAreaRow, isRTL && styles.rtlRow]}>
                <Ionicons name="location-outline" size={12} color="rgba(255,255,255,0.8)" />
                <Text style={[styles.heroArea, isRTL && styles.rtl]}>
                  {bag.area} · {bag.category}
                </Text>
              </View>
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
              <Text style={styles.categoryPillText}>{bag.category}</Text>
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
            <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>
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
                <Ionicons name="calendar-outline" size={12} color="#2E7D32" />
                <Text style={styles.todayText}>{t("todayOnly")}</Text>
              </View>
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>
              {t("aboutBag")}
            </Text>
            <View style={styles.aboutCard}>
              <Text style={[styles.aboutText, isRTL && styles.rtl]}>
                {t("aboutBagDesc", { restaurant: bag.restaurant })}
              </Text>
            </View>
          </View>

          {/* Possible Contents */}
          {bag.possible_contents && bag.possible_contents.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>
                {t("possibleContents")}
              </Text>
              <View style={styles.contentsCard}>
                <View style={styles.contentTagsRow}>
                  {bag.possible_contents.map((key, i) => (
                    <View key={i} style={styles.contentTag}>
                      <Text style={styles.contentTagText}>{t(key)}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.disclaimerBanner}>
                  <Ionicons name="information-circle-outline" size={15} color="#F57F17" />
                  <Text style={[styles.disclaimerText, isRTL && styles.rtl]}>
                    {t("bagDisclaimerText")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Bag is random disclaimer — shown when no contents selected too */}
          {(!bag.possible_contents || bag.possible_contents.length === 0) && (
            <View style={styles.section}>
              <View style={styles.disclaimerCardStandalone}>
                <Ionicons name="information-circle-outline" size={18} color="#F57F17" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.disclaimerTitleText, isRTL && styles.rtl]}>
                    {t("bagDisclaimerTitle")}
                  </Text>
                  <Text style={[styles.disclaimerBodyText, isRTL && styles.rtl]}>
                    {t("bagDisclaimerText")}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* What to expect */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>
              {t("whatToExpect")}
            </Text>
            <View style={styles.expectGrid}>
              {expectItems.map((item, i) => {
                const isNo = item.iconName.includes("close");
                return (
                  <View key={i} style={[styles.expectItem, isNo && styles.expectItemNo]}>
                    <Ionicons
                      name={item.iconName}
                      size={18}
                      color={isNo ? "#ED4956" : "#2E7D32"}
                    />
                    <Text style={[styles.expectText, isNo && styles.expectTextNo, isRTL && styles.rtl]}>
                      {t(item.key)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          <View style={{ height: 20 }} />
        </View>
      </ScrollView>

      {/* Sticky footer */}
      <View style={[styles.footer, isRTL && styles.rtlRow, { paddingBottom: insets.bottom + 8 }]}>
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
            (bag.quantity_remaining === 0 || reserved) && styles.reserveBtnDisabled,
          ]}
          onPress={handleReserveTap}
          disabled={bag.quantity_remaining === 0 || reserved || checking}
          activeOpacity={0.88}
        >
          {checking ? (
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

      {/* Reservation confirmation modal */}
      <Modal
        visible={confirmModal}
        transparent
        animationType="slide"
        onRequestClose={() => setConfirmModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 16 }]}>
            {/* Handle */}
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isRTL && styles.rtl]}>
                {t("confirmReservation")}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setConfirmModal(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={18} color="#737373" />
              </TouchableOpacity>
            </View>

            {/* Order summary */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionLabel}>{t("orderSummaryLabel")}</Text>
              <View style={styles.summaryCard}>
                <View style={[styles.summaryRow, isRTL && styles.rtlRow]}>
                  <Text style={[styles.summaryLabel, isRTL && styles.rtl]}>{t("restaurant")}</Text>
                  <Text style={[styles.summaryValue, isRTL && styles.rtl]} numberOfLines={1}>{bag.restaurant}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={[styles.summaryRow, isRTL && styles.rtlRow]}>
                  <Text style={[styles.summaryLabel, isRTL && styles.rtl]}>{t("bag")}</Text>
                  <Text style={[styles.summaryValue, isRTL && styles.rtl]} numberOfLines={1}>{bag.title}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={[styles.summaryRow, isRTL && styles.rtlRow]}>
                  <Text style={[styles.summaryLabel, isRTL && styles.rtl]}>{t("from")} / {t("until")}</Text>
                  <Text style={[styles.summaryValue, isRTL && styles.rtl]}>{bag.pickup_start} – {bag.pickup_end}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={[styles.summaryRow, isRTL && styles.rtlRow]}>
                  <Text style={[styles.summaryLabel, isRTL && styles.rtl]}>{t("total")}</Text>
                  <Text style={styles.summaryTotal}>JD {parseFloat(bag.price).toFixed(2)}</Text>
                </View>
              </View>
            </View>

            {/* Payment method */}
            {paymentMethod && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionLabel}>{t("paymentLabel")}</Text>
                <View style={styles.cardRow}>
                  <View style={styles.cardIconBox}>
                    <Ionicons name="card-outline" size={20} color="#2E7D32" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardMasked, isRTL && styles.rtl]}>
                      {paymentMethod.card_number_masked}
                    </Text>
                    <Text style={[styles.cardMeta, isRTL && styles.rtl]}>
                      {paymentMethod.cardholder_name} · {paymentMethod.expiry_date}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.modalDisclaimer}>
              <Ionicons name="information-circle-outline" size={14} color="#F57F17" />
              <Text style={[styles.modalDisclaimerText, isRTL && styles.rtl]}>
                {t("bagDisclaimerText")}
              </Text>
            </View>

            {/* Actions */}
            <TouchableOpacity
              style={[styles.reserveModalBtn, reserving && { opacity: 0.7 }]}
              onPress={handleConfirmReserve}
              disabled={reserving}
              activeOpacity={0.88}
            >
              {reserving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.reserveModalBtnText}>{t("reserveAndPay")}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelModalBtn}
              onPress={() => setConfirmModal(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelModalBtnText}>{t("cancel")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Hero
  hero: { height: 300, justifyContent: "space-between" },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.3)",
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
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  discountPill: {
    backgroundColor: "#F57F17",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  discountText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  heroLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "#F0F0F0",
  },
  heroInfo: { flex: 1 },
  heroName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  heroAreaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  heroArea: { fontSize: 12, color: "rgba(255,255,255,0.8)" },
  qtyBadge: {
    backgroundColor: "rgba(255,255,255,0.9)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  qtyBadgeUrgent: { backgroundColor: "#FFEBEE" },
  qtyText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  qtyTextUrgent: { color: "#ED4956" },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 20 },
  titleSection: { marginBottom: 16, alignItems: "center" },
  bagTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F0F0F",
    marginBottom: 8,
    textAlign: "center",
  },
  categoryPill: {
    alignSelf: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  categoryPillText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },

  // Price card
  priceCard: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  priceCol: { flex: 1, alignItems: "center" },
  priceDivider: { width: 1, height: 44, backgroundColor: "#A5D6A7" },
  priceLabel: {
    fontSize: 11,
    color: "#4CAF50",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  priceMain: { fontSize: 20, fontWeight: "700", color: "#0F0F0F" },
  priceOriginal: {
    fontSize: 15,
    fontWeight: "500",
    color: "#B8B8B8",
    textDecorationLine: "line-through",
  },
  priceSavings: { fontSize: 20, fontWeight: "700", color: "#1B5E20" },

  // Sections
  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8B8B8",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 1,
    textAlign: "center",
  },

  // Pickup
  pickupCard: {
    backgroundColor: "#F1F8E9",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C5E1A5",
  },
  pickupTimeBlock: { flex: 1, alignItems: "center" },
  pickupLabel: { fontSize: 11, color: "#737373", marginBottom: 6, textAlign: "center" },
  pickupTime: { fontSize: 22, fontWeight: "700", color: "#1B5E20", textAlign: "center" },
  pickupArrowBlock: {
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupArrowLine: { width: 30, height: 1, backgroundColor: "#DBDBDB" },
  pickupArrowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#2E7D32",
    marginTop: -3.5,
    alignSelf: "flex-end",
  },
  todayPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F2F8F2",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  todayText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },

  // Possible contents
  contentsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    gap: 12,
  },
  contentTagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contentTag: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#A5D6A7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  contentTagText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  disclaimerBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  disclaimerText: { fontSize: 12, color: "#795548", lineHeight: 18, flex: 1 },
  disclaimerCardStandalone: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: "#FFF8E1",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  disclaimerTitleText: { fontSize: 13, fontWeight: "700", color: "#5D4037", marginBottom: 4 },
  disclaimerBodyText: { fontSize: 12, color: "#795548", lineHeight: 18 },

  // About
  aboutCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  aboutText: { fontSize: 14, color: "#737373", lineHeight: 22, textAlign: "center" },

  // Expect grid
  expectGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  expectItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F9FBE7",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DCEDC8",
    minWidth: "45%",
    flex: 1,
  },
  expectItemNo: {
    backgroundColor: "#FEF2F2",
    borderColor: "#FECACA",
  },
  expectText: { fontSize: 13, color: "#33691E", fontWeight: "500", flex: 1 },
  expectTextNo: { color: "#B71C1C" },

  // Confirmation modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DBDBDB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", color: "#0F0F0F" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  modalSection: { marginBottom: 16 },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B8B8B8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  summaryCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 14,
  },
  summaryDivider: { height: 1, backgroundColor: "#F0F0F0" },
  summaryLabel: { fontSize: 13, color: "#737373" },
  summaryValue: { fontSize: 13, fontWeight: "500", color: "#0F0F0F", maxWidth: "55%", textAlign: "right" },
  summaryTotal: { fontSize: 15, fontWeight: "700", color: "#2E7D32" },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F9FBF9",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
    padding: 14,
  },
  cardIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  cardMasked: { fontSize: 14, fontWeight: "600", color: "#0F0F0F", letterSpacing: 1 },
  cardMeta: { fontSize: 12, color: "#737373", marginTop: 2 },
  modalDisclaimer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF8E1",
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  modalDisclaimerText: { fontSize: 11, color: "#795548", flex: 1, lineHeight: 16 },
  reserveModalBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginBottom: 10,
  },
  reserveModalBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  cancelModalBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },
  cancelModalBtnText: { color: "#737373", fontSize: 15, fontWeight: "500" },

  // Footer
  footer: {
    backgroundColor: "#FFFFFF",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#DBDBDB",
    gap: 16,
  },
  footerPrices: { gap: 1 },
  footerLabel: { fontSize: 11, color: "#737373" },
  footerPrice: { fontSize: 24, fontWeight: "700", color: "#0F0F0F", lineHeight: 28 },
  footerSave: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  reserveBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flex: 1,
    alignItems: "center",
  },
  reserveBtnDisabled: { backgroundColor: "#B8B8B8" },
  reserveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
