import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Modal,
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
  const [focusedField, setFocusedField] = useState(null);

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
        .select("*")
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
    const confirmed = window.confirm("Mark this bag as sold out?");
    if (confirmed) {
      const { error } = await supabase
        .from("bags")
        .update({ quantity_remaining: 0, status: "sold_out" })
        .eq("id", bagId);
      if (error) window.alert("Error: " + error.message);
      else fetchDashboard();
    }
  };

  const totalBags = bags.length;
  const totalReserved = bags.reduce(
    (s, b) => s + (b.quantity_total - b.quantity_remaining),
    0,
  );
  const totalEarned = bags.reduce(
    (s, b) =>
      s + parseFloat(b.price) * (b.quantity_total - b.quantity_remaining),
    0,
  );
  const availableBags = bags.filter((b) => b.status === "available").length;

  const renderBag = ({ item }) => {
    const reserved = item.quantity_total - item.quantity_remaining;
    const fillPct =
      item.quantity_total > 0 ? (reserved / item.quantity_total) * 100 : 0;
    const isAvailable = item.status === "available";
    const discount = Math.round((1 - item.price / item.original_value) * 100);

    return (
      <View style={[styles.bagCard, !isAvailable && styles.bagCardSoldOut]}>
        {/* Card header */}
        <View style={styles.bagCardHeader}>
          <View style={styles.bagCardHeaderLeft}>
            <View
              style={[
                styles.bagStatusDot,
                { backgroundColor: isAvailable ? "#2E7D32" : "#B4B2A9" },
              ]}
            />
            <View>
              <Text
                style={[styles.bagCardTitle, !isAvailable && styles.textMuted]}
              >
                {item.title}
              </Text>
              <Text style={styles.bagCardMeta}>
                {item.category || "Surprise Bag"} · {discount}% off
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.bagStatusBadge,
              isAvailable ? styles.bagStatusAvailable : styles.bagStatusSoldOut,
            ]}
          >
            <Text
              style={[
                styles.bagStatusText,
                isAvailable
                  ? styles.bagStatusTextAvailable
                  : styles.bagStatusTextSoldOut,
              ]}
            >
              {isAvailable ? "🟢 Active" : "🔴 Sold out"}
            </Text>
          </View>
        </View>

        {/* Price row */}
        <View style={styles.bagPriceRow}>
          <View style={styles.bagPriceItem}>
            <Text style={styles.bagPriceLabel}>Your price</Text>
            <Text style={styles.bagPriceValue}>
              JD {parseFloat(item.price).toFixed(2)}
            </Text>
          </View>
          <View style={styles.bagPriceDivider} />
          <View style={styles.bagPriceItem}>
            <Text style={styles.bagPriceLabel}>Original</Text>
            <Text style={styles.bagPriceOriginal}>
              JD {parseFloat(item.original_value).toFixed(2)}
            </Text>
          </View>
          <View style={styles.bagPriceDivider} />
          <View style={styles.bagPriceItem}>
            <Text style={styles.bagPriceLabel}>Earned</Text>
            <Text style={styles.bagPriceEarned}>
              JD {(parseFloat(item.price) * reserved).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {reserved} of {item.quantity_total} reserved
            </Text>
            <Text style={styles.progressPct}>{Math.round(fillPct)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${fillPct}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressRemaining}>
              {item.quantity_remaining} remaining
            </Text>
          </View>
        </View>

        {/* Action button */}
        {isAvailable && (
          <TouchableOpacity
            style={styles.soldOutBtn}
            onPress={() => markSoldOut(item.id)}
            activeOpacity={0.88}
          >
            <Text style={styles.soldOutBtnText}>Mark as Sold Out</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
          Your account is not linked to any restaurant.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={bags}
        keyExtractor={(item) => item.id}
        renderItem={renderBag}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Restaurant header */}
            <View style={styles.restaurantHeader}>
              <View style={styles.restaurantHeaderLeft}>
                <View style={styles.restaurantAvatar}>
                  <Text style={styles.restaurantAvatarText}>
                    {restaurant.name?.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.restaurantName}>{restaurant.name}</Text>
                  <Text style={styles.restaurantMeta}>
                    📍 {restaurant.area} · {restaurant.category}
                  </Text>
                  <View style={styles.activeBadge}>
                    <View style={styles.activeDot} />
                    <Text style={styles.activeText}>Active today</Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.88}
              >
                <Text style={styles.addBtnText}>+</Text>
                <Text style={styles.addBtnLabel}>Add Bag</Text>
              </TouchableOpacity>
            </View>

            {/* Stats grid */}
            <View style={styles.statsGrid}>
              <View style={[styles.statCard, styles.statCardGreen]}>
                <Text style={styles.statEmoji}>🛍️</Text>
                <Text style={styles.statNum}>{totalBags}</Text>
                <Text style={styles.statLabel}>Bags posted</Text>
              </View>
              <View style={[styles.statCard, styles.statCardBlue]}>
                <Text style={styles.statEmoji}>🎫</Text>
                <Text style={styles.statNum}>{totalReserved}</Text>
                <Text style={styles.statLabel}>Reserved</Text>
              </View>
              <View style={[styles.statCard, styles.statCardAmber]}>
                <Text style={styles.statEmoji}>💰</Text>
                <Text style={styles.statNum}>JD {totalEarned.toFixed(0)}</Text>
                <Text style={styles.statLabel}>Earned</Text>
              </View>
              <View style={[styles.statCard, styles.statCardPurple]}>
                <Text style={styles.statEmoji}>✅</Text>
                <Text style={styles.statNum}>{availableBags}</Text>
                <Text style={styles.statLabel}>Available</Text>
              </View>
            </View>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Today's Bags</Text>
              <Text style={styles.sectionCount}>{bags.length} total</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyEmoji}>🛍️</Text>
            <Text style={styles.emptyTitle}>No bags posted today</Text>
            <Text style={styles.emptySubtitle}>
              Tap "+ Add Bag" to post your first bag and start getting
              reservations
            </Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>+ Post Your First Bag</Text>
            </TouchableOpacity>
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
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <Text style={styles.modalTitle}>Add New Bag</Text>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalCloseBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={styles.modalBody}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Bag details</Text>

              <Text style={styles.inputLabel}>Bag title *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "title" && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Surprise Pastry Bag"
                  placeholderTextColor="#B4D4B4"
                  value={title}
                  onChangeText={setTitle}
                  onFocus={() => setFocusedField("title")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={styles.inputLabel}>Description</Text>
              <View
                style={[
                  styles.inputWrapper,
                  styles.inputWrapperMulti,
                  focusedField === "desc" && styles.inputWrapperFocused,
                ]}
              >
                <TextInput
                  style={[styles.input, styles.inputMulti]}
                  placeholder="What's in the bag? (optional)"
                  placeholderTextColor="#B4D4B4"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  onFocus={() => setFocusedField("desc")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Pricing</Text>

              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Your price (JD) *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "price" && styles.inputWrapperFocused,
                    ]}
                  >
                    <Text style={styles.inputPrefix}>JD</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="3.50"
                      placeholderTextColor="#B4D4B4"
                      keyboardType="decimal-pad"
                      value={price}
                      onChangeText={setPrice}
                      onFocus={() => setFocusedField("price")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                <View style={styles.inputHalf}>
                  <Text style={styles.inputLabel}>Original value (JD) *</Text>
                  <View
                    style={[
                      styles.inputWrapper,
                      focusedField === "orig" && styles.inputWrapperFocused,
                    ]}
                  >
                    <Text style={styles.inputPrefix}>JD</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="12.00"
                      placeholderTextColor="#B4D4B4"
                      keyboardType="decimal-pad"
                      value={originalValue}
                      onChangeText={setOriginalValue}
                      onFocus={() => setFocusedField("orig")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              {price && originalValue && (
                <View style={styles.discountPreview}>
                  <Text style={styles.discountPreviewText}>
                    🏷️ Customers save{" "}
                    {Math.round(
                      (1 - parseFloat(price) / parseFloat(originalValue)) * 100,
                    )}
                    % — great deal!
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>Quantity</Text>
              <Text style={styles.inputLabel}>Number of bags *</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "qty" && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputPrefix}>🛍️</Text>
                <TextInput
                  style={styles.input}
                  placeholder="How many bags available?"
                  placeholderTextColor="#B4D4B4"
                  keyboardType="number-pad"
                  value={quantity}
                  onChangeText={setQuantity}
                  onFocus={() => setFocusedField("qty")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.modalSection}>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={addBag}
                disabled={saving}
                activeOpacity={0.88}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveBtnText}>🌿 Post Bag</Text>
                )}
              </TouchableOpacity>
            </View>

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
  },
  noRestaurantEmoji: { fontSize: 56, marginBottom: 16 },
  noRestaurantTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
  },
  noRestaurantSubtitle: { fontSize: 14, color: "#888780", textAlign: "center" },

  // Restaurant header
  restaurantHeader: {
    backgroundColor: "#2E7D32",
    padding: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurantHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    flex: 1,
  },
  restaurantAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  restaurantAvatarText: { fontSize: 18, fontWeight: "800", color: "#FFFFFF" },
  restaurantName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  restaurantMeta: { fontSize: 12, color: "#A5D6A7", marginBottom: 6 },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  activeText: { fontSize: 11, color: "#A5D6A7", fontWeight: "600" },
  addBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    minWidth: 72,
  },
  addBtnText: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "800",
    lineHeight: 26,
  },
  addBtnLabel: { fontSize: 11, color: "#A5D6A7", fontWeight: "600" },

  // Stats grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
    gap: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statCardGreen: { backgroundColor: "#E8F5E9", borderColor: "#C8E6C9" },
  statCardBlue: { backgroundColor: "#E3F2FD", borderColor: "#BBDEFB" },
  statCardAmber: { backgroundColor: "#FFF8E1", borderColor: "#FFE082" },
  statCardPurple: { backgroundColor: "#F3E5F5", borderColor: "#CE93D8" },
  statEmoji: { fontSize: 22, marginBottom: 6 },
  statNum: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, color: "#888780", textAlign: "center" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },
  sectionCount: { fontSize: 13, color: "#888780" },

  // List
  list: { paddingHorizontal: 16, paddingBottom: 32 },

  // Bag card
  bagCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 3,
  },
  bagCardSoldOut: { opacity: 0.75 },
  bagCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  bagCardHeaderLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  bagStatusDot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  bagCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 2,
  },
  textMuted: { color: "#888780" },
  bagCardMeta: { fontSize: 12, color: "#888780" },
  bagStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    marginLeft: 8,
  },
  bagStatusAvailable: { backgroundColor: "#E8F5E9" },
  bagStatusSoldOut: { backgroundColor: "#FFEBEE" },
  bagStatusText: { fontSize: 11, fontWeight: "700" },
  bagStatusTextAvailable: { color: "#2E7D32" },
  bagStatusTextSoldOut: { color: "#C62828" },

  // Price row
  bagPriceRow: {
    flexDirection: "row",
    backgroundColor: "#F8FDF8",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  bagPriceItem: { flex: 1, alignItems: "center" },
  bagPriceDivider: {
    width: 1,
    backgroundColor: "#E8F5E9",
    marginHorizontal: 4,
  },
  bagPriceLabel: {
    fontSize: 10,
    color: "#888780",
    marginBottom: 4,
    fontWeight: "500",
  },
  bagPriceValue: { fontSize: 16, fontWeight: "800", color: "#2E7D32" },
  bagPriceOriginal: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B4B2A9",
    textDecorationLine: "line-through",
  },
  bagPriceEarned: { fontSize: 16, fontWeight: "800", color: "#1565C0" },

  // Progress
  progressSection: { marginBottom: 14 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: "#5F5E5A", fontWeight: "500" },
  progressPct: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  progressBar: {
    height: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 4,
  },
  progressFooter: { marginTop: 4 },
  progressRemaining: { fontSize: 11, color: "#888780" },

  // Sold out button
  soldOutBtn: {
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#FFF5F5",
  },
  soldOutBtnText: { fontSize: 13, fontWeight: "700", color: "#C62828" },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
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
    marginBottom: 24,
  },
  emptyAddBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyAddBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  // Modal
  modal: { flex: 1, backgroundColor: "#F0F7F0" },
  modalHeader: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E9",
    paddingBottom: 16,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#E0E0E0",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  modalTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1B5E20" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F0F7F0",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCloseBtnText: { fontSize: 14, color: "#888780", fontWeight: "700" },
  modalBody: { flex: 1 },
  modalSection: { padding: 20, paddingBottom: 0 },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#888780",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B5E20",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  inputWrapperFocused: {
    borderColor: "#2E7D32",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputWrapperMulti: { alignItems: "flex-start", paddingTop: 4 },
  inputPrefix: {
    fontSize: 14,
    color: "#888780",
    marginRight: 8,
    fontWeight: "600",
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1B5E20" },
  inputMulti: { paddingTop: 8, height: 80, textAlignVertical: "top" },
  inputRow: { flexDirection: "row", gap: 12 },
  inputHalf: { flex: 1 },
  discountPreview: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  discountPreviewText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
