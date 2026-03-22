import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [bags, setBags] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [focused, setFocused] = useState(false);
  const { t, isRTL } = useLanguage();

  useEffect(() => {
    fetchBags();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setFiltered(bags);
    } else {
      const q = query.toLowerCase();
      setFiltered(
        bags.filter(
          (b) =>
            b.restaurants?.name?.toLowerCase().includes(q) ||
            b.restaurants?.area?.toLowerCase().includes(q) ||
            b.restaurants?.category?.toLowerCase().includes(q) ||
            b.title?.toLowerCase().includes(q),
        ),
      );
    }
  }, [query, bags]);

  const fetchBags = async () => {
    const { data, error } = await supabase
      .from("bags")
      .select(
        `*, restaurants (name, category, area, logo_url, pickup_start, pickup_end)`,
      )
      .eq("status", "available")
      .gt("quantity_remaining", 0);
    if (!error) {
      setBags(data);
      setFiltered(data);
    }
    setLoading(false);
  };

  const renderBag = ({ item }) => {
    const r = item.restaurants;
    const discount = Math.round((1 - item.price / item.original_value) * 100);
    const isLast = item.quantity_remaining === 1;

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.92}
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
            <View style={[styles.imageBottom, isRTL && styles.rtlRow]}>
              <Image source={{ uri: r?.logo_url }} style={styles.logo} />
              <View style={{ flex: 1 }}>
                <Text style={styles.restaurantNameOverlay}>{r?.name}</Text>
                <Text style={styles.areaOverlay}>
                  📍 {r?.area} · {r?.category}
                </Text>
              </View>
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
                <Text style={styles.metaIcon}>🕐</Text>
                <Text style={styles.metaText}>
                  {r?.pickup_start?.slice(0, 5)} – {r?.pickup_end?.slice(0, 5)}
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
                  {t("save")} {discount}%
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const QUICK_FILTERS = ["Bakery", "Restaurant", "Café", "Abdoun", "Sweifieh"];

  return (
    <View style={styles.container}>
      {/* Search header */}
      <View style={styles.header}>
        <View style={[styles.searchBar, focused && styles.searchBarFocused]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor="#A5C8A5"
            value={query}
            onChangeText={setQuery}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {query.length > 0 && (
            <TouchableOpacity
              style={styles.clearBtn}
              onPress={() => setQuery("")}
            >
              <Text style={styles.clearBtnText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick filter chips */}
        {query.length === 0 && (
          <View style={styles.quickFilters}>
            {QUICK_FILTERS.map((f) => (
              <TouchableOpacity
                key={f}
                style={styles.quickChip}
                onPress={() => setQuery(f)}
              >
                <Text style={styles.quickChipText}>{f}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results count */}
      {query.length >= 2 && (
        <View style={[styles.resultsBar, isRTL && styles.rtlRow]}>
          <Text style={[styles.resultsText, isRTL && styles.rtl]}>
            {filtered.length} {t("results")} "
            <Text style={styles.resultsQuery}>{query}</Text>"
          </Text>
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty search state */}
      {query.length === 0 && !loading && (
        <View style={styles.emptySearchHeader}>
          <Text style={[styles.emptySearchTitle, isRTL && styles.rtl]}>
            All available bags today
          </Text>
          <Text style={[styles.emptySearchSub, isRTL && styles.rtl]}>
            {bags.length} bags from{" "}
            {new Set(bags.map((b) => b.restaurants?.name)).size} restaurants
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Text style={styles.noResultsEmoji}>🔍</Text>
          <Text style={[styles.noResultsTitle, isRTL && styles.rtl]}>
            No results found
          </Text>
          <Text style={[styles.noResultsSub, isRTL && styles.rtl]}>
            Try searching for a restaurant name, area, or category
          </Text>
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => setQuery("")}
          >
            <Text style={styles.clearSearchBtnText}>Clear search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBag}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Header
  header: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: "transparent",
  },
  searchBarFocused: {
    borderColor: "#A5D6A7",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#1B5E20" },
  inputRTL: { textAlign: "right" },
  clearBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F0F7F0",
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtnText: { fontSize: 12, color: "#888780", fontWeight: "700" },

  // Quick filters
  quickFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  quickChipText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  // Results bar
  resultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  resultsText: { fontSize: 13, color: "#5F5E5A" },
  resultsQuery: { fontWeight: "700", color: "#2E7D32" },
  clearText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },

  // Empty search header
  emptySearchHeader: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  emptySearchTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 2,
  },
  emptySearchSub: { fontSize: 12, color: "#888780" },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#2E7D32" },

  // No results
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noResultsEmoji: { fontSize: 48, marginBottom: 16 },
  noResultsTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 8,
  },
  noResultsSub: {
    fontSize: 14,
    color: "#888780",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  clearSearchBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  clearSearchBtnText: { color: "#FFFFFF", fontWeight: "700", fontSize: 14 },

  // List
  list: { padding: 16, paddingBottom: 32 },

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
    backgroundColor: "rgba(0,0,0,0.45)",
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
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaIcon: { fontSize: 11 },
  metaText: { fontSize: 12, color: "#5F5E5A" },
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
