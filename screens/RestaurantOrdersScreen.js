import { useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  StatusBar,
} from "react-native";
import AppDialog, { useDialog } from "../components/AppDialog";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassPanel, T, WallpaperBackground, ar } from "../components/Glass";

export default function RestaurantOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const { dialogProps, alert: showAlert } = useDialog();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const [codeFocused, setCodeFocused] = useState(false);
  const codeInputRef = useRef(null);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) { setLoading(false); return; }
    setRestaurantId(restaurant.id);

    const { data } = await supabase
      .from("orders")
      .select(`*, bags (title, price, restaurant_id, restaurants (name))`)
      .in("status", ["reserved", "arriving", "picked_up"])
      .order("reserved_at", { ascending: false });

    const filtered = (data || []).filter((o) => o.bags?.restaurant_id === restaurant.id);
    setOrders(filtered);
    setLoading(false);
    setRefreshing(false);
  };

  const searchCode = async () => {
    if (code.length < 6) return;
    setSearching(true);
    setFoundOrder(null);
    const { data } = await supabase
      .from("orders")
      .select(`*, bags (title, price, restaurant_id, restaurants (name, area))`)
      .eq("pickup_code", code.toUpperCase())
      .eq("status", "reserved")
      .single();
    if (data && data.bags?.restaurant_id === restaurantId) {
      setFoundOrder(data);
    } else {
      showAlert(t("noReservationsTitle"), t("noReservationFound"));
    }
    setSearching(false);
  };

  const confirmArrival = async (orderId) => {
    setConfirming(true);
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "arriving" })
      .eq("id", orderId)
      .select();
    if (error) {
      showAlert("Error", error.message);
    } else if (!data || data.length === 0) {
      showAlert("Error", t("updateOrderError"));
    } else {
      setFoundOrder(null);
      setCode("");
      fetchOrders();
      showAlert(t("confirmCustomerArrival"), t("confirmArrivalMsg"));
    }
    setConfirming(false);
  };

  const activeOrders = orders.filter((o) => o.status === "reserved" || o.status === "arriving");
  const fulfilledOrders = orders.filter((o) => o.status === "picked_up");
  const displayOrders = activeTab === "active" ? activeOrders : fulfilledOrders;
  const totalRevenue = orders
    .filter((o) => o.status === "picked_up")
    .reduce((s, o) => s + parseFloat(o.bags?.price || 0), 0);

  const getStatusConfig = (status) => {
    switch (status) {
      case "reserved":   return { label: t("pendingLabel"),      color: T.green,  bg: "rgba(21,128,61,0.08)",  border: "rgba(21,128,61,0.18)" };
      case "arriving":   return { label: t("pendingPickupConf"), color: T.accent, bg: "rgba(232,153,58,0.10)", border: "rgba(232,153,58,0.22)" };
      case "picked_up":  return { label: t("fulfilledLabel"),    color: T.muteStrong, bg: "rgba(15,23,42,0.05)", border: "rgba(15,23,42,0.08)" };
      default:           return { label: status,                 color: T.muteStrong, bg: "rgba(15,23,42,0.05)", border: "rgba(15,23,42,0.08)" };
    }
  };

  const renderOrder = ({ item }) => {
    const config = getStatusConfig(item.status);
    const isFulfilled = item.status === "picked_up";
    return (
      <GlassPanel radius={16} style={[styles.orderCard, isFulfilled && { opacity: 0.72 }]}>
        {/* Accent bar — flips to right in RTL */}
        <View style={[styles.accentBar, { backgroundColor: config.color, [isRTL ? "right" : "left"]: 0 }]} />
        <View style={styles.orderTop}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.orderBagTitle, isFulfilled && { color: T.mute }]} numberOfLines={1}>
              {item.bags?.title}
            </Text>
            <View style={styles.orderTimeRow}>
              <Ionicons name="time-outline" size={12} color={T.muteStrong} />
              <Text style={styles.orderDate}>
                {new Date(item.reserved_at).toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit" })}
              </Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg, borderColor: config.border }]}>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <View style={styles.rowDivider} />
        <View style={styles.orderBottom}>
          <Text style={styles.orderPrice}>JD {parseFloat(item.bags?.price || 0).toFixed(2)}</Text>
          {item.status === "arriving" && (
            <View style={[styles.awaitingBadge, { backgroundColor: "rgba(232,153,58,0.10)", borderColor: "rgba(232,153,58,0.22)" }]}>
              <Text style={[styles.awaitingText, { color: T.accent }]}>{t("awaitingConfirmation")}</Text>
            </View>
          )}
          {item.status === "picked_up" && (
            <View style={styles.fulfilledBadge}>
              <Ionicons name="checkmark" size={12} color={T.green} />
              <Text style={[styles.fulfilledBadgeText, { color: T.green }]}>{t("completeLabel")}</Text>
            </View>
          )}
        </View>
      </GlassPanel>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />


      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchOrders(); }}
            tintColor={T.green}
          />
        }
        ListHeaderComponent={
          <View>
            {/* ── Verify Code section ── */}
            <View style={[styles.scanSection, { paddingTop: insets.top + 16 }]}>
              <Text style={[styles.scanTitle, ar(isRTL, "bold")]}>{t("verifyPickupTitle")}</Text>
              <Text style={styles.scanSubtitle}>{t("enterCode")}</Text>

              {/* Code boxes — dark ink on glass */}
              <TouchableOpacity
                style={styles.codeInputRow}
                onPress={() => codeInputRef.current?.focus()}
                activeOpacity={1}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => {
                  const isFilled = !!code[i];
                  const isActive = codeFocused && i === Math.min(code.length, 5);
                  return (
                    <View key={i} style={[
                      styles.codeBox,
                      isFilled && styles.codeBoxFilled,
                      isActive && styles.codeBoxActive,
                    ]}>
                      <Text style={[styles.codeBoxChar, isFilled && styles.codeBoxCharFilled]}>
                        {code[i] || ""}
                      </Text>
                    </View>
                  );
                })}
              </TouchableOpacity>

              <TextInput
                ref={codeInputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoCapitalize="characters"
                onFocus={() => setCodeFocused(true)}
                onBlur={() => setCodeFocused(false)}
              />

              {/* Verify button */}
              <TouchableOpacity
                style={[styles.checkBtn, (code.length < 6 || searching) && styles.checkBtnDisabled]}
                onPress={searchCode}
                disabled={code.length < 6 || searching}
                activeOpacity={0.88}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="search-outline" size={16} color="#fff" />
                    <Text style={styles.checkBtnText}>{t("verifyCodeBtn")}</Text>
                  </>
                )}
              </TouchableOpacity>

              {code.length > 0 && (
                <TouchableOpacity style={styles.clearCodeBtn} onPress={() => { setCode(""); setFoundOrder(null); }}>
                  <Text style={styles.clearCodeText}>{t("clearBtn")}</Text>
                </TouchableOpacity>
              )}

              {/* Found order card */}
              {foundOrder && (
                <GlassPanel radius={16} style={{ marginTop: 16, overflow: "hidden" }}>
                  {/* Green header */}
                  <View style={styles.foundHeader}>
                    <Ionicons name="checkmark-circle" size={20} color={T.green} />
                    <Text style={styles.foundHeaderText}>{t("validResFound")}</Text>
                  </View>
                  <View style={styles.foundBody}>
                    {[
                      [t("bagLabel"), foundOrder.bags?.title],
                      [t("amountLabel"), `JD ${parseFloat(foundOrder.bags?.price || 0).toFixed(2)}`],
                      [t("reservedAtLabel"), new Date(foundOrder.reserved_at).toLocaleTimeString("en-JO", { hour: "2-digit", minute: "2-digit" })],
                    ].map(([label, val], i, arr) => (
                      <View key={i}>
                        <View style={styles.foundRow}>
                          <Text style={styles.foundLabel}>{label}</Text>
                          <Text style={[styles.foundValue, i === 1 && styles.foundValueAccent]}>{val}</Text>
                        </View>
                        {i < arr.length - 1 && <View style={styles.foundDivider} />}
                      </View>
                    ))}
                  </View>
                  <TouchableOpacity
                    style={[styles.confirmBtn, confirming && { opacity: 0.6 }]}
                    onPress={() => confirmArrival(foundOrder.id)}
                    disabled={confirming}
                    activeOpacity={0.88}
                  >
                    {confirming ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                        <Text style={styles.confirmBtnText}>{t("confirmCustomerArrival")}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </GlassPanel>
              )}
            </View>

            {/* ── Stats strip ── */}
            <GlassPanel radius={100} padding={10} style={{ marginHorizontal: 16, marginBottom: 12 }}>
              <View style={{ flexDirection: "row" }}>
                {[
                  { num: activeOrders.length,            label: t("activeLabel") },
                  { num: fulfilledOrders.length,          label: t("fulfilledLabel") },
                  { num: `JD ${totalRevenue.toFixed(0)}`, label: t("earnedLabel") },
                ].map((s, i) => (
                  <View key={i} style={{ flex: 1, flexDirection: "row", alignItems: "center" }}>
                    {i > 0 && <View style={styles.statDivider} />}
                    <View style={styles.statItem}>
                      <Text style={styles.statNum}>{s.num}</Text>
                      <Text style={styles.statLabel}>{s.label}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </GlassPanel>

            {/* ── Tabs ── */}
            <View style={styles.tabRow}>
              {[
                { id: "active",    label: `${t("activeLabel")} (${activeOrders.length})` },
                { id: "fulfilled", label: `${t("fulfilledLabel")} (${fulfilledOrders.length})` },
              ].map((tab) => (
                <TouchableOpacity
                  key={tab.id}
                  style={[styles.tab, activeTab === tab.id && styles.tabActive]}
                  onPress={() => setActiveTab(tab.id)}
                >
                  <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={T.green} size="large" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons
                name={activeTab === "active" ? "calendar-outline" : "checkmark-circle-outline"}
                size={40}
                color={T.muteStrong}
              />
              <Text style={[styles.emptyTitle, ar(isRTL, "bold")]}>
                {activeTab === "active" ? t("noActiveRes") : t("noFulfilled")}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "active" ? t("noReservationsSub") : t("noFulfilledSub")}
              </Text>
            </View>
          )
        }
      />
      <AppDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: T.bg },

  // ── Scan section ──
  scanSection: {
    paddingHorizontal: 20, paddingBottom: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  scanTitle: { fontSize: 22, fontWeight: "800", color: T.ink, marginBottom: 4, textAlign: "center", letterSpacing: -0.5 },
  scanSubtitle: { fontSize: 13, color: T.mute, marginBottom: 20, textAlign: "center" },

  // Code boxes — glass look, dark text on light background
  codeInputRow: { flexDirection: "row", gap: 8, justifyContent: "center", marginBottom: 16 },
  codeBox: {
    width: 44, height: 56, borderRadius: 12,
    backgroundColor: T.bg,
    borderWidth: 1.5, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  codeBoxFilled: {
    backgroundColor: "rgba(21,128,61,0.08)",
    borderColor: "rgba(21,128,61,0.45)",
  },
  codeBoxActive: {
    borderColor: T.green,
    borderWidth: 2.5,
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  codeBoxChar: { fontSize: 22, fontWeight: "700", color: T.muteStrong },
  codeBoxCharFilled: { color: T.green },
  hiddenInput: { position: "absolute", opacity: 0, width: 1, height: 1 },

  // Verify button — solid green, prominent
  checkBtn: {
    backgroundColor: T.green,
    borderRadius: 100,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "rgba(30,58,33,0.40)",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 14,
    elevation: 4,
  },
  checkBtnDisabled: { opacity: 0.45 },
  checkBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  clearCodeBtn: { alignItems: "center", marginTop: 12 },
  clearCodeText: { color: T.mute, fontSize: 13, fontWeight: "600" },

  // Found order card internals
  foundHeader: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(21,128,61,0.08)",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: "rgba(21,128,61,0.10)",
  },
  foundHeaderText: { fontSize: 14, fontWeight: "700", color: T.green },
  foundBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },
  foundRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  foundDivider: { height: 1, backgroundColor: "rgba(15,23,42,0.05)" },
  foundLabel: { fontSize: 13, color: T.mute },
  foundValue: { fontSize: 13, fontWeight: "600", color: T.ink },
  foundValueAccent: { fontSize: 17, fontWeight: "800", color: T.accent },
  confirmBtn: {
    backgroundColor: T.green,
    margin: 14, marginTop: 10,
    borderRadius: 100,
    paddingVertical: 14,
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
  },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Stats strip
  statsRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 12 },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 15, fontWeight: "700", color: T.green, letterSpacing: -0.3, marginBottom: 2 },
  statLabel: { fontSize: 9, color: T.mute, letterSpacing: 0.3 },
  statDivider: { width: 1, backgroundColor: "rgba(15,23,42,0.06)", marginHorizontal: 4, height: 28, alignSelf: "center" },

  // Tabs
  tabRow: { flexDirection: "row", marginHorizontal: 16, marginBottom: 14, gap: 10 },
  tab: {
    flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 100,
    backgroundColor: "rgba(26,26,26,0.04)",
    borderWidth: 1, borderColor: "rgba(26,26,26,0.10)",
  },
  tabActive: { backgroundColor: "rgba(21,128,61,0.85)", borderColor: "rgba(21,128,61,0.55)" },
  tabText: { fontSize: 13, fontWeight: "600", color: T.mute },
  tabTextActive: { color: "#fff", fontWeight: "700" },

  // Order cards
  list: { paddingHorizontal: 16, paddingTop: 0 },
  orderCard: { marginBottom: 12, overflow: "hidden" },
  accentBar: { position: "absolute", top: 0, bottom: 0, width: 3 },
  orderTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 14, paddingStart: 18 },
  orderBagTitle: { fontSize: 14, fontWeight: "700", color: T.ink, marginBottom: 4 },
  orderTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderDate: { fontSize: 12, color: T.mute },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1, marginLeft: 10 },
  statusText: { fontSize: 11, fontWeight: "700" },
  rowDivider: { height: 1, backgroundColor: "rgba(15,23,42,0.05)", marginHorizontal: 14 },
  orderBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 18, paddingVertical: 12 },
  orderPrice: { fontSize: 17, fontWeight: "800", color: T.accent },
  awaitingBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100, borderWidth: 1 },
  awaitingText: { fontSize: 11, fontWeight: "600" },
  fulfilledBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(21,128,61,0.08)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },
  fulfilledBadgeText: { fontSize: 11, fontWeight: "600" },

  // Empty & loading
  loadingContainer: { paddingTop: 48, alignItems: "center" },
  emptyContainer: { alignItems: "center", paddingTop: 48, paddingHorizontal: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: T.ink, marginTop: 8, textAlign: "center" },
  emptySubtitle: { fontSize: 13, color: T.mute, textAlign: "center", lineHeight: 20 },
});
