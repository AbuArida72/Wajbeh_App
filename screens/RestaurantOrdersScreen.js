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
      .select(
        `
        *,
        bags (
          title, price, restaurant_id,
          restaurants ( name )
        )
      `,
      )
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
      .select(
        `
        *,
        bags (
          title, price, restaurant_id,
          restaurants ( name, area )
        )
      `,
      )
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
    const { error } = await supabase
      .from("orders")
      .update({ status: "arriving" })
      .eq("id", orderId);

    if (error) {
      window.alert("Error: " + error.message);
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

  const getStatusColor = (status) => {
    switch (status) {
      case "reserved":
        return "#2E7D32";
      case "arriving":
        return "#E65100";
      case "picked_up":
        return "#1565C0";
      default:
        return "#888780";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "reserved":
        return "⏳ Pending";
      case "arriving":
        return "🚶 Pending confirmation";
      case "picked_up":
        return "✅ Fulfilled";
      default:
        return status;
    }
  };

  const renderOrder = ({ item }) => (
    <View
      style={[
        styles.orderCard,
        item.status === "picked_up" && styles.orderCardFulfilled,
      ]}
    >
      <View style={styles.orderTop}>
        <View style={styles.orderLeft}>
          <Text style={styles.orderBagTitle}>{item.bags?.title}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.reserved_at).toLocaleTimeString("en-JO", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) + "18" },
          ]}
        >
          <Text
            style={[styles.statusText, { color: getStatusColor(item.status) }]}
          >
            {getStatusLabel(item.status)}
          </Text>
        </View>
      </View>
      <View style={styles.orderBottom}>
        <Text style={styles.orderPrice}>
          JD {parseFloat(item.bags?.price).toFixed(2)}
        </Text>
        {item.status === "arriving" && (
          <View style={styles.awaitingBadge}>
            <Text style={styles.awaitingText}>
              Awaiting customer confirmation
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Code check section */}
      <View style={styles.scanSection}>
        <Text style={styles.scanTitle}>🎫 Check Pickup Code</Text>
        <Text style={styles.scanSubtitle}>
          Enter the code shown by the customer
        </Text>
        <View style={styles.searchRow}>
          <TextInput
            style={styles.codeInput}
            placeholder="e.g. C921E4"
            placeholderTextColor="#A5C8A5"
            value={code}
            onChangeText={(t) => setCode(t.toUpperCase())}
            maxLength={6}
            autoCapitalize="characters"
          />
          <TouchableOpacity
            style={[styles.searchBtn, searching && styles.searchBtnDisabled]}
            onPress={searchCode}
            disabled={searching}
          >
            {searching ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.searchBtnText}>Check</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Found order */}
        {foundOrder && (
          <View style={styles.foundCard}>
            <View style={styles.foundHeader}>
              <Text style={styles.foundTitle}>✅ Valid Reservation</Text>
            </View>
            <View style={styles.foundBody}>
              <View style={styles.foundRow}>
                <Text style={styles.foundLabel}>Bag</Text>
                <Text style={styles.foundValue}>{foundOrder.bags?.title}</Text>
              </View>
              <View style={styles.foundRow}>
                <Text style={styles.foundLabel}>Amount</Text>
                <Text style={styles.foundValueGreen}>
                  JD {parseFloat(foundOrder.bags?.price).toFixed(2)}
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
            >
              {confirming ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.confirmBtnText}>✅ Confirm Arrival</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Reservations list */}
      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Today's Reservations</Text>
        <Text style={styles.listCount}>
          {orders.filter((o) => o.status !== "picked_up").length} active
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#2E7D32" style={{ marginTop: 32 }} />
      ) : (
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🎫</Text>
              <Text style={styles.emptyTitle}>No reservations yet</Text>
              <Text style={styles.emptySubtitle}>
                Reservations will appear here when customers reserve your bags
              </Text>
            </View>
          }
        />
      )}
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
  scanTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  scanSubtitle: { fontSize: 13, color: "#A5D6A7", marginBottom: 16 },
  searchRow: { flexDirection: "row", gap: 10 },
  codeInput: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
    letterSpacing: 6,
  },
  searchBtn: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingHorizontal: 20,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 80,
  },
  searchBtnDisabled: { opacity: 0.6 },
  searchBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  // Found card
  foundCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginTop: 16,
    overflow: "hidden",
  },
  foundHeader: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    alignItems: "center",
  },
  foundTitle: { fontSize: 15, fontWeight: "800", color: "#2E7D32" },
  foundBody: { padding: 16, gap: 12 },
  foundRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  foundLabel: { fontSize: 13, color: "#888780" },
  foundValue: { fontSize: 14, fontWeight: "600", color: "#1B5E20" },
  foundValueGreen: { fontSize: 18, fontWeight: "800", color: "#2E7D32" },
  confirmBtn: {
    backgroundColor: "#2E7D32",
    margin: 16,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  confirmBtnDisabled: { opacity: 0.6 },
  confirmBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  // List
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  listTitle: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },
  listCount: { fontSize: 13, color: "#888780" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },

  // Order card
  orderCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  orderCardFulfilled: {
    opacity: 0.6,
    borderColor: "#C8E6C9",
  },
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
    marginBottom: 3,
  },
  orderDate: { fontSize: 12, color: "#888780" },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: "700" },
  orderBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  orderPrice: { fontSize: 16, fontWeight: "800", color: "#2E7D32" },
  awaitingBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  awaitingText: { fontSize: 11, color: "#E65100", fontWeight: "600" },

  // Empty
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
