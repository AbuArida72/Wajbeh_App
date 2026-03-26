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
  Alert,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function RestaurantOrdersScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [code, setCode] = useState("");
  const [searching, setSearching] = useState(false);
  const [foundOrder, setFoundOrder] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [restaurantId, setRestaurantId] = useState(null);
  const [activeTab, setActiveTab] = useState("active");
  const codeInputRef = useRef(null);

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
      Alert.alert(t("noReservationsTitle"), t("noReservationFound"));
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
      Alert.alert("Error", error.message);
    } else if (!data || data.length === 0) {
      Alert.alert("Error", "Could not update order.");
    } else {
      setFoundOrder(null);
      setCode("");
      fetchOrders();
      Alert.alert("Confirmed!", "Ask the customer to confirm pickup in their app.");
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
        return { label: t("pendingLabel"), color: "#2E7D32", bg: "#F2F8F2" };
      case "arriving":
        return { label: t("pendingPickupConf"), color: "#E65100", bg: "#FFF3E0" };
      case "picked_up":
        return { label: t("fulfilledLabel"), color: "#737373", bg: "#F0F0F0" };
      default:
        return { label: status, color: "#737373", bg: "#F5F5F5" };
    }
  };

  const renderOrder = ({ item }) => {
    const config = getStatusConfig(item.status);
    const isFulfilled = item.status === "picked_up";

    return (
      <View style={[styles.orderCard, isFulfilled && styles.orderCardFulfilled]}>
        <View style={styles.orderTop}>
          <View style={styles.orderLeft}>
            <Text
              style={[styles.orderBagTitle, isFulfilled && styles.textMuted]}
              numberOfLines={1}
            >
              {item.bags?.title}
            </Text>
            <View style={styles.orderTimeRow}>
              <Ionicons name="time-outline" size={12} color="#B8B8B8" />
              <Text style={styles.orderDate}>
                {new Date(item.reserved_at).toLocaleTimeString("en-JO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
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
                Pending pickup confirmation
              </Text>
            </View>
          )}
          {item.status === "picked_up" && (
            <View style={styles.fulfilledBadge}>
              <Ionicons name="checkmark" size={12} color="#737373" />
              <Text style={styles.fulfilledBadgeText}>Complete</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
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
            <View style={[styles.scanSection, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.scanTitle}>Verify Pickup Code</Text>
              <Text style={styles.scanSubtitle}>
                Enter the code shown by the customer
              </Text>

              <TouchableOpacity
                style={styles.codeInputRow}
                onPress={() => codeInputRef.current?.focus()}
                activeOpacity={1}
              >
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <View
                    key={i}
                    style={[styles.codeBox, code[i] && styles.codeBoxFilled]}
                  >
                    <Text style={styles.codeBoxChar}>{code[i] || ""}</Text>
                  </View>
                ))}
              </TouchableOpacity>

              <TextInput
                ref={codeInputRef}
                style={styles.hiddenInput}
                value={code}
                onChangeText={(t) => setCode(t.toUpperCase().slice(0, 6))}
                maxLength={6}
                autoCapitalize="characters"
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
                  <Text style={styles.checkBtnText}>Verify Code</Text>
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
                    <Ionicons name="checkmark-circle" size={20} color="#2E7D32" />
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
                        Confirm Customer Arrival
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{activeOrders.length}</Text>
                <Text style={styles.statLabel}>Active</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
                <Text style={styles.statNum}>{fulfilledOrders.length}</Text>
                <Text style={styles.statLabel}>Fulfilled</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statCard}>
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
              <Ionicons
                name={activeTab === "active" ? "calendar-outline" : "checkmark-circle-outline"}
                size={40}
                color="#B8B8B8"
              />
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
  container: { flex: 1, backgroundColor: "#FAFAFA" },

  // Scan section
  scanSection: {
    backgroundColor: "#1B5E20",
    padding: 20,
    paddingBottom: 24,
    borderBottomWidth: 0,
  },
  scanTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
    textAlign: "center",
  },
  scanSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 16, textAlign: "center" },

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
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  codeBoxFilled: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderColor: "#FFFFFF",
  },
  codeBoxChar: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  hiddenInput: {
    position: "absolute",
    opacity: 0,
    width: 1,
    height: 1,
  },
  checkBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  checkBtnDisabled: { opacity: 0.5 },
  checkBtnText: { color: "#1B5E20", fontWeight: "700", fontSize: 15 },
  clearCodeBtn: { alignItems: "center", marginTop: 10 },
  clearCodeText: { color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: "500" },

  // Found card
  foundCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginTop: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  foundHeader: {
    backgroundColor: "#F2F8F2",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  foundHeaderText: { fontSize: 14, fontWeight: "600", color: "#2E7D32" },
  foundBody: { padding: 16, gap: 2 },
  foundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  foundDivider: { height: 1, backgroundColor: "#F5F5F5" },
  foundLabel: { fontSize: 13, color: "#737373" },
  foundValue: { fontSize: 13, fontWeight: "500", color: "#0F0F0F" },
  foundValueGreen: { fontSize: 17, fontWeight: "700", color: "#2E7D32" },
  confirmBtn: {
    backgroundColor: "#2E7D32",
    margin: 16,
    marginTop: 8,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  // Stats
  statsRow: {
    flexDirection: "row",
    padding: 16,
    backgroundColor: "#E8F5E9",
    borderBottomWidth: 1,
    borderBottomColor: "#A5D6A7",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: "#A5D6A7",
    marginHorizontal: 8,
  },
  statNum: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: "#4CAF50" },

  // Tabs
  tabRow: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderBottomWidth: 3,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: "#2E7D32" },
  tabText: { fontSize: 14, fontWeight: "500", color: "#737373" },
  tabTextActive: { color: "#1B5E20", fontWeight: "700" },

  // Order cards
  list: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 32 },
  orderCard: {
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
  orderCardFulfilled: { opacity: 0.7, borderLeftColor: "#B8B8B8" },
  orderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  orderLeft: { flex: 1 },
  orderBagTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 4,
  },
  textMuted: { color: "#B8B8B8" },
  orderTimeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  orderDate: { fontSize: 12, color: "#737373" },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 10,
  },
  statusText: { fontSize: 12, fontWeight: "600" },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderPrice: { fontSize: 17, fontWeight: "700", color: "#0F0F0F" },
  awaitingBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  awaitingText: { fontSize: 11, color: "#E65100", fontWeight: "500" },
  fulfilledBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F0F0F0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  fulfilledBadgeText: { fontSize: 11, color: "#737373", fontWeight: "500" },

  // Empty & loading
  loadingContainer: { paddingTop: 48, alignItems: "center" },
  emptyContainer: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F0F0F",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 22,
  },
});
