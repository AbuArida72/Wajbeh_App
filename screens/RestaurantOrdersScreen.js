import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";

export default function RestaurantOrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTab, setActiveTab] = useState("active");

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  const fetchOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: restaurant } = await supabase
      .from("restaurants")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!restaurant) {
      setLoading(false);
      return;
    }
    setRestaurantId(restaurant.id);

    const { data } = await supabase
      .from("orders")
      .select(`*, bags (title, price, restaurant_id, restaurants (name))`)
      .in("status", ["reserved", "arriving", "picked_up"])
      .order("reserved_at", { ascending: false });

    const filtered = (data || []).filter(
      (o) => o.bags?.restaurant_id === restaurant.id,
    );
    setOrders(filtered);
    setLoading(false);
    setRefreshing(false);
  };

  const searchCode = async () => {
    if (code.length < 4) return;
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
      window.alert("No active reservation found with this code.");
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
      window.alert("Error: " + error.message);
    } else if (!data || data.length === 0) {
      window.alert("Could not update order.");
    } else {
      setFoundOrder(null);
      setCode("");
      fetchOrders();
      window.alert(
        "Confirmed! Ask the customer to confirm pickup in their app.",
      );
    }
    setConfirming(false);
  };

  const activeOrders = orders.filter(
    (o) => o.status === "reserved" || o.status === "arriving",
  );
  const fulfilledOrders = orders.filter((o) => o.status === "picked_up");
  const displayOrders = activeTab === "active" ? activeOrders : fulfilledOrders;

  const totalRevenue = orders
    .filter((o) => o.status === "picked_up")
    .reduce((s, o) => s + parseFloat(o.bags?.price || 0), 0);

  const getStatusConfig = (status) => {
    switch (status) {
      case "reserved":
        return { label: "⏳ Pending", color: "#2E7D32", bg: "#E8F5E9" };
      case "arriving":
        return { label: "🚶 Arriving", color: "#E65100", bg: "#FFF3E0" };
      case "picked_up":
        return { label: "✅ Fulfilled", color: "#1565C0", bg: "#E3F2FD" };
      default:
        return { label: status, color: "#888780", bg: "#F5F5F5" };
    }
  };

  const renderOrder = ({ item }) => {
    const config = getStatusConfig(item.status);
    const isFulfilled = item.status === "picked_up";

    return (
      <View
        style={[
          styles.orderCard,
          isFulfilled && styles.orderCardFulfilled,
          { borderLeftColor: config.color },
        ]}
      >
        <View style={styles.orderTop}>
          <View style={styles.orderLeft}>
            <Text
              style={[styles.orderBagTitle, isFulfilled && styles.textMuted]}
            >
              {item.bags?.title}
            </Text>
            <Text style={styles.orderDate}>
              🕐{" "}
              {new Date(item.reserved_at).toLocaleTimeString("en-JO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: config.bg }]}>
            <Text style={[styles.statusText, { color: config.color }]}>
              {config.label}
            </Text>
          </View>
        </View>

        <View style={styles.orderBottom}>
          <Text style={styles.orderPrice}>
            JD {parseFloat(item.bags?.price || 0).toFixed(2)}
          </Text>
          {item.status === "arriving" && (
            <View style={styles.awaitingBadge}>
              <Text style={styles.awaitingText}>
                ⏱️ Awaiting customer confirmation
              </Text>
            </View>
          )}
          {item.status === "picked_up" && (
            <View style={styles.fulfilledBadge}>
              <Text style={styles.fulfilledBadgeText}>✅ Complete</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={displayOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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
        ListHeaderComponent={
          <View>
            {/* Code checker */}
            <View style={styles.scanSection}>
              <View style={styles.scanHeader}>
                <Text style={styles.scanTitle}>🎫 Verify Pickup Code</Text>
                <Text style={styles.scanSubtitle}>
                  Enter the code shown by the customer
                </Text>
              </View>

              <View style={styles.codeInputRow}>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[styles.codeBox, code[i] && styles.codeBoxFilled]}
                  >
                    <Text style={styles.codeBoxChar}>{code[i] || ""}</Text>
                  </View>
                ))}
              </View>

              <TextInput
                style={styles.hiddenInput}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoCapitalize="characters"
                placeholder="Tap to enter code"
                placeholderTextColor="#A5C8A5"
              />

              <TouchableOpacity
                style={[
                  styles.checkBtn,
                  (code.length < 4 || searching) && styles.checkBtnDisabled,
                ]}
                onPress={searchCode}
                disabled={code.length < 4 || searching}
                activeOpacity={0.88}
              >
                {searching ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.checkBtnText}>Verify Code →</Text>
                )}
              </TouchableOpacity>

              {code.length > 0 && (
                <TouchableOpacity
                  style={styles.clearCodeBtn}
                  onPress={() => {
                    setCode("");
                    setFoundOrder(null);
                  }}
                >
                  <Text style={styles.clearCodeText}>Clear</Text>
                </TouchableOpacity>
              )}

              {/* Found order */}
              {foundOrder && (
                <View style={styles.foundCard}>
                  <View style={styles.foundHeader}>
                    <Text style={styles.foundHeaderEmoji}>✅</Text>
                    <Text style={styles.foundHeaderText}>
                      Valid Reservation Found
                    </Text>
                  </View>
                  <View style={styles.foundBody}>
                    <View style={styles.foundRow}>
                      <Text style={styles.foundLabel}>Bag</Text>
                      <Text style={styles.foundValue}>
                        {foundOrder.bags?.title}
                      </Text>
                    </View>
                    <View style={styles.foundDivider} />
                    <View style={styles.foundRow}>
                      <Text style={styles.foundLabel}>Amount</Text>
                      <Text style={styles.foundValueGreen}>
                        JD {parseFloat(foundOrder.bags?.price || 0).toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.foundDivider} />
                    <View style={styles.foundRow}>
                      <Text style={styles.foundLabel}>Reserved at</Text>
                      <Text style={styles.foundValue}>
                        {new Date(foundOrder.reserved_at).toLocaleTimeString(
                          "en-JO",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      confirming && styles.confirmBtnDisabled,
                    ]}
                    onPress={() => confirmArrival(foundOrder.id)}
                    disabled={confirming}
                    activeOpacity={0.88}
                  >
                    {confirming ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.confirmBtnText}>
                        ✅ Confirm Customer Arrival
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>⏳</Text>
                <Text style={styles.statNum}>{activeOrders.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statNum}>{fulfilledOrders.length}</Text>
                <Text style={styles.statLabel}>Fulfilled</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statEmoji}>💰</Text>
                <Text style={styles.statNum}>JD {totalRevenue.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
            </View>

            {/* Tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, activeTab === "active" && styles.tabActive]}
                onPress={() => setActiveTab("active")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "active" && styles.tabTextActive,
                  ]}
                >
                  Active ({activeOrders.length})
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.tab,
                  activeTab === "fulfilled" && styles.tabActive,
                ]}
                onPress={() => setActiveTab("fulfilled")}
              >
                <Text
                  style={[
                    styles.tabText,
                    activeTab === "fulfilled" && styles.tabTextActive,
                  ]}
                >
                  Fulfilled ({fulfilledOrders.length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color="#2E7D32" size="large" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>
                {activeTab === "active" ? "🎫" : "✅"}
              </Text>
              <Text style={styles.emptyTitle}>
                {activeTab === "active"
                  ? "No active reservations"
                  : "No fulfilled orders yet"}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === "active"
                  ? "Reservations will appear here when customers reserve your bags"
                  : "Fulfilled orders will appear here after customers confirm pickup"}
              </Text>
            </View>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },

  // Scan section
  scanSection: {
    backgroundColor: "#2E7D32",
    padding: 20,
    paddingBottom: 24,
  },
  scanHeader: { marginBottom: 16 },
  scanTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  scanSubtitle: { fontSize: 13, color: "#A5D6A7" },

  // Code boxes
  codeInputRow: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    marginBottom: 12,
  },
  codeBox: {
    width: 44,
    height: 54,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBoxFilled: {
    backgroundColor: "rgba(255,255,255,0.2)",
    borderColor: "rgba(255,255,255,0.6)",
  },
  codeBoxChar: { fontSize: 22, fontWeight: "800", color: "#FFFFFF" },
  hiddenInput: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 12,
    fontSize: 18,
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: 4,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  checkBtn: {
    backgroundColor: "#1B5E20",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  clearCodeBtn: { alignItems: "center", marginTop: 10 },
  clearCodeText: { color: "#A5D6A7", fontSize: 13, fontWeight: "600" },

  // Found card
  foundCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  foundHeader: {
    backgroundColor: "#E8F5E9",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#C8E6C9",
  },
  foundHeaderEmoji: { fontSize: 20 },
  foundHeaderText: { fontSize: 15, fontWeight: "800", color: "#2E7D32" },
  foundBody: { padding: 16, gap: 2 },
  foundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  foundDivider: { height: 1, backgroundColor: "#F0F7F0" },
  foundLabel: { fontSize: 13, color: "#888780" },
  foundValue: { fontSize: 14, fontWeight: "600", color: "#1B5E20" },
  foundValueGreen: { fontSize: 18, fontWeight: "800", color: "#2E7D32" },
  confirmBtn: {
    backgroundColor: "#2E7D32",
    margin: 16,
    marginTop: 8,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  // Stats
  statsRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F0F7F0",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statNum: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: "#888780" },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 14, fontWeight: "600", color: "#888780" },
  tabTextActive: { color: "#2E7D32", fontWeight: "800" },

  // Order cards
  list: { paddingHorizontal: 16, paddingBottom: 32, paddingTop: 12 },
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    borderLeftWidth: 4,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardFulfilled: { opacity: 0.7 },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  orderLeft: { flex: 1 },
  orderBagTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 4,
  },
  textMuted: { color: "#888780" },
  orderDate: { fontSize: 12, color: "#888780" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderPrice: { fontSize: 18, fontWeight: "800", color: "#2E7D32" },
  awaitingBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  awaitingText: { fontSize: 11, color: "#E65100", fontWeight: "600" },
  fulfilledBadge: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  fulfilledBadgeText: { fontSize: 11, color: "#1565C0", fontWeight: "600" },

  // Empty & loading
  loadingContainer: { paddingTop: 48, alignItems: "center" },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#888780",
    textAlign: "center",
    lineHeight: 22,
  },
});
