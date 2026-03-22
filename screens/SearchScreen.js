import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ImageBackground,
  Image,
} from "react-native";
import { useLanguage } from "../lang/LanguageContext";

const ALL_BAGS = [
  {
    id: "1",
    restaurant: "Habibah Sweets",
    area: "Downtown Amman",
    category: "Bakery",
    title: "Surprise Pastry Bag",
    price: 3.5,
    original_value: 12,
    quantity_remaining: 4,
    pickup_start: "20:00",
    pickup_end: "21:00",
    image: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600",
    logo: "https://ui-avatars.com/api/?name=HS&background=2E7D32&color=fff&size=100",
  },
  {
    id: "2",
    restaurant: "Sufra Restaurant",
    area: "Sweifieh",
    category: "Restaurant",
    title: "Leftover Lunch Box",
    price: 4,
    original_value: 14,
    quantity_remaining: 2,
    pickup_start: "15:00",
    pickup_end: "16:00",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600",
    logo: "https://ui-avatars.com/api/?name=SR&background=1B5E20&color=fff&size=100",
  },
  {
    id: "3",
    restaurant: "Jafra Café",
    area: "Abdoun",
    category: "Café",
    title: "Coffee & Bites Bag",
    price: 2.5,
    original_value: 9,
    quantity_remaining: 6,
    pickup_start: "18:00",
    pickup_end: "19:30",
    image: "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=600",
    logo: "https://ui-avatars.com/api/?name=JC&background=388E3C&color=fff&size=100",
  },
  {
    id: "4",
    restaurant: "Books@Cafe",
    area: "Abdoun",
    category: "Café",
    title: "End of Day Café Bag",
    price: 3,
    original_value: 10,
    quantity_remaining: 1,
    pickup_start: "21:00",
    pickup_end: "22:00",
    image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600",
    logo: "https://ui-avatars.com/api/?name=BC&background=2E7D32&color=fff&size=100",
  },
  {
    id: "5",
    restaurant: "Reem Al Bawadi",
    area: "Mecca Street",
    category: "Restaurant",
    title: "Arabic Mezze Bag",
    price: 5,
    original_value: 18,
    quantity_remaining: 3,
    pickup_start: "22:00",
    pickup_end: "23:00",
    image: "https://images.unsplash.com/photo-1561626423-a51b45aef0a1?w=600",
    logo: "https://ui-avatars.com/api/?name=RB&background=1B5E20&color=fff&size=100",
  },
];

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const { t, isRTL } = useLanguage();

  const results =
    query.length < 2
      ? ALL_BAGS
      : ALL_BAGS.filter(
          (b) =>
            b.restaurant.toLowerCase().includes(query.toLowerCase()) ||
            b.area.toLowerCase().includes(query.toLowerCase()) ||
            b.category.toLowerCase().includes(query.toLowerCase()),
        );

  const renderBag = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => navigation.navigate("BagDetail", { bag: item })}
    >
      <ImageBackground
        source={{ uri: item.image }}
        style={styles.cardImage}
        imageStyle={styles.cardImageStyle}
      >
        <View style={styles.imageOverlay} />
        <View style={styles.leftBadge}>
          <Text style={styles.leftBadgeText}>
            {item.quantity_remaining === 1
              ? t("lastOne")
              : `${item.quantity_remaining} ${t("left")}`}
          </Text>
        </View>
        <View style={[styles.logoContainer, isRTL && styles.rtlRow]}>
          <Image source={{ uri: item.logo }} style={styles.logo} />
          <Text style={styles.restaurantOverlay}>{item.restaurant}</Text>
        </View>
      </ImageBackground>

      <View style={styles.cardBody}>
        <View style={[styles.cardRow, isRTL && styles.rtlRow]}>
          <View style={styles.cardLeft}>
            <Text style={[styles.bagTitle, isRTL && styles.rtl]}>
              {item.title}
            </Text>
            <Text style={[styles.pickup, isRTL && styles.rtl]}>
              {t("pickupToday")} {item.pickup_start} - {item.pickup_end}
            </Text>
            <Text style={[styles.area, isRTL && styles.rtl]}>{item.area}</Text>
          </View>
          <View style={styles.priceBlock}>
            <Text style={styles.originalPrice}>
              JD {item.original_value.toFixed(2)}
            </Text>
            <Text style={styles.price}>JD {item.price.toFixed(2)}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder={t("searchPlaceholder")}
          placeholderTextColor="#A5C8A5"
          value={query}
          onChangeText={setQuery}
          autoFocus
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {query.length > 0 && (
        <Text style={[styles.resultsCount, isRTL && styles.rtl]}>
          {results.length} {t("results")} "{query}"
        </Text>
      )}

      {query.length === 0 && (
        <Text style={[styles.hint, isRTL && styles.rtl]}>
          {t("searchHint")}
        </Text>
      )}

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        renderItem={renderBag}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F1F8F1" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    margin: 16,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  searchIcon: { fontSize: 16, marginRight: 8 },
  input: { flex: 1, fontSize: 15, color: "#1B5E20" },
  inputRTL: { textAlign: "right" },
  clearBtn: { fontSize: 14, color: "#888780", paddingLeft: 8 },
  hint: {
    fontSize: 13,
    color: "#A5C8A5",
    textAlign: "center",
    marginBottom: 16,
  },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
  resultsCount: {
    fontSize: 13,
    color: "#2E7D32",
    paddingHorizontal: 16,
    marginBottom: 8,
    fontWeight: "500",
  },
  list: { paddingHorizontal: 16, paddingBottom: 24 },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  cardImage: { height: 160, justifyContent: "space-between" },
  cardImageStyle: { borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.25)",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  leftBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  leftBadgeText: { fontSize: 12, fontWeight: "700", color: "#2E7D32" },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
  },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  restaurantOverlay: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardBody: { padding: 14 },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLeft: { flex: 1, paddingRight: 10 },
  bagTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1B5E20",
    marginBottom: 4,
  },
  pickup: { fontSize: 12, color: "#5F5E5A", marginBottom: 2 },
  area: { fontSize: 11, color: "#A5C8A5" },
  priceBlock: { alignItems: "flex-end" },
  originalPrice: {
    fontSize: 12,
    color: "#B4B2A9",
    textDecorationLine: "line-through",
    marginBottom: 2,
  },
  price: { fontSize: 20, fontWeight: "700", color: "#2E7D32" },
});
