import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassPanel, T, ar, SkeletonBox, FONTS } from "../components/Glass";
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
    return haversineKm(userLocation.latitude, userLocation.longitude, r.latitude, r.longitude);
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

  const AnimatedCard = ({ item }) => {
    const scale = useRef(new Animated.Value(1)).current;
    const onPressIn = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
    const onPressOut = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, speed: 20, bounciness: 4 }).start();
    const r = item.restaurants;
    const discount = Math.round((1 - item.price / item.original_value) * 100);
    const isLast = item.quantity_remaining === 1;
    const dist = item._distance;
    return (
      <Animated.View style={[styles.cardWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
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
        <View style={styles.card}>
          {/* ── Image block with gradient overlay ── */}
          <View style={styles.imageBlock}>
            <Image
              source={{ uri: item.image_url }}
              style={styles.thumb}
              resizeMode="cover"
            />

            {/* Dark gradient at bottom for text legibility */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.72)"]}
              style={styles.imageGradient}
            />

            {/* Top badges */}
            {isLast ? (
              <View style={[styles.qtyBadge, styles.qtyBadgeUrgent, { [isRTL ? "right" : "left"]: 12 }]}>
                <Text style={styles.qtyText}>{t("lastOne")}</Text>
              </View>
            ) : (
              <View style={[styles.qtyBadge, { [isRTL ? "right" : "left"]: 12 }]}>
                <Text style={styles.qtyText}>{item.quantity_remaining} {t("left")}</Text>
              </View>
            )}

            <View style={[styles.discountBadge, { [isRTL ? "left" : "right"]: 12 }]}>
              <Text style={styles.discountText}>−{discount}%</Text>
            </View>

            {/* Restaurant info overlaid on gradient */}
            <View style={[styles.imageBottom, isRTL && styles.rtlRow]}>
              <Image source={{ uri: r?.logo_url }} style={styles.overlayLogo} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.overlayName, isRTL && styles.rtl]} numberOfLines={1}>
                  {r?.name}
                </Text>
                <Text style={[styles.overlayArea, isRTL && styles.rtl]} numberOfLines={1}>
                  {r?.area} · {r?.category}
                </Text>
              </View>
              {dist !== null && (
                <View style={styles.distBadge}>
                  <Text style={styles.distText}>
                    {dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)}km`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* ── Card footer ── */}
          <View style={[styles.cardFooter, isRTL && styles.rtlRow]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.bagTitle, isRTL && styles.rtl, ar(isRTL, "semiBold")]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={[styles.timeRow, isRTL && styles.rtlRow]}>
                <Ionicons name="time-outline" size={11} color={T.muteStrong} />
                <Text style={styles.pickupText}>
                  {r?.pickup_start?.slice(0, 5)} – {r?.pickup_end?.slice(0, 5)}
                </Text>
              </View>
            </View>
            <View style={styles.priceBlock}>
              <Text style={styles.originalPrice}>JD {parseFloat(item.original_value).toFixed(2)}</Text>
              <Text style={styles.price}>JD {parseFloat(item.price).toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Green header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={[styles.headerTop, isRTL && styles.rtlRow]}>
          <View style={{ flex: 1 }}>
            <Text style={styles.brandLabel}>Wajbeh</Text>
            <Text style={[styles.headerTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>
              {t("todaysAvailableBags") || "Today's Bags"}
            </Text>
          </View>
          <View style={styles.countPill}>
            <Text style={styles.countPillNum}>{bags.length}</Text>
            <Text style={styles.countPillLabel}>{t("bagsUnit")}</Text>
          </View>
        </View>

        {userLocation && (
          <Text style={styles.nearestText}>
            <Ionicons name="navigate-circle-outline" size={11} color="rgba(255,255,255,0.60)" />{" "}
            {t("nearestFirst")}
          </Text>
        )}

        {/* Filter pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
          style={{ marginTop: 16 }}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity
              key={f}
              onPress={() => setActiveFilter(f)}
              style={[styles.filterPill, activeFilter === f && styles.filterPillActive]}
              activeOpacity={0.75}
            >
              <Text style={[styles.filterPillText, activeFilter === f && styles.filterPillTextActive]}>
                {getFilterLabel(f)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Content */}
      <View style={styles.body}>
        {loading ? (
          <View style={{ padding: 16, gap: 14 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.card, { overflow: "hidden" }]}>
                <SkeletonBox width="100%" height={200} radius={0} />
                <View style={{ padding: 14, gap: 8, flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1, gap: 6 }}>
                    <SkeletonBox width="60%" height={14} radius={6} />
                    <SkeletonBox width="40%" height={11} radius={6} />
                  </View>
                  <SkeletonBox width={70} height={32} radius={8} />
                </View>
              </View>
            ))}
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.center}>
            <Ionicons name="bag-handle-outline" size={48} color={T.muteStrong} />
            <Text style={[styles.emptyTitle, isRTL && styles.rtl]}>{t("noBagsTitle")}</Text>
            <Text style={[styles.emptyText, isRTL && styles.rtl]}>{t("noBagsSubtitle")}</Text>
            <TouchableOpacity onPress={fetchBags} style={styles.refreshBtn}>
              <Text style={styles.refreshBtnText}>{t("refresh")}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <AnimatedCard item={item} />}
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            onRefresh={fetchBags}
            refreshing={loading}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Header
  header: {
    backgroundColor: T.green,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  locationLabel: { fontSize: 11, color: "rgba(255,255,255,0.65)", fontWeight: "500", letterSpacing: 0.3 },
  brandLabel: { fontSize: 9, fontWeight: "700", color: "rgba(255,255,255,0.45)", letterSpacing: 2.2, textTransform: "uppercase", marginBottom: 4, fontFamily: FONTS.bold },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#FFFFFF", letterSpacing: -0.7, fontFamily: FONTS.bold },
  countPill: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center", minWidth: 48,
  },
  countPillNum: { fontSize: 22, fontWeight: "800", color: "#FFFFFF", lineHeight: 24, fontFamily: FONTS.bold },
  countPillLabel: { fontSize: 9, fontWeight: "600", color: "rgba(255,255,255,0.70)", letterSpacing: 0.5, textTransform: "uppercase", marginTop: 1 },
  nearestText: { fontSize: 11, color: "rgba(255,255,255,0.60)", marginTop: 4 },

  // Filter pills
  filtersRow: { gap: 8, paddingBottom: 2 },
  filterPill: {
    borderRadius: 100, paddingHorizontal: 16, paddingVertical: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.22)",
  },
  filterPillActive: { backgroundColor: "#FFFFFF" },
  filterPillText: { fontSize: 13, fontWeight: "600", color: "rgba(255,255,255,0.82)" },
  filterPillTextActive: { color: T.green },

  // Body
  body: { flex: 1, backgroundColor: T.bg },
  list: { paddingTop: 16, paddingHorizontal: 16 },

  // Card
  cardWrapper: { marginBottom: 16 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 4,
  },

  // Image block
  imageBlock: { width: "100%", height: 200, position: "relative" },
  thumb: { width: "100%", height: 200, backgroundColor: T.border },
  imageGradient: {
    position: "absolute", left: 0, right: 0, bottom: 0, height: 110,
  },

  // Badges on image
  qtyBadge: {
    position: "absolute", top: 12,
    backgroundColor: "rgba(0,0,0,0.52)",
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100,
  },
  qtyBadgeUrgent: { backgroundColor: T.urgent },
  qtyText: { fontSize: 10, fontWeight: "700", color: "#fff" },
  discountBadge: {
    position: "absolute", top: 12,
    backgroundColor: T.accent,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100,
  },
  discountText: { fontSize: 11, fontWeight: "800", color: "#fff" },

  // Restaurant info overlaid on gradient
  imageBottom: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingBottom: 12,
  },
  overlayLogo: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1.5, borderColor: "rgba(255,255,255,0.30)",
  },
  overlayName: { fontSize: 14, fontWeight: "700", color: "#FFFFFF", letterSpacing: -0.2 },
  overlayArea: { fontSize: 11, color: "rgba(255,255,255,0.72)", marginTop: 1 },
  distBadge: {
    backgroundColor: "rgba(255,255,255,0.18)",
    borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
  },
  distText: { fontSize: 11, fontWeight: "600", color: "#FFFFFF" },

  // Card footer
  cardFooter: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  bagTitle: { fontSize: 15, fontWeight: "700", color: T.ink, letterSpacing: -0.2, marginBottom: 3, fontFamily: FONTS.bold },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickupText: { fontSize: 11, color: T.mute },
  priceBlock: { alignItems: "flex-end" },
  originalPrice: { fontSize: 11, color: T.muteStrong, textDecorationLine: "line-through" },
  price: { fontSize: 20, fontWeight: "800", color: T.accent, letterSpacing: -0.4 },

  // Empty state
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: T.ink, textAlign: "center" },
  emptyText: { fontSize: 13, color: T.mute, textAlign: "center" },
  refreshBtn: {
    backgroundColor: T.green, paddingHorizontal: 24, paddingVertical: 12,
    borderRadius: 100, marginTop: 4,
  },
  refreshBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
});
