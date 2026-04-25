import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState } from "react";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { GlassPanel, GlassButton, Chip, T, WallpaperBackground, TextBackdrop, ar, InlineError, FONTS } from "../components/Glass";
import { haptic } from "../lib/haptics";

export default function BagDetailScreen({ route, navigation }) {
  const { bag } = route.params;
  const discount = Math.round((1 - bag.price / bag.original_value) * 100);
  const savings = (bag.original_value - bag.price).toFixed(2);
  const [checking, setChecking] = useState(false);
  const [reserving, setReserving] = useState(false);
  const [reserved, setReserved] = useState(false);
  const [confirmModal, setConfirmModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [inlineError, setInlineError] = useState("");
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  const handleReserveTap = async () => {
    setInlineError("");
    setChecking(true);
    haptic.light();
    try {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) {
        setInlineError(t("signInSubtitle"));
        haptic.error();
        return;
      }
      const { data: pm } = await supabase.from("payment_methods").select("*").eq("user_id", authData.user.id).single();
      if (!pm) {
        setInlineError(t("noPaymentMessage"));
        haptic.error();
        return;
      }
      setPaymentMethod(pm);
      setConfirmModal(true);
    } catch { setInlineError(t("errorGeneric")); haptic.error(); }
    finally { setChecking(false); }
  };

  const handleConfirmReserve = async () => {
    setInlineError("");
    setReserving(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const { data, error } = await supabase.rpc("reserve_bag", { p_bag_id: bag.id, p_user_id: authData.user.id });
      if (error) throw error;
      if (data.success) {
        haptic.success();
        setReserved(true);
        setConfirmModal(false);
        navigation.navigate("Confirmation", { pickupCode: data.pickup_code, bag });
      } else {
        setInlineError(data.error || t("bagUnavailable"));
        haptic.error();
      }
    } catch { setInlineError(t("errorGeneric")); haptic.error(); }
    finally { setReserving(false); }
  };

  const isSoldOut = bag.quantity_remaining === 0;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />


      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}
      >
        {/* Hero image */}
        <View style={styles.heroWrapper}>
          <Image source={{ uri: bag.image }} style={styles.heroImage} resizeMode="cover" />
          <LinearGradient
            colors={["transparent", "rgba(250,247,244,0.7)", "#FAF7F4"]}
            style={styles.heroFade}
          />
          <View style={[styles.heroTopBar, { paddingTop: insets.top + 10 }, isRTL && styles.rtlRow]}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.circleBtn}>
              <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color={T.ink} />
            </TouchableOpacity>
            <View style={styles.discountPill}>
              <Text style={styles.discountPillText}>−{discount}%</Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Restaurant row + title */}
          <TextBackdrop radius={18} padding={14} style={{ marginBottom: 12 }}>
            <View style={[styles.restaurantRow, isRTL && styles.rtlRow]}>
              <Image source={{ uri: bag.logo }} style={styles.logo} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.restaurantName, isRTL && styles.rtl, ar(isRTL, "semiBold")]}>{bag.restaurant}</Text>
                <Text style={[styles.restaurantMeta, isRTL && styles.rtl]}>{bag.area} · {bag.category}</Text>
              </View>
              {bag.quantity_remaining <= 2 && bag.quantity_remaining > 0 && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>
                    {bag.quantity_remaining === 1 ? t("lastOne") : `${bag.quantity_remaining} ${t("left")}`}
                  </Text>
                </View>
              )}
            </View>
            <Text style={[styles.bagTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>{bag.title}</Text>
          </TextBackdrop>

          {/* Price card */}
          <GlassPanel radius={18} padding={16} style={{ marginBottom: 12, backgroundColor: T.greenLight, borderColor: "rgba(21,128,61,0.22)" }}>
            <View style={[styles.priceRow, isRTL && styles.rtlRow]}>
              <View>
                <Text style={[styles.priceCap, isRTL && styles.rtl]}>{t("youPay")}</Text>
                <Text style={styles.priceMain}>JD {parseFloat(bag.price).toFixed(2)}</Text>
              </View>
              <View style={{ alignItems: isRTL ? "flex-start" : "flex-end", gap: 4 }}>
                <Text style={styles.priceOriginal}>JD {parseFloat(bag.original_value).toFixed(2)}</Text>
                <View style={styles.savePill}>
                  <Text style={styles.savePillText}>{t("youSave") || "Save"} JD {savings}</Text>
                </View>
              </View>
            </View>
          </GlassPanel>

          {/* Pickup window */}
          <GlassPanel radius={18} padding={16} style={{ marginBottom: 12 }}>
            <Text style={[styles.cardCap, isRTL && styles.rtl]}>{t("pickupWindow")}</Text>
            <View style={[styles.pickupRow, isRTL && styles.rtlRow]}>
              <View style={styles.pickupBlock}>
                <Text style={styles.pickupLabel}>{t("from")}</Text>
                <Text style={styles.pickupTime}>{bag.pickup_start}</Text>
              </View>
              <View style={styles.pickupArrow}>
                <Ionicons name={isRTL ? "arrow-back" : "arrow-forward"} size={14} color={T.muteStrong} />
              </View>
              <View style={styles.pickupBlock}>
                <Text style={styles.pickupLabel}>{t("until")}</Text>
                <Text style={styles.pickupTime}>{bag.pickup_end}</Text>
              </View>
              <View style={{ flex: 1 }} />
              <View style={styles.todayPill}>
                <Text style={styles.todayText}>{t("todayOnly")}</Text>
              </View>
            </View>
          </GlassPanel>

          {/* Serves */}
          {bag.serves_people > 0 && (
            <GlassPanel radius={18} padding={14} style={{ marginBottom: 12 }}>
              <View style={[styles.servesRow, isRTL && styles.rtlRow]}>
                <Ionicons name="people-outline" size={16} color={T.mute} />
                <Text style={[styles.servesText, isRTL && styles.rtl]}>
                  {bag.serves_people >= 6 ? t("serves6Plus")
                    : bag.serves_people === 1 ? t("serves1Person")
                    : t("servesNPeople", { count: bag.serves_people })}
                </Text>
              </View>
            </GlassPanel>
          )}

          {/* Possible contents */}
          {bag.possible_contents?.length > 0 && (
            <GlassPanel radius={18} padding={16} style={{ marginBottom: 12 }}>
              <View style={[styles.sectionCapRow, isRTL && styles.rtlRow]}>
                <Ionicons name="list-outline" size={14} color={T.green} />
                <Text style={[styles.sectionCap, isRTL && styles.rtl]}>{t("possibleContents")}</Text>
              </View>
              <View style={styles.tagRow}>
                {bag.possible_contents.map((key, i) => (
                  <Chip key={i} style={{ marginRight: 6, marginBottom: 6 }}>{t(key)}</Chip>
                ))}
              </View>
            </GlassPanel>
          )}

          {/* What to expect */}
          <GlassPanel radius={18} style={{ marginBottom: 16, overflow: "hidden" }}>
            <View style={[styles.sectionCapRow, { paddingHorizontal: 16, paddingTop: 14 }, isRTL && styles.rtlRow]}>
              <Ionicons name="information-circle-outline" size={14} color={T.muteStrong} />
              <Text style={[styles.sectionCap, isRTL && styles.rtl]}>· {t("whatToExpect")}</Text>
            </View>
            {["freshFood", "surpriseContents", "showApp", "fightWaste", "supportLocal"].map((key, i, arr) => (
              <View key={key} style={[styles.expectRow, i < arr.length - 1 && styles.expectDivider, isRTL && styles.rtlRow]}>
                <View style={styles.expectDot} />
                <Text style={[styles.expectText, isRTL && styles.rtl]}>{t(key)}</Text>
              </View>
            ))}
            <View style={[styles.expectRow, isRTL && styles.rtlRow]}>
              <View style={[styles.expectDot, { backgroundColor: T.urgent }]} />
              <Text style={[styles.expectText, { color: T.urgent }, isRTL && styles.rtl]}>{t("noRefunds")}</Text>
            </View>
          </GlassPanel>

          {/* Inline error */}
          <InlineError message={inlineError} onDismiss={() => setInlineError("")} />

          {/* Reserve section */}
          <GlassPanel radius={22} style={{ marginBottom: 8 }}>
            <View style={[styles.footerInner, isRTL && styles.rtlRow]}>
              <View style={{ paddingLeft: isRTL ? 0 : 6, paddingRight: isRTL ? 6 : 0 }}>
                <Text style={[styles.footerCap, isRTL && styles.rtl]}>{t("total")}</Text>
                <Text style={styles.footerPrice}>JD {parseFloat(bag.price).toFixed(2)}</Text>
              </View>
              <GlassButton
                primary
                onPress={handleReserveTap}
                loading={checking}
                disabled={isSoldOut || reserved || checking}
                style={{ width: 140 }}
              >
                {reserved ? t("reserved") : isSoldOut ? t("soldOut") : t("reserveBag")}
              </GlassButton>
            </View>
          </GlassPanel>
        </View>
      </ScrollView>

      {/* Confirm modal */}
      <Modal visible={confirmModal} transparent animationType="slide" onRequestClose={() => setConfirmModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { paddingBottom: insets.bottom + 20 }]}>
            <View style={styles.modalHandle} />

            <View style={[styles.modalHeader, isRTL && styles.rtlRow]}>
              <Text style={[styles.modalTitle, isRTL && styles.rtl]}>{t("confirmReservation")}</Text>
              <TouchableOpacity onPress={() => setConfirmModal(false)} style={styles.circleBtn}>
                <Ionicons name="close" size={16} color={T.ink} />
              </TouchableOpacity>
            </View>

            {/* Summary */}
            <GlassPanel radius={16} style={{ marginBottom: 12, overflow: "hidden" }}>
              {[
                [t("restaurant"), bag.restaurant],
                [t("bag"), bag.title],
                [`${t("from")} / ${t("until")}`, `${bag.pickup_start} – ${bag.pickup_end}`],
                [t("total"), `JD ${parseFloat(bag.price).toFixed(2)}`],
              ].map(([label, val], i, arr) => (
                <View key={i}>
                  <View style={[styles.summaryRow, isRTL && styles.rtlRow]}>
                    <Text style={[styles.summaryLabel, isRTL && styles.rtl]}>{label}</Text>
                    <Text style={[styles.summaryValue, i === arr.length - 1 && { color: T.accent, fontWeight: "800", fontSize: 15 }, isRTL && styles.rtl]} numberOfLines={1}>{val}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={styles.rowDivider} />}
                </View>
              ))}
            </GlassPanel>

            {/* Payment method */}
            {paymentMethod && (
              <GlassPanel radius={16} padding={14} style={{ flexDirection: isRTL ? "row-reverse" : "row", gap: 12, alignItems: "center", marginBottom: 16 }}>
                <View style={styles.cardIcon}>
                  <Ionicons name="card-outline" size={18} color={T.green} />
                </View>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: T.ink }}>{paymentMethod.card_number_masked}</Text>
                  <Text style={{ fontSize: 12, color: T.mute }}>{paymentMethod.cardholder_name} · {paymentMethod.expiry_date}</Text>
                </View>
              </GlassPanel>
            )}

            <InlineError message={inlineError} onDismiss={() => setInlineError("")} style={{ marginBottom: 12 }} />
            <GlassButton primary onPress={handleConfirmReserve} loading={reserving} disabled={reserving}>
              {t("reserveAndPay")}
            </GlassButton>
            <View style={{ height: 10 }} />
            <GlassButton onPress={() => { setConfirmModal(false); setInlineError(""); }}>
              {t("cancel")}
            </GlassButton>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  scroll: { flex: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Hero
  heroWrapper: { height: 300, position: "relative" },
  heroImage: { width: "100%", height: 300, backgroundColor: "rgba(15,23,42,0.06)" },
  heroFade: { position: "absolute", bottom: 0, left: 0, right: 0, height: 120 },
  heroTopBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16,
  },
  circleBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "rgba(15,23,42,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  discountPill: {
    backgroundColor: T.green, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 100,
  },
  discountPillText: { fontSize: 12, fontWeight: "800", color: "#fff" },

  // Content
  content: { paddingHorizontal: 18, paddingTop: 14 },
  restaurantRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(15,23,42,0.06)" },
  restaurantName: { fontSize: 13, fontWeight: "700", color: T.ink },
  restaurantMeta: { fontSize: 11, color: T.mute, marginTop: 1 },
  urgentBadge: { backgroundColor: "rgba(224,92,74,0.12)", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  urgentText: { fontSize: 11, fontWeight: "700", color: T.urgent },

  bagTitle: { fontSize: 28, fontWeight: "800", color: T.ink, letterSpacing: -0.8, lineHeight: 32, marginTop: 10, fontFamily: FONTS.bold },

  // Price
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  priceCap: { fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: T.muteStrong, fontWeight: "700", marginBottom: 4 },
  priceMain: { fontSize: 30, fontWeight: "800", color: T.accent, letterSpacing: -0.8 },
  priceOriginal: { fontSize: 12, color: T.muteStrong, textDecorationLine: "line-through" },
  savePill: { backgroundColor: "rgba(21,128,61,0.10)", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  savePillText: { fontSize: 11, fontWeight: "700", color: T.green },

  // Pickup
  cardCap: { fontSize: 9, letterSpacing: 1, textTransform: "uppercase", color: T.muteStrong, fontWeight: "700", marginBottom: 10 },
  pickupRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  pickupBlock: { gap: 2 },
  pickupLabel: { fontSize: 9, color: T.muteStrong, textTransform: "uppercase", letterSpacing: 0.5 },
  pickupTime: { fontSize: 22, fontWeight: "800", color: T.green, letterSpacing: -0.5 },
  pickupArrow: { opacity: 0.4 },
  todayPill: { backgroundColor: "rgba(21,128,61,0.10)", borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  todayText: { fontSize: 10, fontWeight: "700", color: T.green },

  // Serves
  servesRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  servesText: { fontSize: 13, color: T.mute },

  // Sections
  sectionCapRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 10 },
  sectionCap: { fontSize: 9, letterSpacing: 1.4, textTransform: "uppercase", color: T.muteStrong, fontWeight: "700" },
  expectRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  expectDivider: { borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.05)" },
  expectDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: T.greenBright, flexShrink: 0 },
  expectText: { fontSize: 13, color: T.ink, flex: 1, lineHeight: 19 },

  tagRow: { flexDirection: "row", flexWrap: "wrap" },

  // Reserve footer card
  footerInner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  footerCap: { fontSize: 9, color: T.muteStrong, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  footerPrice: { fontSize: 22, fontWeight: "800", color: T.accent, letterSpacing: -0.5 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modalSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 12, overflow: "hidden", backgroundColor: "#FFFFFF" },
  modalHandle: { width: 36, height: 4, backgroundColor: "rgba(15,23,42,0.12)", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: T.ink },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16 },
  summaryLabel: { fontSize: 13, color: T.mute },
  summaryValue: { fontSize: 13, fontWeight: "600", color: T.ink, maxWidth: "55%", textAlign: "right" },
  rowDivider: { height: 1, backgroundColor: "rgba(15,23,42,0.05)", marginHorizontal: 14 },
  cardIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(21,128,61,0.10)",
    alignItems: "center", justifyContent: "center",
  },
});
