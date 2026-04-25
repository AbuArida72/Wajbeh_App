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
import { GlassPanel, Chip, T, WallpaperBackground, TextBackdrop, ar, FONTS } from "../components/Glass";

const QUICK_FILTER_KEYS = [
  { value: "Bakery",     labelKey: "filterBakery" },
  { value: "Restaurant", labelKey: "filterRestaurant" },
  { value: "Café",       labelKey: "filterCafe" },
  { value: "Abdoun",     labelKey: null },
  { value: "Sweifieh",   labelKey: null },
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
    const todayDate = new Date().toLocaleDateString("en-CA");
    const { data, error } = await supabase
      .from("bags")
      .select(`*, restaurants (name, category, area, logo_url)`)
      .eq("status", "available")
      .eq("available_date", todayDate)
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
        activeOpacity={0.93}
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
        <GlassPanel radius={22} style={{ marginHorizontal: 16, marginBottom: 12 }}>
          <View style={[styles.cardRow, isRTL && styles.rtlRow]}>
            <View style={styles.thumbWrapper}>
              <Image source={{ uri: item.image_url }} style={styles.thumb} />
              <View style={[styles.qtyBadge, isLast && styles.qtyBadgeUrgent, { [isRTL ? "right" : "left"]: 6 }]}>
                <Text style={styles.qtyText}>
                  {isLast ? t("lastOne") : `${item.quantity_remaining} ${t("left")}`}
                </Text>
              </View>
            </View>

            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={[styles.restaurantLine, isRTL && styles.rtlRow]}>
                <Image source={{ uri: r?.logo_url }} style={styles.logo} />
                <Text style={[styles.restaurantName, isRTL && styles.rtl]} numberOfLines={1}>{r?.name}</Text>
                <Text style={styles.areaText}>· {r?.area}</Text>
              </View>
              <Text style={[styles.bagTitle, isRTL && styles.rtl]} numberOfLines={1}>{item.title}</Text>

              <View style={[styles.metaRow, isRTL && styles.rtlRow]}>
                <Text style={styles.pickupText}>{item.pickup_start?.slice(0, 5)} – {item.pickup_end?.slice(0, 5)}</Text>
              </View>

              <View style={[styles.priceRow, isRTL && styles.rtlRow]}>
                <Text style={styles.originalPrice}>JD {parseFloat(item.original_value).toFixed(2)}</Text>
                <Text style={styles.price}>JD {parseFloat(item.price).toFixed(2)}</Text>
                <Chip style={{ paddingHorizontal: 8, paddingVertical: 3 }}>−{discount}%</Chip>
              </View>
            </View>
          </View>
        </GlassPanel>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />


      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={[styles.headerTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>{t("searchTitle")}</Text>

        {/* Search bar */}
        <View style={[styles.searchBar, isRTL && styles.rtlRow]}>
          <Ionicons name="search-outline" size={16} color={T.muteStrong} />
          <TextInput
            style={[styles.searchInput, isRTL && styles.rtl]}
            placeholder={t("searchPlaceholder")}
            placeholderTextColor={T.muteStrong}
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close" size={16} color={T.muteStrong} />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick filter chips */}
        {query.length === 0 && (
          <View style={[styles.quickFilters, isRTL && styles.rtlRow]}>
            {QUICK_FILTER_KEYS.map((f) => (
              <TouchableOpacity
                key={f.value}
                onPress={() => setQuery(f.value)}
                style={styles.quickChip}
                activeOpacity={0.75}
              >
                <Text style={styles.quickChipText}>{f.labelKey ? t(f.labelKey) : f.value}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

      </View>

      {/* Results count */}
      {query.length >= 2 && (
        <View style={[styles.resultsBar, isRTL && styles.rtlRow]}>
          <Text style={[styles.resultsText, isRTL && styles.rtl]}>
            {filtered.length} {t("results")} <Text style={{ fontWeight: "700", color: T.ink }}>"{query}"</Text>
          </Text>
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearText}>{t("clearBtn")}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Browse header */}
      {query.length === 0 && !loading && (
        <View style={styles.browseHeader}>
          <Text style={[styles.browseTitle, isRTL && styles.rtl]}>{t("allBagsToday")}</Text>
          <Text style={[styles.browseSub, isRTL && styles.rtl]}>
            {bags.length} {t("bagsFrom")} {new Set(bags.map((b) => b.restaurants?.name)).size} {t("restaurantsCount")}
          </Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={T.green} />
          <Text style={styles.loadingText}>{t("searchingText")}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="search-outline" size={44} color={T.muteStrong} />
          <Text style={[styles.emptyTitle, isRTL && styles.rtl]}>{t("noResultsTitle")}</Text>
          <Text style={[styles.emptySub, isRTL && styles.rtl]}>{t("noResultsSub")}</Text>
          <TouchableOpacity style={styles.clearBtn} onPress={() => setQuery("")}>
            <Text style={styles.clearBtnText}>{t("clearSearch")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderBag}
          contentContainerStyle={[{ paddingTop: 14, paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20, paddingBottom: 16,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  headerTitle: { fontSize: 30, fontWeight: "800", color: T.ink, letterSpacing: -0.8, marginBottom: 14, fontFamily: FONTS.bold },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: T.bg, borderRadius: 14,
    borderWidth: 1, borderColor: T.border,
    paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: T.ink, paddingVertical: 0 },

  quickFilters: { flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 },
  quickChip: {
    borderRadius: 100,
    paddingHorizontal: 14, paddingVertical: 7,
    backgroundColor: T.greenLight,
    borderWidth: 1, borderColor: "rgba(21,128,61,0.18)",
  },
  quickChipText: { fontSize: 12, fontWeight: "600", color: T.green },

  resultsBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 20, paddingVertical: 8,
  },
  resultsText: { fontSize: 12, color: T.mute },
  clearText: { fontSize: 12, color: T.accent, fontWeight: "600" },

  browseHeader: { paddingHorizontal: 20, paddingVertical: 8 },
  browseTitle: { fontSize: 13, fontWeight: "600", color: T.ink },
  browseSub: { fontSize: 11, color: T.mute },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 32 },
  loadingText: { fontSize: 13, color: T.mute },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: T.ink, textAlign: "center" },
  emptySub: { fontSize: 13, color: T.mute, textAlign: "center" },
  clearBtn: { backgroundColor: T.green, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 100, marginTop: 8 },
  clearBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },

  // Card (same style as HomeScreen)
  cardRow: { flexDirection: "row", padding: 12, gap: 12 },
  thumbWrapper: { width: 80, height: 80, borderRadius: 14, overflow: "hidden", flexShrink: 0, position: "relative" },
  thumb: { width: "100%", height: "100%", backgroundColor: "rgba(15,23,42,0.06)" },
  qtyBadge: {
    position: "absolute", top: 6,
    backgroundColor: "rgba(0,0,0,0.55)", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100,
  },
  qtyBadgeUrgent: { backgroundColor: T.urgent },
  qtyText: { fontSize: 8, fontWeight: "700", color: "#fff" },

  restaurantLine: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 },
  logo: { width: 16, height: 16, borderRadius: 8, backgroundColor: "rgba(15,23,42,0.06)" },
  restaurantName: { fontSize: 11, fontWeight: "600", color: T.ink },
  areaText: { fontSize: 10, color: T.mute },
  bagTitle: { fontSize: 16, fontWeight: "700", color: T.ink, letterSpacing: -0.3, marginBottom: 4, fontFamily: FONTS.bold },

  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 },
  pickupText: { fontSize: 10, color: T.mute },

  priceRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  originalPrice: { fontSize: 11, color: T.muteStrong, textDecorationLine: "line-through" },
  price: { fontSize: 17, fontWeight: "700", color: T.accent },
});
