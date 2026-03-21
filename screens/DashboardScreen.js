import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "../lib/supabase";

export default function DashboardScreen() {
  const [bags, setBags] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, []),
  );

  const fetchDashboard = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: restaurantData } = await supabase
      .from("restaurants")
      .select("*")
      .eq("owner_id", user.id)
      .single();

    if (restaurantData) {
      setRestaurant(restaurantData);
      const { data: bagsData } = await supabase
        .from("bags")
        .select("*, orders(count)")
        .eq("restaurant_id", restaurantData.id)
        .order("created_at", { ascending: false });
      setBags(bagsData || []);
    }
    setLoading(false);
  };

  const addBag = async () => {
    if (!title || !price || !originalValue || !quantity) {
      window.alert("Please fill in all required fields");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("bags").insert({
      restaurant_id: restaurant.id,
      title,
      description,
      price: parseFloat(price),
      original_value: parseFloat(originalValue),
      quantity_total: parseInt(quantity),
      quantity_remaining: parseInt(quantity),
      available_date: new Date().toISOString().split("T")[0],
      status: "available",
      image_url:
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    });

    if (error) {
      window.alert("Error: " + error.message);
    } else {
      setModalVisible(false);
      setTitle("");
      setPrice("");
      setOriginalValue("");
      setQuantity("");
      setDescription("");
      fetchDashboard();
    }
    setSaving(false);
  };

  const markSoldOut = async (bagId) => {
    const confirmed = window.confirm(
      "Mark this bag as sold out? This will set quantity to 0.",
    );
    if (confirmed) {
      const { error } = await supabase
        .from("bags")
        .update({ quantity_remaining: 0, status: "sold_out" })
        .eq("id", bagId);
      if (error) {
        window.alert("Error: " + error.message);
      } else {
        fetchDashboard();
      }
    }
  };

  const renderBag = ({ item }) => (
    <View style={styles.bagCard}>
      <View style={styles.bagCardTop}>
        <View style={styles.bagCardLeft}>
          <Text style={styles.bagCardTitle}>{item.title}</Text>
          <Text style={styles.bagCardPrice}>
            JD {parseFloat(item.price).toFixed(2)} · {item.quantity_remaining}/
            {item.quantity_total} left
          </Text>
        </View>
        <View
          style={[
            styles.bagStatusBadge,
            item.status === "sold_out" && styles.bagStatusSoldOut,
          ]}
        >
          <Text
            style={[
              styles.bagStatusText,
              item.status === "sold_out" && styles.bagStatusTextSoldOut,
            ]}
          >
            {item.status === "available" ? "🟢 Available" : "🔴 Sold out"}
          </Text>
        </View>
      </View>

      <View style={styles.bagCardStats}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{item.quantity_remaining}</Text>
          <Text style={styles.statLabel}>Remaining</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            {item.quantity_total - item.quantity_remaining}
          </Text>
          <Text style={styles.statLabel}>Reserved</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statValue}>
            JD{" "}
            {(
              parseFloat(item.price) *
              (item.quantity_total - item.quantity_remaining)
            ).toFixed(2)}
          </Text>
          <Text style={styles.statLabel}>Earned</Text>
        </View>
      </View>

      {item.status === "available" && (
        <TouchableOpacity
          style={styles.soldOutBtn}
          onPress={() => markSoldOut(item.id)}
        >
          <Text style={styles.soldOutBtnText}>Mark as Sold Out</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.noRestaurantContainer}>
        <Text style={styles.noRestaurantEmoji}>🏪</Text>
        <Text style={styles.noRestaurantTitle}>No restaurant found</Text>
        <Text style={styles.noRestaurantSubtitle}>
          Your account is not linked to any restaurant. Contact support to set
          up your restaurant profile.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{restaurant.name}</Text>
          <Text style={styles.headerSub}>
            📍 {restaurant.area} · {restaurant.category}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.addBtnText}>+ Add Bag</Text>
        </TouchableOpacity>
      </View>

      {/* Today's stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>{bags.length}</Text>
          <Text style={styles.statCardLabel}>Bags today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            {bags.reduce(
              (sum, b) => sum + (b.quantity_total - b.quantity_remaining),
              0,
            )}
          </Text>
          <Text style={styles.statCardLabel}>Reserved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statCardValue}>
            JD{" "}
            {bags
              .reduce(
                (sum, b) =>
                  sum +
                  parseFloat(b.price) *
                    (b.quantity_total - b.quantity_remaining),
                0,
              )
              .toFixed(2)}
          </Text>
          <Text style={styles.statCardLabel}>Earned</Text>
        </View>
      </View>

      {/* Bags list */}
      <FlatList
        data={bags}
        keyExtractor={(item) => item.id}
        renderItem={renderBag}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={styles.emptyTitle}>No bags posted today</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ Add Bag" to post your first bag
            </Text>
          </View>
        }
      />

      {/* Add Bag Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Bag</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.inputLabel}>Bag title *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Surprise Pastry Bag"
              placeholderTextColor="#A5C8A5"
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="What's in the bag?"
              placeholderTextColor="#A5C8A5"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Your price (JD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3.50"
                  placeholderTextColor="#A5C8A5"
                  keyboardType="decimal-pad"
                  value={price}
                  onChangeText={setPrice}
                />
              </View>
              <View style={styles.inputHalf}>
                <Text style={styles.inputLabel}>Original value (JD) *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="12.00"
                  placeholderTextColor="#A5C8A5"
                  keyboardType="decimal-pad"
                  value={originalValue}
                  onChangeText={setOriginalValue}
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Quantity *</Text>
            <TextInput
              style={styles.input}
              placeholder="How many bags?"
              placeholderTextColor="#A5C8A5"
              keyboardType="number-pad"
              value={quantity}
              onChangeText={setQuantity}
            />

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={addBag}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveBtnText}>Post Bag</Text>
              )}
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noRestaurantContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F0F7F0",
  },
  noRestaurantEmoji: { fontSize: 56, marginBottom: 16 },
  noRestaurantTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
  },
  noRestaurantSubtitle: {
    fontSize: 14,
    color: "#888780",
    textAlign: "center",
    lineHeight: 22,
  },
  header: {
    backgroundColor: "#2E7D32",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  headerSub: { fontSize: 12, color: "#A5D6A7" },
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.4)",
  },
  addBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  statsRow: {
    flexDirection: "row",
    padding: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  statCardValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 4,
  },
  statCardLabel: { fontSize: 11, color: "#888780" },
  list: { paddingHorizontal: 16, paddingBottom: 32 },
  bagCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  bagCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  bagCardLeft: { flex: 1 },
  bagCardTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 4,
  },
  bagCardPrice: { fontSize: 13, color: "#5F5E5A" },
  bagStatusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bagStatusSoldOut: { backgroundColor: "#FFEBEE" },
  bagStatusText: { fontSize: 11, fontWeight: "700", color: "#2E7D32" },
  bagStatusTextSoldOut: { color: "#C62828" },
  bagCardStats: {
    flexDirection: "row",
    backgroundColor: "#F0F7F0",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  stat: { flex: 1, alignItems: "center" },
  statValue: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: "#888780" },
  soldOutBtn: {
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  soldOutBtnText: { fontSize: 13, fontWeight: "700", color: "#C62828" },
  emptyContainer: { alignItems: "center", paddingTop: 60 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: "#888780" },
  modal: { flex: 1, backgroundColor: "#F0F7F0" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E9",
  },
  modalTitle: { fontSize: 18, fontWeight: "800", color: "#1B5E20" },
  modalClose: { fontSize: 18, color: "#888780", fontWeight: "700" },
  modalBody: { padding: 20 },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B5E20",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#1B5E20",
    marginBottom: 16,
  },
  inputMultiline: { height: 80, textAlignVertical: "top" },
  inputRow: { flexDirection: "row", gap: 12 },
  inputHalf: { flex: 1 },
  saveBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
