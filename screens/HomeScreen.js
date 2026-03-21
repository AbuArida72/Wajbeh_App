import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Image,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

const FILTERS = ["All", "Bakery", "Restaurant", "Café"];

export default function HomeScreen({ navigation }) {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    fetchBags();

    const subscription = supabase
      .channel("bags-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bags" },
        (payload) => {
          setBags((prevBags) =>
            prevBags.map((bag) =>
              bag.id === payload.new.id ? { ...bag, ...payload.new } : bag,
            ),
          );
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const fetchBags = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bags")
      .select(
        `
        *,
        restaurants (
          name,
          category,
          area,
          logo_url,
          pickup_start,
          pickup_end
        )
      `,
      )
      .eq("status", "available")
      .eq("available_date", new Date().toISOString().split("T")[0])
      .gt("quantity_remaining", 0);

    if (error) {
      console.log("Error fetching bags:", error);
    } else {
      setBags(data);
    }
    setLoading(false);
  };

  const filtered =
    activeFilter === "All"
      ? bags
      : bags.filter((b) => b.restaurants?.category === activeFilter);

  const renderBag = ({ item }) => {
    const restaurant = item.restaurants;
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.93}
        onPress={() =>
          navigation.navigate("BagDetail", {
            bag: {
              ...item,
              restaurant: restaurant?.name,
              area: restaurant?.area,
              category: restaurant?.category,
              logo: restaurant?.logo_url,
              pickup_start: restaurant?.pickup_start?.slice(0, 5),
              pickup_end: restaurant?.pickup_end?.slice(0, 5),
              image: item.image_url,
            },
          })
        }
      >
        {/* Image section */}
        <View style={styles.imageWrapper}>
          <ImageBackground
            source={{ uri: item.image_url }}
            style={styles.cardImage}
            imageStyle={{ borderTopLeftRadius: 18, borderTopRightRadius: 18 }}
          >
            <View style={styles.imageOverlay} />
            <View style={styles.imageTopRow}>
              <View
                style={[
                  styles.leftBadge,
                  item.quantity_remaining === 1 && styles.leftBadgeUrgent,
                ]}
              >
                <Text
                  style={[
                    styles.leftBadgeText,
                    item.quantity_remaining === 1 && styles.leftBadgeTextUrgent,
                  ]}
                >
                  {item.quantity_remaining === 1
                    ? "🔥 Last one!"
                    : `${item.quantity_remaining} left`}
                </Text>
              </View>
              <TouchableOpacity style={styles.heartBtn}>
                <Text style={styles.heartIcon}>♡</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={styles.restaurantRow}>
            <Image source={{ uri: restaurant?.logo_url }} style={styles.logo} />
            <View style={styles.restaurantInfo}>
              <Text style={styles.restaurantName}>{restaurant?.name}</Text>
              <Text style={styles.area}>
                📍 {restaurant?.area} · {restaurant?.category}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.bottomRow}>
            <View style={styles.bottomLeft}>
              <Text style={styles.bagTitle}>{item.title}</Text>
              <View style={styles.pickupRow}>
                <Text style={styles.pickupIcon}>🕐</Text>
                <Text style={styles.pickup}>
                  {restaurant?.pickup_start?.slice(0, 5)} –{" "}
                  {restaurant?.pickup_end?.slice(0, 5)}
                </Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.originalPrice}>
                JD {parseFloat(item.original_value).toFixed(2)}
              </Text>
              <Text style={styles.price}>
                JD {parseFloat(item.price).toFixed(2)}
              </Text>
              <View style={styles.saveBadge}>
                <Text style={styles.saveText}>
                  Save{" "}
                  {Math.round((1 - item.price / item.original_value) * 100)}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Good food, less waste 🌿</Text>
        <Text style={styles.heroSub}>Fresh bags available near you today</Text>
      </View>

      {/* Filter pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              activeFilter === f && styles.filterBtnActive,
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilter === f && styles.filterTextActive,
              ]}
            >
              {f === "All"
                ? "🌍 All"
                : f === "Bakery"
                  ? "🥐 Bakery"
                  : f === "Restaurant"
                    ? "🍽️ Restaurant"
                    : "☕ Café"}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Finding bags near you...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌿</Text>
          <Text style={styles.emptyTitle}>No bags available</Text>
          <Text style={styles.emptySubtitle}>Check back later today</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchBags}>
            <Text style={styles.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBag}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchBags}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  heroBanner: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroSub: { fontSize: 13, color: "#A5D6A7" },
  filterScroll: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E8F5E9",
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F7F0",
    borderWidth: 1,
    borderColor: "#C8E6C9",
    marginRight: 8,
  },
  filterBtnActive: { backgroundColor: "#2E7D32", borderColor: "#2E7D32" },
  filterText: { fontSize: 13, color: "#2E7D32", fontWeight: "500" },
  filterTextActive: { color: "#FFFFFF", fontWeight: "700" },
  list: { padding: 16, paddingBottom: 32 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#2E7D32" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 8,
  },
  emptySubtitle: { fontSize: 14, color: "#888780", marginBottom: 24 },
  refreshBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  refreshBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    marginBottom: 20,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    overflow: "hidden",
  },
  imageWrapper: {
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    overflow: "hidden",
  },
  cardImage: { height: 180, justifyContent: "space-between" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  imageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 12,
  },
  leftBadge: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  leftBadgeUrgent: { backgroundColor: "#FFEBEE" },
  leftBadgeText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  leftBadgeTextUrgent: { color: "#C62828" },
  heartBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.88)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: { fontSize: 18, color: "#C62828" },
  cardBody: { padding: 14 },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  logo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: "#E8F5E9",
  },
  restaurantInfo: { flex: 1 },
  restaurantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 2,
  },
  area: { fontSize: 12, color: "#81C784" },
  divider: { height: 1, backgroundColor: "#F1F8F1", marginBottom: 10 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  bottomLeft: { flex: 1, paddingRight: 12 },
  bagTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2C2C2A",
    marginBottom: 6,
  },
  pickupRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickupIcon: { fontSize: 12 },
  pickup: { fontSize: 12, color: "#5F5E5A" },
  priceBlock: { alignItems: "flex-end" },
  originalPrice: {
    fontSize: 12,
    color: "#B4B2A9",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  price: { fontSize: 22, fontWeight: "800", color: "#2E7D32", marginBottom: 4 },
  saveBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveText: { fontSize: 11, color: "#2E7D32", fontWeight: "700" },
});
