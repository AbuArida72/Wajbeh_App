import { useState, useCallback } from "react";
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

export default function OrdersScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchOrders();
    }, []),
  );

  const fetchOrders = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("orders")
      .select(
        `
        *,
        bags (
          title,
          image_url,
          price,
          restaurants (
            name,
            area,
            pickup_start,
            pickup_end
          )
        )
      `,
      )
      .eq("user_id", user.id)
      .order("reserved_at", { ascending: false });

    if (error) {
      console.log("Error fetching orders:", error);
    } else {
      setOrders(data);
    }
    setLoading(false);
    setRefreshing(false);
  };

  const confirmPickup = async (orderId) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "picked_up", picked_up_at: new Date().toISOString() })
      .eq("id", orderId);
    if (error) {
      window.alert("Error: " + error.message);
    } else {
      fetchOrders();
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "reserved":
        return "#2E7D32";
      case "arriving":
        return "#E65100";
      case "picked_up":
        return "#1565C0";
      case "cancelled":
        return "#C62828";
      default:
        return "#888780";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "reserved":
        return "⏳ Reserved";
      case "arriving":
        return "🚶 On my way!";
      case "picked_up":
        return "✅ Picked up";
      case "cancelled":
        return "❌ Cancelled";
      default:
        return status;
    }
  };

  const renderOrder = ({ item }) => {
    const bag = item.bags;
    const restaurant = bag?.restaurants;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.cardTopLeft}>
            <Text style={styles.restaurantName}>{restaurant?.name}</Text>
            <Text style={styles.area}>📍 {restaurant?.area}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "18" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {getStatusLabel(item.status)}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.bagTitle}>{bag?.title}</Text>
        <Text style={styles.pickup}>
          🕐 Pickup: {restaurant?.pickup_start?.slice(0, 5)} –{" "}
          {restaurant?.pickup_end?.slice(0, 5)}
        </Text>

        <View style={styles.divider} />

        <View style={styles.bottomRow}>
          <View style={styles.codeBox}>
            <Text style={styles.codeLabel}>Pickup code</Text>
            <Text style={styles.code}>{item.pickup_code}</Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Paid</Text>
            <Text style={styles.price}>
              JD {parseFloat(item.amount_paid).toFixed(2)}
            </Text>
          </View>
        </View>

        {item.status === "arriving" && (
          <TouchableOpacity
            style={styles.confirmPickupBtn}
            onPress={() => confirmPickup(item.id)}
          >
            <Text style={styles.confirmPickupBtnText}>✅ Confirm Pickup</Text>
          </TouchableOpacity>
        )}

        {item.status === "reserved" && (
          <View style={styles.waitingBox}>
            <Text style={styles.waitingText}>
              Show this code at {restaurant?.name} to collect your bag
            </Text>
          </View>
        )}

        <Text style={styles.date}>
          Reserved on{" "}
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
        <Text style={styles.loadingText}>Loading your orders...</Text>
      </View>
    );
  }

  if (orders.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🛍️</Text>
        <Text style={styles.emptyTitle}>No orders yet</Text>
        <Text style={styles.emptySubtitle}>
          Reserve a bag and it will appear here
        </Text>
        <TouchableOpacity
          style={styles.browseBtn}
          onPress={() => navigation.navigate("Home")}
        >
          <Text style={styles.browseBtnText}>Browse Bags</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#2E7D32"
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F0F7F0",
  },
  loadingText: { fontSize: 14, color: "#2E7D32" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F0F7F0",
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
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
  },
  browseBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 15 },
  list: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
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
  pickup: { fontSize: 12, color: "#5F5E5A" },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  codeBox: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    flex: 1,
    marginRight: 10,
  },
  codeLabel: { fontSize: 11, color: "#A5D6A7", marginBottom: 4 },
  code: { fontSize: 24, fontWeight: "800", color: "#FFFFFF", letterSpacing: 4 },
  priceBox: {
    backgroundColor: "#F0F7F0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  priceLabel: { fontSize: 11, color: "#888780", marginBottom: 4 },
  price: { fontSize: 18, fontWeight: "800", color: "#2E7D32" },
  confirmPickupBtn: {
    backgroundColor: "#E65100",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 12,
  },
  confirmPickupBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },
  waitingBox: {
    backgroundColor: "#F0F7F0",
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  waitingText: { fontSize: 12, color: "#5F5E5A", textAlign: "center" },
  date: { fontSize: 11, color: "#B4B2A9", marginTop: 10, textAlign: "right" },
});
