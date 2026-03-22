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
import { useLanguage } from "../lang/LanguageContext";

const FILTERS = ["All", "Bakery", "Restaurant", "Café"];

export default function HomeScreen({ navigation }) {
  const [bags, setBags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("All");
  const { t, isRTL } = useLanguage();

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
    const { data, error } = await supabase
      .from("bags")
      .select(
        `*, restaurants (name, category, area, logo_url, pickup_start, pickup_end)`,
      )
      .eq("status", "available")
      .gt("quantity_remaining", 0);
    if (!error) setBags(data);
    setLoading(false);
  };

  const filtered =
    activeFilter === "All"
      ? bags
      : bags.filter((b) => b.restaurants?.category === activeFilter);

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
          <ImageBackground
            source={{ uri: item.image_url }}
            style={styles.cardImage}
            imageStyle={{ borderTopLeftRadius: 16, borderTopRightRadius: 16 }}
          >
            <View style={styles.imageOverlay} />

            {/* Top row */}
            <View style={styles.imageTopRow}>
              <View style={[styles.badge, isLast && styles.badgeUrgent]}>
                <Text
                  style={[styles.badgeText, isLast && styles.badgeTextUrgent]}
                >
                  {isLast
                    ? t("lastOne")
                    : `${item.quantity_remaining} ${t("left")}`}
                </Text>
              </View>
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>-{discount}%</Text>
              </View>
            </View>

            {/* Restaurant overlay at bottom of image */}
            <View style={[styles.imageBottom, isRTL && styles.rtlRow]}>
              <Image source={{ uri: r?.logo_url }} style={styles.logo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurantNameOverlay}>{r?.name}</Text>
                <Text style={styles.areaOverlay}>📍 {r?.area}</Text>
              </View>
              <TouchableOpacity style={styles.heartBtn}>
                <Text style={styles.heartIcon}>♡</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={[styles.cardRow, isRTL && styles.rtlRow]}>
            <View style={styles.cardLeft}>
              <Text
                style={[styles.bagTitle, isRTL && styles.rtl]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <View style={[styles.metaRow, isRTL && styles.rtlRow]}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaIcon}>🕐</Text>
                  <Text style={styles.metaText}>
                    {r?.pickup_start?.slice(0, 5)} –{" "}
                    {r?.pickup_end?.slice(0, 5)}
                  </Text>
                </View>
                <View style={styles.metaDot} />
                <View style={styles.categoryTag}>
                  <Text style={styles.categoryTagText}>
                    {r?.category === "Bakery"
                      ? "🥐"
                      : r?.category === "Restaurant"
                        ? "🍽️"
                        : "☕"}{" "}
                    {r?.category}
                  </Text>
                </View>
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
                  {t("save")} {discount}%
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
      {/* Hero header */}
      <View style={styles.hero}>
        <View style={[styles.heroInner, isRTL && styles.rtlRow]}>
          <View>
            <Text style={[styles.heroTitle, isRTL && styles.rtl]}>
              {t("heroTitle")}
            </Text>
            <Text style={[styles.heroSub, isRTL && styles.rtl]}>
              {t("heroSub")}
            </Text>
          </View>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeNum}>{bags.length}</Text>
            <Text style={styles.heroBadgeLabel}>bags</Text>
          </View>
        </View>

        {/* Filters */}
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

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Finding fresh bags...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🌿</Text>
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
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Hero
  hero: {
    backgroundColor: "#2E7D32",
    paddingTop: 8,
    paddingBottom: 0,
  },
  heroInner: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  heroSub: { fontSize: 12, color: "#A5D6A7" },
  heroBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroBadgeNum: { fontSize: 20, fontWeight: "800", color: "#FFFFFF" },
  heroBadgeLabel: { fontSize: 10, color: "#A5D6A7", fontWeight: "500" },
  filterContent: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    marginRight: 8,
  },
  filterBtnActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#FFFFFF",
  },
  filterText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "500",
  },
  filterTextActive: { color: "#2E7D32", fontWeight: "700" },

  // List
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

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
    overflow: "hidden",
  },
  imageWrapper: { overflow: "hidden" },
  cardImage: { height: 160, justifyContent: "space-between" },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  imageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 10,
  },
  badge: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeUrgent: { backgroundColor: "#FFEBEE" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  badgeTextUrgent: { color: "#C62828" },
  discountBadge: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  discountText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  imageBottom: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  logo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  restaurantNameOverlay: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  areaOverlay: { fontSize: 11, color: "rgba(255,255,255,0.8)" },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.85)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartIcon: { fontSize: 16, color: "#C62828" },

  // Card body
  cardBody: { padding: 12 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLeft: { flex: 1, paddingRight: 12 },
  bagTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaIcon: { fontSize: 11 },
  metaText: { fontSize: 12, color: "#5F5E5A" },
  metaDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: "#C8E6C9" },
  categoryTag: {
    backgroundColor: "#F0F7F0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryTagText: { fontSize: 11, color: "#2E7D32", fontWeight: "600" },
  priceBlock: { alignItems: "flex-end", gap: 2 },
  originalPrice: {
    fontSize: 11,
    color: "#B4B2A9",
    textDecorationLine: "line-through",
  },
  price: { fontSize: 20, fontWeight: "800", color: "#2E7D32" },
  saveBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  saveText: { fontSize: 11, color: "#2E7D32", fontWeight: "700" },
});
