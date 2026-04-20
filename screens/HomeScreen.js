import { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassPanel, Chip, T, WallpaperBackground, TextBackdrop, ar, SkeletonBox } from "../components/Glass";
import { useLocation } from "../lib/LocationContext";

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
  const { t, isRTL } = useLanguage();
  const { cityName, userLocation: contextLocation } = useLocation();
  const [userLocation, setUserLocation] = useState(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (contextLocation) setUserLocation(contextLocation);
  }, [contextLocation]);

  useEffect(() => {
    fetchBags();
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

  const fetchBags = async () => {
    setLoading(true);
    const todayDate = new Date().toLocaleDateString("en-CA");
    const { data, error } = await supabase
      .from("bags")
      .select(
        "*, restaurants (name, category, area, logo_url, pickup_start, pickup_end, latitude, longitude)",
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

  const bagsWithDistance = bags.map((b) => ({
    ...b,
    _distance: getDistance(b),
  }));
  const sortedBags = [...bagsWithDistance].sort((a, b) => {
    if (a._distance !== null && b._distance !== null)
      return a._distance - b._distance;
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
        activeOpacity={0.9}
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
              image: r?.logo_url,
            },
          })
        }
        style={styles.cardWrapper}
      >
        <GlassPanel radius={20} style={styles.card}>
          {/* Image */}
          <View style={styles.thumbWrapper}>
            <Image
              source={{ uri: r?.logo_url }}
              style={styles.thumb}
              resizeMode="cover"
            />
            <View style={[styles.qtyBadge, isLast && styles.qtyBadgeUrgent, { [isRTL ? "right" : "left"]: 10 }]}>
              <Text style={styles.qtyText}>
                {isLast ? t("lastOne") : `${item.quantity_remaining} ${t("left")}`}
              </Text>
            </View>
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>−{discount}%</Text>
            </View>
          </View>

          {/* Card body */}
          <View style={styles.cardBody}>
            {/* Restaurant row */}
            <View style={[styles.restaurantRow, isRTL && styles.rtlRow]}>
              <Image source={{ uri: r?.logo_url }} style={styles.logo} />
              <Text style={[styles.restaurantName, isRTL && styles.rtl, ar(isRTL, "medium")]} numberOfLines={1}>
                {r?.name}
              </Text>
              <Text style={styles.areaDot}>·</Text>
              <Text style={styles.areaText} numberOfLines={1}>{r?.area}</Text>
            </View>

            {/* Bag title */}
            <Text style={[styles.bagTitle, isRTL && styles.rtl, ar(isRTL, "semiBold")]} numberOfLines={2}>
              {item.title}
            </Text>

            {/* Pickup + distance */}
            <View style={[styles.metaRow, isRTL && styles.rtlRow]}>
              <View style={[styles.metaItem, isRTL && styles.rtlRow]}>
                <Ionicons name="time-outline" size={11} color={T.muteStrong} />
                <Text style={styles.pickupText}>
                  {r?.pickup_start?.slice(0, 5)} – {r?.pickup_end?.slice(0, 5)}
                </Text>
              </View>
              {dist !== null && (
                <Text style={styles.distText}>
                  {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                </Text>
              )}
            </View>

            {/* Price row */}
            <View style={[styles.priceRow, isRTL && styles.rtlRow]}>
              <Text style={styles.originalPrice}>
                JD {parseFloat(item.original_value).toFixed(2)}
              </Text>
              <Text style={styles.price}>
                JD {parseFloat(item.price).toFixed(2)}
              </Text>
            </View>
          </View>
        </GlassPanel>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar
        barStyle="dark-content"
        translucent
        backgroundColor="transparent"
      />

      {/* Wallpaper */}
      <WallpaperBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={[styles.headerTop, isRTL && styles.rtlRow]}>
          <View>
            <Text style={[styles.locationLabel, isRTL && styles.rtl]}>
              {cityName || t("ammanJordan")}
            </Text>
            <Text style={[styles.headerTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>
              {t("todaysAvailableBags") || "Today's bags"}
            </Text>
          </View>
          <GlassPanel
            radius={100}
            style={{ paddingHorizontal: 12, paddingVertical: 6 }}
          >
            <Text style={{ fontSize: 12, fontWeight: "700", color: T.ink }}>
              {bags.length} {t("bagsUnit") || "bags"}
            </Text>
          </GlassPanel>
        </View>

        {userLocation && (
          <Text style={[styles.nearestText, isRTL && styles.rtl]}>
            {t("nearestFirst")}
          </Text>
        )}

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={{ marginTop: 12 }}
        >
          {FILTERS.map((f) => (
            <Chip
              key={f}
              active={activeFilter === f}
              onPress={() => setActiveFilter(f)}
              style={{ marginRight: 6 }}
            >
              {getFilterLabel(f)}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      {loading ? (
        <View style={{ paddingHorizontal: 16, paddingTop: 12, gap: 14 }}>
          {[0, 1, 2].map((i) => (
            <GlassPanel key={i} radius={20} style={{ overflow: "hidden" }}>
              <SkeletonBox width="100%" height={170} radius={0} />
              <View style={{ padding: 14, gap: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <SkeletonBox width={20} height={20} radius={10} />
                  <SkeletonBox width={120} height={12} radius={6} />
                </View>
                <SkeletonBox width="80%" height={16} radius={6} />
                <SkeletonBox width="50%" height={11} radius={6} />
                <SkeletonBox width={80} height={20} radius={6} />
              </View>
            </GlassPanel>
          ))}
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="bag-handle-outline" size={48} color={T.muteStrong} />
          <Text style={[styles.emptyTitle, isRTL && styles.rtl]}>
            {t("noBagsTitle")}
          </Text>
          <Text style={[styles.emptyText, isRTL && styles.rtl]}>
            {t("noBagsSubtitle")}
          </Text>
          <TouchableOpacity onPress={fetchBags} style={styles.refreshBtn}>
            <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBag}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 20 },
          ]}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchBags}
          refreshing={loading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Header
  header: { paddingHorizontal: 20, paddingBottom: 8 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 4,
  },
  locationLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: T.muteStrong,
    fontWeight: "600",
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.6,
  },
  nearestText: { fontSize: 11, color: T.muteStrong, marginTop: 2 },
  filtersRow: { gap: 6, paddingBottom: 4 },

  // List
  list: { paddingTop: 12, paddingHorizontal: 16 },

  // Card
  cardWrapper: { marginBottom: 14 },
  card: { overflow: "hidden" },

  thumbWrapper: {
    width: "100%",
    height: 170,
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: 170,
    backgroundColor: "rgba(26,34,24,0.08)",
  },
  qtyBadge: {
    position: "absolute",
    top: 10,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  qtyBadgeUrgent: { backgroundColor: T.urgent },
  qtyText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  discountBadge: {
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: T.accent,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
  },
  discountText: { fontSize: 11, fontWeight: "700", color: "#fff" },

  cardBody: { padding: 14, gap: 6 },
  restaurantRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  logo: { width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(26,34,24,0.08)" },
  restaurantName: {
    fontSize: 12,
    fontWeight: "600",
    color: T.ink,
    flexShrink: 1,
  },
  areaDot: { fontSize: 11, color: T.muteStrong },
  areaText: { fontSize: 11, color: T.muteStrong, flexShrink: 1 },
  bagTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.ink,
    letterSpacing: -0.3,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickupText: { fontSize: 11, color: T.muteStrong },
  distText: { fontSize: 11, fontWeight: "700", color: T.green },

  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
    marginTop: 2,
  },
  originalPrice: {
    fontSize: 12,
    color: T.muteStrong,
    textDecorationLine: "line-through",
  },
  price: {
    fontSize: 20,
    fontWeight: "800",
    color: T.accent,
    letterSpacing: -0.4,
  },

  // States
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: T.ink,
    textAlign: "center",
  },
  emptyText: { fontSize: 13, color: T.mute, textAlign: "center" },
  refreshBtn: {
    backgroundColor: T.green,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 100,
    marginTop: 4,
  },
  refreshBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
