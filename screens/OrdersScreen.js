import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const isPickupTimeActive = (pickupStart) => {
  if (!pickupStart) return false;
  const now = new Date();
  const [h, m] = pickupStart.slice(0, 5).split(":").map(Number);
  const start = new Date();
  start.setHours(h, m, 0, 0);
  return now >= start;
};

// Times 00:00–03:00 wrap to the next calendar day (overnight bags)
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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const { data, error } = await supabase
      .from("orders")
      .select(
        `*, bags (title, image_url, price, pickup_start, pickup_end, available_date, restaurants (name, area, pickup_start, pickup_end))`,
      )
      .eq("user_id", user.id)
      .gte("reserved_at", monthAgo.toISOString())
      .order("reserved_at", { ascending: false });

    if (error) console.log("OrdersScreen fetchOrders error:", error.message);

    if (!error && data) {
      setOrders(data);
      // Auto-switch only once on first load — never override a manual tab selection
      if (!autoSwitchedRef.current) {
        autoSwitchedRef.current = true;
        const hasActiveWindow = data.some((o) => !isWindowExpiredForOrder(o));
        if (!hasActiveWindow && data.length > 0) setActiveTab("history");
      }
    }
    setLoading(false);
    setRefreshing(false);
  };

  // Today tab = pickup window still active; Past tab = window has expired
  const todayOrders = orders.filter((o) => !isWindowExpiredForOrder(o));
  const historyOrders = orders.filter((o) => isWindowExpiredForOrder(o));

  const confirmPickup = async (orderId) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) Alert.alert("Error", error.message);
    else fetchOrders();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "reserved":
        return {
          color: "#2E7D32",
          bg: "#F2F8F2",
          label: t("statusReserved"),
        };
      case "arriving":
        return {
          color: "#E65100",
          bg: "#FFF3E0",
          label: t("statusArriving"),
        };
      case "picked_up":
        return {
          color: "#737373",
          bg: "#F0F0F0",
          label: t("statusPickedUp"),
        };
      case "cancelled":
        return {
          color: "#ED4956",
          bg: "#FEF2F2",
          label: t("statusCancelled"),
        };
      default:
        return {
          color: "#737373",
          bg: "#F5F5F5",
          label: status,
        };
    }
  };

  const displayOrders = activeTab === "today" ? todayOrders : historyOrders;

  const renderOrder = ({ item }) => {
    const bag = item.bags;
    const restaurant = bag?.restaurants;
    const isPast = item.status === "picked_up" || item.status === "cancelled";
    // Effective pickup time: order snapshot → bag override → restaurant default
    const effectiveStart =
      item.pickup_start ?? bag?.pickup_start ?? restaurant?.pickup_start;
    const effectiveEnd =
      item.pickup_end ?? bag?.pickup_end ?? restaurant?.pickup_end;
    const codeVisible = isPickupTimeActive(effectiveStart);
    const windowExpired = isWindowExpiredForOrder(item);
    // Incomplete = pickup window passed and not yet picked up
    const isIncomplete =
      windowExpired &&
      item.status !== "picked_up" &&
      item.status !== "cancelled";
    const config = isIncomplete
      ? { color: "#B8B8B8", bg: "#F5F5F5", label: t("statusIncomplete") }
      : getStatusConfig(item.status);

    return (
      <View style={[styles.card, isPast && styles.cardPast]}>
        {/* Top row */}
        <View style={[styles.cardTop, isRTL && styles.rtlRow]}>
          <View style={styles.cardTopLeft}>
            <Text
              style={[
                styles.restaurantName,
                isRTL && styles.rtl,
                isPast && styles.textMuted,
              ]}
            >
              {restaurant?.name}
            </Text>
            <Text style={[styles.area, isRTL && styles.rtl]}>
              {restaurant?.area}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Bag info */}
        <Text
          style={[
            styles.bagTitle,
            isRTL && styles.rtl,
            isPast && styles.textMuted,
          ]}
        >
          {bag?.title}
        </Text>
        <View style={[styles.pickupRow, isRTL && styles.rtlRow]}>
          <Ionicons name="time-outline" size={12} color="#B8B8B8" />
          <Text style={[styles.pickupTime, isRTL && styles.rtl]}>
            {t("pickupToday")} {effectiveStart?.slice(0, 5)} –{" "}
            {effectiveEnd?.slice(0, 5)}
          </Text>
        </View>

        {/* Incomplete pickup notice */}
        {isIncomplete && (
          <>
            <View style={styles.incompleteBox}>
              <Ionicons name="alert-circle-outline" size={15} color="#B8B8B8" />
              <Text style={[styles.incompleteText, isRTL && styles.rtl]}>
                {t("incompletePickup")}
              </Text>
            </View>
            <View style={[styles.fulfilledRow, isRTL && styles.rtlRow]}>
              <View style={styles.paidSmall}>
                <Text style={styles.paidSmallLabel}>{t("paid")}</Text>
                <Text style={styles.paidSmallValue}>
                  JD {parseFloat(item.amount_paid).toFixed(2)}
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Code + price — active orders that are not incomplete */}
        {!isPast && !isIncomplete && (
          <View style={[styles.codeRow, isRTL && styles.rtlRow]}>
            <View style={[styles.codeCard, !codeVisible && styles.codeCardLocked]}>
              <Text style={styles.codeLabel}>{t("pickupCode")}</Text>
              {codeVisible && item.pickup_code ? (
                <Text style={styles.codeValue}>{item.pickup_code}</Text>
              ) : (
                <View style={styles.codeLockContent}>
                  <Ionicons name="lock-closed-outline" size={20} color="#B8B8B8" />
                  <Text style={styles.codeLockText}>
                    {t("availableAt")} {effectiveStart?.slice(0, 5)}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>{t("paid")}</Text>
              <Text style={styles.priceValue}>
                JD {parseFloat(item.amount_paid).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Status-based actions — only when not incomplete */}
        {item.status === "reserved" && !isIncomplete && (
          <View style={styles.infoBox}>
            <Ionicons name="phone-portrait-outline" size={14} color="#737373" />
            <Text style={[styles.infoBoxText, isRTL && styles.rtl]}>
              {t("showCode")}
            </Text>
          </View>
        )}

        {item.status === "arriving" && !isIncomplete && (
          <TouchableOpacity
            style={styles.confirmBtn}
            onPress={() => confirmPickup(item.id)}
            activeOpacity={0.88}
          >
            <Text style={styles.confirmBtnText}>{t("confirmPickup")}</Text>
          </TouchableOpacity>
        )}

        {item.status === "picked_up" && (
          <View style={[styles.fulfilledRow, isRTL && styles.rtlRow]}>
            <View style={styles.fulfilledBox}>
              <Text style={styles.fulfilledText}>
                {t("pickedUpOn")}{" "}
                {new Date(item.picked_up_at).toLocaleDateString("en-JO", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.paidSmall}>
              <Text style={styles.paidSmallLabel}>{t("paid")}</Text>
              <Text style={styles.paidSmallValue}>
                JD {parseFloat(item.amount_paid).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        <Text style={[styles.dateText, isRTL && styles.rtl]}>
          {t("reservedOn")}{" "}
          {new Date(item.reserved_at).toLocaleDateString("en-JO", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>{t("myOrders")}...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
      {/* Header */}
      <View style={[styles.summaryHeader, { paddingTop: (insets.top > 0 ? insets.top : (Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0)) + 16 }]}>
        <Text style={styles.summaryTitle}>{t("myOrders")}</Text>
        <View style={styles.summaryStats}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{todayOrders.length}</Text>
            <Text style={styles.summaryLabel}>{t("today")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>{historyOrders.length}</Text>
            <Text style={styles.summaryLabel}>{t("pastMonth")}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNum}>
              JD {orders.reduce((s, o) => s + parseFloat(o.amount_paid || 0), 0).toFixed(2)}
            </Text>
            <Text style={styles.summaryLabel}>{t("spent")}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "today" && styles.tabActive]}
          onPress={() => setActiveTab("today")}
        >
          <Text style={[styles.tabText, activeTab === "today" && styles.tabTextActive]}>{t("today")}</Text>
          {todayOrders.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{todayOrders.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "history" && styles.tabActive]}
          onPress={() => setActiveTab("history")}
        >
          <Text style={[styles.tabText, activeTab === "history" && styles.tabTextActive]}>{t("pastMonth")}</Text>
        </TouchableOpacity>
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
            onRefresh={() => {
              setRefreshing(true);
              fetchOrders();
            }}
            tintColor="#2E7D32"
          />
        }
        ListHeaderComponent={<View style={{ height: 12 }} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-handle-outline" size={44} color="#B8B8B8" />
            <Text style={styles.emptyTitle}>
              {activeTab === "today" ? t("noOrdersToday") : t("noOrdersPastMonth")}
            </Text>
            <Text style={styles.emptySubtitle}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  loadingText: { fontSize: 14, color: "#737373" },

  // Summary header
  summaryHeader: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomWidth: 0,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 16,
    textAlign: "center",
  },
  summaryStats: {
    flexDirection: "row",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 11, color: "rgba(255,255,255,0.7)" },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: 8,
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#EBEBEB",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    gap: 6,
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#1B5E20" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#737373" },
  tabTextActive: { color: "#1B5E20", fontWeight: "700" },
  tabBadge: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tabBadgeText: { fontSize: 11, fontWeight: "700", color: "#FFFFFF" },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F0F0F",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
  },
  browseBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  browseBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  // List
  list: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2E7D32",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  cardPast: { opacity: 0.7, borderLeftColor: "#B8B8B8" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTopLeft: { flex: 1 },
  restaurantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0F0F0F",
    marginBottom: 3,
  },
  textMuted: { color: "#B8B8B8" },
  area: { fontSize: 12, color: "#737373" },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F5F5F5", marginVertical: 10 },
  bagTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#0F0F0F",
    marginBottom: 6,
  },
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 12,
  },
  pickupTime: { fontSize: 12, color: "#737373" },

  // Code row
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  codeCard: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  codeLabel: {
    fontSize: 10,
    color: "#2E7D32",
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  codeValue: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1B5E20",
    letterSpacing: 5,
  },
  codeCardLocked: {
    backgroundColor: "#F5F5F5",
    borderColor: "#E0E0E0",
  },
  codeLockContent: { alignItems: "center", gap: 6 },
  codeLockText: {
    fontSize: 11,
    color: "#737373",
    fontWeight: "500",
    textAlign: "center",
  },
  priceCard: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
    minWidth: 90,
  },
  priceLabel: {
    fontSize: 10,
    color: "#737373",
    marginBottom: 6,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  priceValue: { fontSize: 18, fontWeight: "700", color: "#0F0F0F" },

  // Info box
  incompleteBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  incompleteText: { fontSize: 12, color: "#B8B8B8", flex: 1 },

  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  infoBoxText: { fontSize: 12, color: "#737373", flex: 1 },

  // Confirm button
  confirmBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
  },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  // Fulfilled
  fulfilledRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  fulfilledBox: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  fulfilledText: { fontSize: 12, color: "#737373", fontWeight: "500" },
  paidSmall: {
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  paidSmallLabel: { fontSize: 10, color: "#737373", marginBottom: 2 },
  paidSmallValue: { fontSize: 14, fontWeight: "700", color: "#0F0F0F" },

  dateText: { fontSize: 11, color: "#B8B8B8", textAlign: "center", marginTop: 4 },
});
