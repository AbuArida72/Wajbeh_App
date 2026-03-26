import { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const QUICK_FILTERS = [
  { label: "Bakery", bg: "#FFF8E1", text: "#E65100", border: "#FFE082" },
  { label: "Restaurant", bg: "#E8F5E9", text: "#2E7D32", border: "#A5D6A7" },
  { label: "Café", bg: "#FBE9E7", text: "#BF360C", border: "#FFCCBC" },
  { label: "Abdoun", bg: "#E3F2FD", text: "#1565C0", border: "#BBDEFB" },
  { label: "Sweifieh", bg: "#E3F2FD", text: "#1565C0", border: "#BBDEFB" },
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [bags, setBags] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

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
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).toISOString();
    const { data, error } = await supabase
      .from("bags")
      .select(
        `*, restaurants (name, category, area, logo_url)`,
      )
      .eq("status", "available")
      .gt("quantity_remaining", 0)
      .gte("created_at", todayStart)
      .lt("created_at", todayEnd);
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
      <View style={styles.cardWrapper}>
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
              pickup_start: item.pickup_start?.slice(0, 5),
              pickup_end: item.pickup_end?.slice(0, 5),
              image: item.image_url,
            },
          })
        }
      >
        {/* Image */}
        <View style={styles.imageWrapper}>
          <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          <View style={[styles.qtyBadge, isLast && styles.qtyBadgeUrgent]}>
            <Text style={[styles.qtyBadgeText, isLast && styles.qtyBadgeTextUrgent]}>
              {isLast ? t("lastOne") : `${item.quantity_remaining} ${t("left")}`}
            </Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>-{discount}%</Text>
          </View>
        </View>

        {/* Card body */}
        <View style={styles.cardBody}>
          <View style={[styles.restaurantRow, isRTL && styles.rtlRow]}>
            <Image source={{ uri: r?.logo_url }} style={styles.logo} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.restaurantName, isRTL && styles.rtl]} numberOfLines={1}>
                {r?.name}
              </Text>
              <View style={[styles.metaRow, isRTL && styles.rtlRow]}>
                <Ionicons name="location-outline" size={11} color="#B8B8B8" />
                <Text style={styles.areaText}>{r?.area}</Text>
                <Text style={styles.dotSep}>·</Text>
                <Text style={styles.categoryText}>{r?.category}</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.bagTitle, isRTL && styles.rtl]} numberOfLines={1}>
            {item.title}
          </Text>

          <View style={[styles.bottomRow, isRTL && styles.rtlRow]}>
            <View style={[styles.pickupRow, isRTL && styles.rtlRow]}>
              <Ionicons name="time-outline" size={12} color="#B8B8B8" />
              <Text style={styles.pickupText}>
                {item.pickup_start?.slice(0, 5)} – {item.pickup_end?.slice(0, 5)}
              </Text>
            </View>
            <View style={styles.priceGroup}>
              <Text style={styles.originalPrice}>
                JD {parseFloat(item.original_value).toFixed(2)}
              </Text>
              <Text style={styles.price}>
                JD {parseFloat(item.price).toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
      {/* Search header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.headerTitle}>{t("searchTitle")}</Text>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color="rgba(255,255,255,0.7)" style={styles.searchIcon} />
          <TextInput
            style={[styles.input, isRTL && styles.inputRTL]}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor="rgba(255,255,255,0.5)"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick filter chips */}
        {query.length === 0 && (
          <View style={styles.quickFilters}>
            {QUICK_FILTERS.map((f) => (
              <TouchableOpacity
                key={f.label}
                style={[styles.quickChip, { backgroundColor: f.bg, borderColor: f.border }]}
                onPress={() => setQuery(f.label)}
              >
                <Text style={[styles.quickChipText, { color: f.text }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Results count */}
      {query.length >= 2 && (
        <View style={[styles.resultsBar, isRTL && styles.rtlRow]}>
          <Text style={[styles.resultsText, isRTL && styles.rtl]}>
            {filtered.length} {t("results")}{" "}
            <Text style={styles.resultsQuery}>"{query}"</Text>
          </Text>
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearText}>{t("clearBtn")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Empty search header */}
      {query.length === 0 && !loading && (
        <View style={styles.browseHeader}>
          <Text style={[styles.browseTitle, isRTL && styles.rtl]}>
            {t("allBagsToday")}
          </Text>
          <Text style={[styles.browseSub, isRTL && styles.rtl]}>
            {bags.length} {t("bagsFrom")}{" "}
            {new Set(bags.map((b) => b.restaurants?.name)).size} {t("restaurantsCount")}
          </Text>
        </View>
      )}

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2E7D32" />
          <Text style={styles.loadingText}>{t("searchingText")}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search-outline" size={48} color="#B8B8B8" />
          <Text style={[styles.noResultsTitle, isRTL && styles.rtl]}>
            {t("noResultsTitle")}
          </Text>
          <Text style={[styles.noResultsSub, isRTL && styles.rtl]}>
            {t("noResultsSub")}
          </Text>
          <TouchableOpacity
            style={styles.clearSearchBtn}
            onPress={() => setQuery("")}
          >
            <Text style={styles.clearSearchBtnText}>{t("clearSearch")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBag}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={<View style={{ height: 12 }} />}
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
    paddingBottom: 20,
    borderBottomWidth: 0,
    gap: 12,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#FFFFFF", textAlign: "center" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: { marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#FFFFFF" },
  inputRTL: { textAlign: "right" },

  // Quick filters
  quickFilters: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  quickChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickChipText: { fontSize: 13, fontWeight: "600" },

  // Results bar
  resultsBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  resultsText: { fontSize: 13, color: "#737373" },
  resultsQuery: { fontWeight: "600", color: "#0F0F0F" },
  clearText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },

  // Browse header
  browseHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#F9FBE7",
    borderBottomWidth: 1,
    borderBottomColor: "#DCEDC8",
  },
  browseTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#33691E",
    marginBottom: 2,
    textAlign: "center",
  },
  browseSub: { fontSize: 12, color: "#558B2F", textAlign: "center" },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: { fontSize: 14, color: "#737373" },

  // No results
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  noResultsTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F0F0F",
    marginTop: 8,
  },
  noResultsSub: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 20,
  },
  clearSearchBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  clearSearchBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  // List
  list: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 32 },

  // Card
  cardWrapper: {
    marginHorizontal: 12,
    marginBottom: 12,
    borderRadius: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    overflow: "hidden",
  },
  imageWrapper: { position: "relative" },
  cardImage: { width: "100%", height: 200, backgroundColor: "#F0F0F0" },
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
  restaurantName: { fontSize: 14, fontWeight: "600", color: "#0F0F0F", marginBottom: 2 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  areaText: { fontSize: 12, color: "#B8B8B8" },
  dotSep: { fontSize: 12, color: "#B8B8B8" },
  categoryText: { fontSize: 12, color: "#B8B8B8" },
  bagTitle: { fontSize: 15, fontWeight: "600", color: "#0F0F0F", marginBottom: 8 },
  bottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickupRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickupText: { fontSize: 12, color: "#737373" },
  priceGroup: { alignItems: "flex-end", gap: 2 },
  originalPrice: {
    fontSize: 11,
    color: "#B8B8B8",
    textDecorationLine: "line-through",
  },
  price: { fontSize: 18, fontWeight: "700", color: "#0F0F0F" },
});
