import { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pollingRef = useRef(null);
  const { t, isRTL } = useLanguage();

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
    const { data, error } = await supabase
      .from("orders")
      .select(
        `*, bags (title, image_url, price, restaurants (name, area, pickup_start, pickup_end))`,
      )
      .eq("user_id", user.id)
      .order("reserved_at", { ascending: false });
    if (!error) setOrders(data);
    setLoading(false);
    setRefreshing(false);
  };

  const confirmPickup = async (orderId) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) window.alert("Error: " + error.message);
    else fetchOrders();
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "reserved":
        return {
          color: "#2E7D32",
          bg: "#E8F5E9",
          label: t("statusReserved"),
          border: "#2E7D32",
        };
      case "arriving":
        return {
          color: "#E65100",
          bg: "#FFF3E0",
          label: t("statusArriving"),
          border: "#E65100",
        };
      case "picked_up":
        return {
          color: "#1565C0",
          bg: "#E3F2FD",
          label: t("statusPickedUp"),
          border: "#1565C0",
        };
      case "cancelled":
        return {
          color: "#C62828",
          bg: "#FFEBEE",
          label: t("statusCancelled"),
          border: "#C62828",
        };
      default:
        return {
          color: "#888780",
          bg: "#F5F5F5",
          label: status,
          border: "#888780",
        };
    }
  };

  const activeOrders = orders.filter(
    (o) => o.status !== "picked_up" && o.status !== "cancelled",
  );
  const pastOrders = orders.filter(
    (o) => o.status === "picked_up" || o.status === "cancelled",
  );

  const renderOrder = ({ item }) => {
    const bag = item.bags;
    const restaurant = bag?.restaurants;
    const config = getStatusConfig(item.status);
    const isPast = item.status === "picked_up" || item.status === "cancelled";

    return (
      <View
        style={[
          styles.card,
          isPast && styles.cardPast,
          { borderLeftColor: config.border },
        ]}
      >
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
              📍 {restaurant?.area}
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
        <Text style={[styles.pickupTime, isRTL && styles.rtl]}>
          🕐 {t("pickupToday")} {restaurant?.pickup_start?.slice(0, 5)} –{" "}
          {restaurant?.pickup_end?.slice(0, 5)}
        </Text>

        {/* Code + price — only for active orders */}
        {!isPast && (
          <View style={[styles.codeRow, isRTL && styles.rtlRow]}>
            <View style={styles.codeCard}>
              <Text style={styles.codeLabel}>{t("pickupCode")}</Text>
              <Text style={styles.codeValue}>{item.pickup_code}</Text>
            </View>
            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>{t("paid")}</Text>
              <Text style={styles.priceValue}>
                JD {parseFloat(item.amount_paid).toFixed(2)}
              </Text>
            </View>
          </View>
        )}

        {/* Status-based actions */}
        {item.status === "reserved" && (
          <View style={styles.infoBox}>
            <Text style={styles.infoBoxIcon}>📱</Text>
            <Text style={[styles.infoBoxText, isRTL && styles.rtl]}>
              {t("showCode")}
            </Text>
          </View>
        )}

        {item.status === "arriving" && (
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
                🎉 {t("pickedUpOn")}{" "}
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

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Text style={styles.emptyEmoji}>🛍️</Text>
        </View>
        <Text style={[styles.emptyTitle, isRTL && styles.rtl]}>
          {t("noOrdersTitle")}
        </Text>
        <Text style={[styles.emptySubtitle, isRTL && styles.rtl]}>
          {t("noOrdersSubtitle")}
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.browseBtnText}>{t("browseBags")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary header */}
      <View style={styles.summaryHeader}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{activeOrders.length}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{pastOrders.length}</Text>
          <Text style={styles.summaryLabel}>Completed</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>
            JD{" "}
            {orders
              .reduce((s, o) => s + parseFloat(o.amount_paid || 0), 0)
              .toFixed(2)}
          </Text>
          <Text style={styles.summaryLabel}>Spent</Text>
        </View>
      </View>

      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0F7F0",
  },
  loadingText: { fontSize: 14, color: "#2E7D32" },

  // Summary header
  summaryHeader: {
    backgroundColor: "#2E7D32",
    flexDirection: "row",
    padding: 16,
    paddingVertical: 14,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 11, color: "#A5D6A7" },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    marginHorizontal: 8,
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F0F7F0",
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 3,
    borderColor: "#C8E6C9",
  },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888780",
    marginBottom: 24,
    textAlign: "center",
  },
  browseBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  browseBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },

  // List
  list: { padding: 16, paddingBottom: 32 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    borderLeftWidth: 4,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  cardPast: { opacity: 0.75, borderLeftColor: "#B4B2A9" },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  cardTopLeft: { flex: 1 },
  restaurantName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 3,
  },
  textMuted: { color: "#888780" },
  area: { fontSize: 12, color: "#81C784" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#F0F7F0", marginVertical: 10 },
  bagTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2A",
    marginBottom: 4,
  },
  pickupTime: { fontSize: 12, color: "#5F5E5A", marginBottom: 12 },

  // Code row
  codeRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  codeCard: {
    flex: 1,
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  codeLabel: {
    fontSize: 10,
    color: "#A5D6A7",
    marginBottom: 6,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 5,
  },
  priceCard: {
    backgroundColor: "#F0F7F0",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    minWidth: 90,
  },
  priceLabel: {
    fontSize: 10,
    color: "#888780",
    marginBottom: 6,
    fontWeight: "600",
  },
  priceValue: { fontSize: 20, fontWeight: "800", color: "#2E7D32" },

  // Info box
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F0F7F0",
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  infoBoxIcon: { fontSize: 14 },
  infoBoxText: { fontSize: 12, color: "#5F5E5A", flex: 1 },

  // Confirm button
  confirmBtn: {
    backgroundColor: "#E65100",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#E65100",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  // Fulfilled
  fulfilledRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    alignItems: "center",
  },
  fulfilledBox: {
    flex: 1,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  fulfilledText: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  paidSmall: {
    backgroundColor: "#F0F7F0",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  paidSmallLabel: { fontSize: 10, color: "#888780", marginBottom: 2 },
  paidSmallValue: { fontSize: 14, fontWeight: "800", color: "#2E7D32" },

  dateText: { fontSize: 11, color: "#B4B2A9", textAlign: "right" },
});
