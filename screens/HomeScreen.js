import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const FILTERS = ["All", "Bakery", "Restaurant", "Café"];

export default function HomeScreen({ navigation }) {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const [userLocation, setUserLocation] = useState(null);
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    requestLocationAndFetch();
    const subscription = supabase
      .channel("bags-channel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "bags" },
        (payload) => {
          setBags((prev) =>
            prev.map((bag) =>
              bag.id === payload.new.id ? { ...bag, ...payload.new } : bag,
            ),
          );
        },
      )
      .subscribe();
    return () => supabase.removeChannel(subscription);
  }, []);

  const requestLocationAndFetch = async () => {
    let loc = null;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      loc = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      };
      setUserLocation(loc);
    }
    fetchBags();
  };

  const fetchBags = async () => {
    setLoading(true);
    const todayDate = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
    const { data, error } = await supabase
      .from("bags")
      .select(
        `*, restaurants (name, category, area, logo_url, pickup_start, pickup_end, latitude, longitude)`,
      )
      .eq("status", "available")
      .eq("available_date", todayDate)
      .gt("quantity_remaining", 0);
    if (!error) setBags(data);
    setLoading(false);
  };

  const getDistance = (bag) => {
    const r = bag.restaurants;
    if (!userLocation || !r?.latitude || !r?.longitude) return null;
    return haversineKm(
      userLocation.latitude,
      userLocation.longitude,
      r.latitude,
      r.longitude,
    );
  };

  const bagsWithDistance = bags.map((b) => ({ ...b, _distance: getDistance(b) }));

  const sortedBags = [...bagsWithDistance].sort((a, b) => {
    if (a._distance !== null && b._distance !== null) return a._distance - b._distance;
    if (a._distance !== null) return -1;
    if (b._distance !== null) return 1;
    return 0;
  });

  const filtered =
    activeFilter === "All"
      ? sortedBags
      : sortedBags.filter((b) => b.restaurants?.category === activeFilter);

  const getFilterLabel = (f) => {
    if (f === "All") return t("filterAll");
    if (f === "Bakery") return t("filterBakery");
    if (f === "Restaurant") return t("filterRestaurant");
    return t("filterCafe");
  };

  const renderBag = ({ item }) => {
    const r = item.restaurants;
    const discount = Math.round((1 - item.price / item.original_value) * 100);
    const isLast = item.quantity_remaining === 1;
    const dist = item._distance;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.93}
        onPress={() =>
          navigation.navigate("BagDetail", {
            bag: {
              ...item,
              restaurant: r?.name,
              area: r?.area,
              category: r?.category,
              logo: r?.logo_url,
              pickup_start: r?.pickup_start?.slice(0, 5),
              pickup_end: r?.pickup_end?.slice(0, 5),
              image: item.image_url,
            },
          })
        }
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          <Image
            source={{ uri: item.image_url }}
            style={styles.cardImage}
          />
          {/* Quantity badge top-left */}
          <View style={[styles.qtyBadge, isLast && styles.qtyBadgeUrgent]}>
            <Text style={[styles.qtyBadgeText, isLast && styles.qtyBadgeTextUrgent]}>
              {isLast ? t("lastOne") : `${item.quantity_remaining} ${t("left")}`}
            </Text>
          </View>
          {/* Discount badge top-right */}
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          {/* Restaurant row */}
          <View style={[styles.restaurantRow, isRTL && styles.rtlRow]}>
            <Image source={{ uri: r?.logo_url }} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.restaurantName, isRTL && styles.rtl]} numberOfLines={1}>
                {r?.name}
              </Text>
              <View style={[styles.areaRow, isRTL && styles.rtlRow]}>
                <Ionicons name="location-outline" size={11} color="#B8B8B8" />
                <Text style={styles.areaText} numberOfLines={1}>
                  {r?.area}
                </Text>
                {dist !== null && (
                  <Text style={styles.distanceText}>
                    {dist < 1
                      ? `${Math.round(dist * 1000)}m`
                      : `${dist.toFixed(1)}km`}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Bag title */}
          <Text style={[styles.bagTitle, isRTL && styles.rtl]} numberOfLines={1}>
            {item.title}
          </Text>

          {/* Pickup time */}
          <View style={[styles.pickupRow, isRTL && styles.rtlRow]}>
            <Ionicons name="time-outline" size={12} color="#B8B8B8" />
            <Text style={styles.pickupText}>
              {r?.pickup_start?.slice(0, 5)} – {r?.pickup_end?.slice(0, 5)}
            </Text>
          </View>

          {/* Price row */}
          <View style={[styles.priceRow, isRTL && styles.rtlRow]}>
            <Text style={styles.originalPrice}>
              JD {parseFloat(item.original_value).toFixed(2)}
            </Text>
            <Text style={styles.price}>
              JD {parseFloat(item.price).toFixed(2)}
            </Text>
            <View style={styles.savePill}>
              <Text style={styles.saveText}>
                {t("save")} {discount}%
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.brand}>Wajbeh</Text>
          <Text style={[styles.brandSub, isRTL && styles.rtl]}>{t("todaysAvailableBags")}</Text>
          <View style={[styles.countBadge, isRTL ? styles.countBadgeLeft : styles.countBadgeRight]}>
            <Text style={styles.countNum}>{bags.length}</Text>
            <Text style={styles.countLabel}>{t("bagsUnit")}</Text>
          </View>
        </View>

        {/* Location indicator */}
        {userLocation && (
          <View style={styles.locationBar}>
            <Ionicons name="location-outline" size={12} color="#B8B8B8" />
            <Text style={[styles.locationBarText, isRTL && styles.rtl]}>{t("nearestFirst")}</Text>
          </View>
        )}

        {/* Filter chips — distinct section */}
        <View style={styles.filterSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
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
                  {getFilterLabel(f)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={[styles.loadingText, isRTL && styles.rtl]}>{t("findingBags")}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-handle-outline" size={48} color="#B8B8B8" />
          <Text style={[styles.emptyTitle, isRTL && styles.rtl]}>
            {t("noBagsTitle")}
          </Text>
          <Text style={[styles.emptySubtitle, isRTL && styles.rtl]}>
            {t("noBagsSubtitle")}
          </Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={fetchBags}>
            <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBag}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchBags}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Header
  header: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerTop: {
    alignItems: "center",
    paddingBottom: 20,
  },
  brand: { fontSize: 22, fontWeight: "700", color: "#FFFFFF" },
  brandSub: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },
  countBadge: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  countBadgeRight: { position: "absolute", right: 0, top: 0 },
  countBadgeLeft: { position: "absolute", left: 0, top: 0 },
  countNum: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  countLabel: { fontSize: 10, color: "rgba(255,255,255,0.7)", fontWeight: "600" },

  locationBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingBottom: 6,
  },
  locationBarText: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "500" },

  // Filters
  filterSection: {
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: -20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  filterContent: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    marginRight: 6,
  },
  filterBtnActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  filterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  filterTextActive: { color: "#1B5E20", fontWeight: "700" },

  // List
  list: { paddingHorizontal: 0, paddingTop: 12, paddingBottom: 32 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#737373" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F0F0F",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtitle: { fontSize: 14, color: "#737373", textAlign: "center" },
  refreshBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  refreshBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  imageWrapper: {
    position: "relative",
  },
  cardImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#F0F0F0",
  },
  qtyBadge: {
    position: "absolute",
    top: 10,
    left: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  qtyBadgeUrgent: { backgroundColor: "#C62828" },
  qtyBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  qtyBadgeTextUrgent: { color: "#FFFFFF" },
  discountBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#F57F17",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  discountText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },

  // Card body
  cardBody: { padding: 14 },
  restaurantRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    backgroundColor: "#F0F0F0",
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 2,
  },
  areaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  areaText: { fontSize: 12, color: "#B8B8B8", flex: 1 },
  distanceText: {
    fontSize: 11,
    color: "#00838F",
    fontWeight: "600",
  },
  bagTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 6,
  },
  pickupRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 10,
  },
  pickupText: { fontSize: 12, color: "#737373" },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originalPrice: {
    fontSize: 12,
    color: "#B8B8B8",
    textDecorationLine: "line-through",
    alignSelf: "center",
  },
  price: { fontSize: 20, fontWeight: "700", color: "#0F0F0F" },
  savePill: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  saveText: { fontSize: 11, color: "#2E7D32", fontWeight: "700" },
});
