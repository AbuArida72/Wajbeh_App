import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Platform,
} from "react-native";
import AppDialog, { useDialog } from "../components/AppDialog";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassPanel, Chip, T, WallpaperBackground, TextBackdrop, ar, SkeletonBox, FONTS } from "../components/Glass";
import { haptic } from "../lib/haptics";

const isPickupTimeActive = (pickupStart) => {
  if (!pickupStart) return false;
  const now = new Date();
  const [h, m] = pickupStart.slice(0, 5).split(":").map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  return now >= start;
};

const getEffectiveEndDateTime = (availableDate, pickupEnd) => {
  if (!availableDate || !pickupEnd) return null;
  const [h, m] = pickupEnd.slice(0, 5).split(":").map(Number);
  const [year, month, day] = availableDate.split("-").map(Number);
  const endDate = new Date(year, month - 1, day, h, m, 0, 0);
  if (h < 3 || (h === 3 && m === 0)) {
    endDate.setDate(endDate.getDate() + 1);
  }
  return endDate;
};

const isWindowExpiredForOrder = (order) => {
  const bag = order.bags;
  const restaurant = bag?.restaurants;
  const effectiveEnd = order.pickup_end ?? bag?.pickup_end ?? restaurant?.pickup_end;
  const availableDate = bag?.available_date;
  if (!effectiveEnd || !availableDate) return false;
  const endDateTime = getEffectiveEndDateTime(availableDate, effectiveEnd);
  if (!endDateTime) return false;
  return new Date() > endDateTime;
};

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("today");
  const pollingRef = useRef(null);
  const autoSwitchedRef = useRef(false);
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { dialogProps, alert: showAlert } = useDialog();

  useEffect(() => {
    fetchOrders();
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
      pollingRef.current = setInterval(() => {
        fetchOrders();
      }, 3000);
      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }, []),
  );

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data, error } = await supabase
      .from("orders")
      .select(`*, bags (title, image_url, price, pickup_start, pickup_end, available_date, restaurants (name, area, pickup_start, pickup_end))`)
      .eq("user_id", user.id)
      .gte("reserved_at", monthAgo.toISOString())
      .order("reserved_at", { ascending: false });

    if (!error && data) {
      setOrders(data);
      if (!autoSwitchedRef.current) {
        autoSwitchedRef.current = true;
        const hasActiveWindow = data.some((o) => !isWindowExpiredForOrder(o));
        if (!hasActiveWindow && data.length > 0) setActiveTab("history");
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  const todayOrders = orders.filter((o) => !isWindowExpiredForOrder(o));
  const historyOrders = orders.filter((o) => isWindowExpiredForOrder(o));

  const confirmPickup = async (orderId) => {
    haptic.medium();
    const { error } = await supabase
      .from("orders")
      .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) showAlert("Error", error.message);
    else { haptic.success(); fetchOrders(); }
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "reserved":  return { color: T.green,      label: t("statusReserved"),  icon: "time-outline" };
      case "arriving":  return { color: T.accent,     label: t("statusArriving"),  icon: "walk-outline" };
      case "picked_up": return { color: "#0D7A3E",    label: t("statusPickedUp"),  icon: "checkmark-circle-outline" };
      case "cancelled": return { color: T.urgent,     label: t("statusCancelled"), icon: "close-circle-outline" };
      default:          return { color: T.muteStrong, label: status,               icon: "ellipse-outline" };
    }
  };

  const displayOrders = activeTab === "today" ? todayOrders : historyOrders;

  const renderOrder = ({ item }) => {
    const bag = item.bags;
    const restaurant = bag?.restaurants;
    const isPast = item.status === "picked_up" || item.status === "cancelled";
    const effectiveStart = item.pickup_start ?? bag?.pickup_start ?? restaurant?.pickup_start;
    const effectiveEnd = item.pickup_end ?? bag?.pickup_end ?? restaurant?.pickup_end;
    const codeVisible = isPickupTimeActive(effectiveStart);
    const windowExpired = isWindowExpiredForOrder(item);
    const isIncomplete = windowExpired && item.status !== "picked_up" && item.status !== "cancelled";
    const config = isIncomplete
      ? { color: T.muteStrong, label: t("statusIncomplete") }
      : getStatusConfig(item.status);

    return (
      <GlassPanel radius={20} style={[styles.card, isPast && { opacity: 0.72 }]}>
        {/* Status accent bar */}
        <View style={[styles.accentBar, { backgroundColor: config.color, [isRTL ? "right" : "left"]: 0 }]} />

        {/* Top row */}
        <View style={[styles.cardTop, isRTL && styles.rtlRow]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.restaurantName, isRTL && styles.rtl, ar(isRTL, "medium")]} numberOfLines={1}>{restaurant?.name}</Text>
            <Text style={[styles.area, isRTL && styles.rtl]}>{restaurant?.area}</Text>
          </View>
          <View style={[
            styles.statusPill,
            { backgroundColor: config.color + "18", borderColor: config.color + "40" },
            item.status === "picked_up" && styles.statusPillFulfilled,
            item.status === "cancelled" && styles.statusPillCancelled,
          ]}>
            <Ionicons name={config.icon} size={11} color={config.color} style={{ marginRight: 4 }} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={[styles.bagTitle, isRTL && styles.rtl, isPast && { color: T.muteStrong }, ar(isRTL, "semiBold")]} numberOfLines={1}>{bag?.title}</Text>
        <View style={[styles.pickupRow, isRTL && styles.rtlRow]}>
          <Ionicons name="time-outline" size={12} color={T.muteStrong} />
          <Text style={[styles.pickupTime, isRTL && styles.rtl]}>
            {t("pickupToday")} {effectiveStart?.slice(0, 5)} – {effectiveEnd?.slice(0, 5)}
          </Text>
        </View>

        {/* Incomplete */}
        {isIncomplete && (
          <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
            <Ionicons name="alert-circle-outline" size={14} color={T.muteStrong} />
            <Text style={[styles.infoText, isRTL && styles.rtl]}>{t("incompletePickup")}</Text>
          </View>
        )}

        {/* Code + price for active orders */}
        {!isPast && !isIncomplete && (
          <View style={[styles.codeRow, isRTL && styles.rtlRow]}>
            {/* Code tile — hidden until pickup time */}
            <View style={styles.codeTile}>
              <Text style={styles.codeLabel}>{t("pickupCode")}</Text>
              {codeVisible && item.pickup_code ? (
                <Text style={styles.codeValue}>{item.pickup_code}</Text>
              ) : (
                <View style={{ alignItems: "center", gap: 4 }}>
                  <Ionicons name="lock-closed-outline" size={18} color={T.green} />
                  <Text style={styles.codeLockText}>{t("availableAt")} {effectiveStart?.slice(0, 5)}</Text>
                </View>
              )}
            </View>
            {/* Price tile — amber tint */}
            <View style={styles.priceTile}>
              <Text style={styles.priceTileLabel}>{t("paid")}</Text>
              <Text style={styles.priceValue}>JD {parseFloat(item.amount_paid).toFixed(2)}</Text>
            </View>
          </View>
        )}

        {/* Arriving → confirm button */}
        {item.status === "arriving" && !isIncomplete && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => confirmPickup(item.id)}
            activeOpacity={0.88}
          >
            <Text style={styles.confirmBtnText}>{t("confirmPickup")}</Text>
          </TouchableOpacity>
        )}

        {/* Reserved → show code hint */}
        {item.status === "reserved" && !isIncomplete && (
          <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
            <Ionicons name="phone-portrait-outline" size={13} color={T.muteStrong} />
            <Text style={[styles.infoText, isRTL && styles.rtl]}>{t("showCode")}</Text>
          </View>
        )}

        {/* Picked up → date + paid */}
        {item.status === "picked_up" && (
          <View style={[styles.fulfilledRow, isRTL && styles.rtlRow]}>
            <Text style={[styles.fulfilledText, isRTL && styles.rtl]}>
              {t("pickedUpOn")}{" "}
              {new Date(item.picked_up_at).toLocaleDateString("en-JO", {
                day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
              })}
            </Text>
            <Text style={styles.paidSmall}>JD {parseFloat(item.amount_paid).toFixed(2)}</Text>
          </View>
        )}

        <Text style={[styles.dateText, isRTL && styles.rtl]}>
          {t("reservedOn")}{" "}
          {new Date(item.reserved_at).toLocaleDateString("en-JO", {
            day: "numeric", month: "short", year: "numeric",
          })}
        </Text>
      </GlassPanel>
    );
  };

  if (loading) {
    return (
      <View style={styles.root}>

        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <SkeletonBox width={140} height={28} radius={8} style={{ marginBottom: 4 }} />
          <SkeletonBox width="100%" height={52} radius={100} style={{ marginTop: 10 }} />
          <SkeletonBox width="60%" height={36} radius={10} style={{ marginTop: 12 }} />
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 14, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <GlassPanel key={i} radius={20} style={{ padding: 16, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <SkeletonBox width={130} height={16} radius={6} />
                <SkeletonBox width={70} height={22} radius={100} />
              </View>
              <SkeletonBox width="90%" height={13} radius={6} />
              <SkeletonBox width={120} height={11} radius={6} />
              <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
                <SkeletonBox width="55%" height={56} radius={12} />
                <SkeletonBox width="40%" height={56} radius={12} />
              </View>
            </GlassPanel>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={[styles.headerTop, isRTL && styles.rtlRow]}>
          <Text style={[styles.headerTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>{t("myOrders")}</Text>
        </View>

        {/* Stats row */}
        <View style={[styles.statsRow, isRTL && styles.rtlRow]}>
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{todayOrders.length}</Text>
            <Text style={styles.statLabel}>{t("today")}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNum}>{historyOrders.length}</Text>
            <Text style={styles.statLabel}>{t("pastMonth")}</Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statNum}>
              JD {orders.reduce((s, o) => s + parseFloat(o.amount_paid || 0), 0).toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>{t("spent")}</Text>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, isRTL && styles.rtlRow]}>
          {[
            { id: "today", label: t("today"), count: todayOrders.length },
            { id: "history", label: t("pastMonth"), count: null },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
              activeOpacity={0.85}
            >
              <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                {tab.label}{tab.count > 0 ? ` · ${tab.count}` : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            tintColor={T.green}
          />
        }
        ListHeaderComponent={<View style={{ height: 14 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-handle-outline" size={44} color={T.muteStrong} />
            <Text style={[styles.emptyTitle, isRTL && styles.rtl]}>
              {activeTab === "today" ? t("noOrdersToday") : t("noOrdersPastMonth")}
            </Text>
            <Text style={[styles.emptySubtitle, isRTL && styles.rtl]}>
              {activeTab === "today" ? t("noOrdersTodaySub") : t("noOrdersPastMonthSub")}
            </Text>
            {activeTab === "today" && (
              <TouchableOpacity style={styles.browseBtn} onPress={() => navigation.navigate("Home")}>
                <Text style={styles.browseBtnText}>{t("browseBags")}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      <AppDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20, paddingBottom: 16, gap: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { fontSize: 30, fontWeight: "800", color: T.ink, letterSpacing: -0.8, fontFamily: FONTS.bold },
  countBadge: {
    backgroundColor: T.greenLight, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: "rgba(21,128,61,0.18)",
  },
  countBadgeText: { fontSize: 15, fontWeight: "700", color: T.green },

  statsRow: { flexDirection: "row", gap: 10 },
  statPill: {
    flex: 1, alignItems: "center",
    backgroundColor: T.bg,
    borderRadius: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: T.border,
  },
  statNum: { fontSize: 15, fontWeight: "700", color: T.ink, letterSpacing: -0.3 },
  statLabel: { fontSize: 9, color: T.mute, marginTop: 2, letterSpacing: 0.3 },

  tabRow: { flexDirection: "row", gap: 10 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 100,
    backgroundColor: T.bg,
    borderWidth: 1, borderColor: T.border,
  },
  tabActive: { backgroundColor: T.green, borderColor: T.green },
  tabText: { fontSize: 13, fontWeight: "600", color: T.mute },
  tabTextActive: { color: "#FFFFFF", fontWeight: "700" },

  list: { paddingHorizontal: 16 },

  // Order card
  card: { marginBottom: 14, overflow: "hidden" },
  accentBar: { position: "absolute", top: 0, bottom: 0, width: 3 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14, paddingStart: 18 },
  restaurantName: { fontSize: 15, fontWeight: "700", color: T.ink, marginBottom: 3 },
  area: { fontSize: 12, color: T.mute },
  statusPill: { flexDirection: "row", alignItems: "center", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100, borderWidth: 1, marginLeft: 10 },
  statusPillFulfilled: { backgroundColor: "rgba(13,122,62,0.12)", borderColor: "rgba(13,122,62,0.30)" },
  statusPillCancelled: { backgroundColor: "rgba(220,38,38,0.10)", borderColor: "rgba(220,38,38,0.30)" },
  statusText: { fontSize: 11, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)", marginHorizontal: 14 },
  bagTitle: { fontSize: 14, fontWeight: "600", color: T.ink, marginHorizontal: 18, marginTop: 10, marginBottom: 4 },
  pickupRow: { flexDirection: "row", alignItems: "center", gap: 4, marginHorizontal: 18, marginBottom: 10 },
  pickupTime: { fontSize: 12, color: T.mute },

  codeRow: { flexDirection: "row", gap: 10, marginHorizontal: 14, marginBottom: 10 },

  // Green code tile
  codeTile: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    backgroundColor: "rgba(21,128,61,0.08)",
    borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(21,128,61,0.18)",
  },
  codeLabel: { fontSize: 9, color: T.green, letterSpacing: 1, textTransform: "uppercase", fontWeight: "700", marginBottom: 6 },
  codeValue: { fontSize: 26, fontWeight: "800", color: T.green, letterSpacing: 5 },
  codeLockText: { fontSize: 10, color: T.green, textAlign: "center", opacity: 0.7 },

  // Amber price tile
  priceTile: {
    alignItems: "center", paddingVertical: 14, paddingHorizontal: 16, minWidth: 96,
    backgroundColor: "rgba(232,153,58,0.10)",
    borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(232,153,58,0.22)",
  },
  priceTileLabel: { fontSize: 9, color: T.accent, letterSpacing: 1, textTransform: "uppercase", fontWeight: "700", marginBottom: 6 },
  priceValue: { fontSize: 18, fontWeight: "800", color: T.accent },

  confirmBtn: {
    backgroundColor: T.green, marginHorizontal: 14, marginBottom: 10,
    borderRadius: 100, paddingVertical: 12, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  confirmBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  infoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginHorizontal: 14, marginBottom: 8, opacity: 0.8 },
  infoText: { fontSize: 11, color: T.mute, flex: 1 },

  fulfilledRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginHorizontal: 14, marginBottom: 8 },
  fulfilledText: { fontSize: 12, color: T.mute, flex: 1 },
  paidSmall: { fontSize: 14, fontWeight: "700", color: T.ink },

  dateText: { fontSize: 10, color: T.muteStrong, textAlign: "center", marginBottom: 12 },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 13, color: T.mute },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 12, marginTop: 48 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: T.ink, textAlign: "center" },
  emptySubtitle: { fontSize: 13, color: T.mute, textAlign: "center" },
  browseBtn: { backgroundColor: T.green, paddingHorizontal: 28, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  browseBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
