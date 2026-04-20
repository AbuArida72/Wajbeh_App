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
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lang/LanguageContext";
import { GlassPanel, T, WallpaperBackground, TextBackdrop, ar, SkeletonBox } from "../components/Glass";
import { haptic } from "../lib/haptics";

const BAG_CONTENTS = [
  { key: "contentsBread", icon: "bread-outline" },
  { key: "contentsPastries", icon: "cafe-outline" },
  { key: "contentsSandwiches", icon: "fast-food-outline" },
  { key: "contentsSalads", icon: "leaf-outline" },
  { key: "contentsMainDishes", icon: "restaurant-outline" },
  { key: "contentsDesserts", icon: "ice-cream-outline" },
  { key: "contentsDrinks", icon: "water-outline" },
  { key: "contentsSnacks", icon: "pizza-outline" },
  { key: "contentsWraps", icon: "layers-outline" },
  { key: "contentsPizza", icon: "pizza-outline" },
  { key: "contentsSoup", icon: "flame-outline" },
  { key: "contentsRice", icon: "server-outline" },
  { key: "contentsGrilled", icon: "bonfire-outline" },
  { key: "contentsSweets", icon: "heart-outline" },
];

const TIMES = (() => {
  const t = [];
  for (let h = 0; h <= 23; h++) {
    t.push(`${String(h).padStart(2, "0")}:00`);
    t.push(`${String(h).padStart(2, "0")}:30`);
  }
  return t;
})();

const NEXT_DAY_TIMES = [
  "ND:00:00", "ND:00:30", "ND:01:00", "ND:01:30",
  "ND:02:00", "ND:02:30", "ND:03:00",
];

const isNextDayTime = (t) => !!(t && t.startsWith("ND:"));

const stripND = (t) => (isNextDayTime(t) ? t.slice(3) : t);

const addThirtyMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  const total = h * 60 + m + 30;
  const nh = Math.floor(total / 60) % 24;
  const nm = total % 60;
  return `${String(nh).padStart(2, "0")}:${String(nm).padStart(2, "0")}`;
};

const getEndTimes = (startTime) => {
  if (!startTime) return [];
  const min = addThirtyMinutes(startTime);
  // Same-day: all times strictly after start and >= min (handles normal case;
  // if min wraps past midnight the string compare naturally yields nothing past 23:30)
  const sameDay = TIMES.filter((t) => t > startTime && t >= min);
  return [...sameDay, ...NEXT_DAY_TIMES];
};

const formatEndTime = (t) =>
  isNextDayTime(t) ? `Next Day ${stripND(t)}` : t;

const QUANTITIES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20, 25, 30, 50];

const DEFAULT_BAG_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600";
const SERVES_OPTIONS = [1, 2, 3, 4, 5, 6];
const REPEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

function DropdownPicker({ placeholder, value, options, onSelect, isOpen, onToggle, format }) {
  return (
    <View style={dpStyles.wrapper}>
      <TouchableOpacity style={dpStyles.btn} onPress={onToggle} activeOpacity={0.8}>
        <Text style={value != null ? dpStyles.value : dpStyles.placeholder}>
          {value != null ? (format ? format(value) : String(value)) : placeholder}
        </Text>
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color={T.mute} />
      </TouchableOpacity>
      {isOpen && (
        <ScrollView style={dpStyles.list} nestedScrollEnabled showsVerticalScrollIndicator={false}>
          {options.map((opt) => {
            const selected = value === opt;
            return (
              <TouchableOpacity
                key={String(opt)}
                style={[dpStyles.option, selected && dpStyles.optionSelected]}
                onPress={() => onSelect(opt)}
                activeOpacity={0.7}
              >
                <Text style={[dpStyles.optionText, selected && dpStyles.optionTextSelected]}>
                  {format ? format(opt) : String(opt)}
                </Text>
                {selected && <Ionicons name="checkmark" size={15} color={T.green} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const dpStyles = StyleSheet.create({
  wrapper: { marginBottom: 14 },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255,255,255,0.80)",
    borderWidth: 1,
    borderColor: "rgba(26,34,24,0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 44,
    shadowColor: "rgba(26,34,24,0.10)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  value: { fontSize: 15, color: T.ink, fontWeight: "500" },
  placeholder: { fontSize: 15, color: T.muteStrong },
  list: {
    borderWidth: 1,
    borderColor: "rgba(26,34,24,0.12)",
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.95)",
    maxHeight: 200,
    marginTop: 4,
    shadowColor: "rgba(26,34,24,0.12)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(26,34,24,0.06)",
  },
  optionSelected: { backgroundColor: "rgba(61,107,71,0.10)" },
  optionText: { fontSize: 15, color: T.ink },
  optionTextSelected: { color: T.green, fontWeight: "600" },
});

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const [bags, setBags] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [originalValue, setOriginalValue] = useState("");
  const [quantity, setQuantity] = useState(null);
  const [pickupStart, setPickupStart] = useState(null);
  const [pickupEnd, setPickupEnd] = useState(null);
  const [description, setDescription] = useState("");
  const [selectedContents, setSelectedContents] = useState([]);
  const [repeatDays, setRepeatDays] = useState(1);
  const [servesPeople, setServesPeople] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'qty' | 'start' | 'end'

  const toggleDropdown = (key) => setOpenDropdown((prev) => (prev === key ? null : key));

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
    if (!title || !price || !originalValue || !quantity || !pickupStart || !pickupEnd) {
      Alert.alert(t("fillAllFields"), "");
      haptic.error();
      return;
    }
    if (!isNextDayTime(pickupEnd) && pickupStart >= pickupEnd) {
      Alert.alert(t("pickupWindow"), "");
      haptic.error();
      return;
    }
    const discountPct = Math.round(
      (1 - parseFloat(price) / parseFloat(originalValue)) * 100,
    );
    if (discountPct < 50) {
      Alert.alert(t("priceTooHighTitle"), t("priceTooHighBlock"));
      haptic.error();
      return;
    }
    haptic.light();
    setSaving(true);

    const imageUrl = restaurant.logo_url || DEFAULT_BAG_IMAGE;

    const today = new Date();
    const inserts = Array.from({ length: repeatDays }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      return {
        restaurant_id: restaurant.id,
        title,
        description,
        price: parseFloat(price),
        original_value: parseFloat(originalValue),
        quantity_total: quantity,
        quantity_remaining: quantity,
        available_date: d.toLocaleDateString("en-CA"),
        status: "available",
        pickup_start: pickupStart + ":00",
        pickup_end: stripND(pickupEnd) + ":00",
        possible_contents: selectedContents,
        serves_people: servesPeople || 1,
        image_url: imageUrl,
      };
    });

    const { error } = await supabase.from("bags").insert(inserts);

    if (error) {
      Alert.alert("Error", error.message);
    } else {
      setModalVisible(false);
      setTitle("");
      setPrice("");
      setOriginalValue("");
      setQuantity(null);
      setPickupStart(null);
      setPickupEnd(null);
      setDescription("");
      setSelectedContents([]);
      setRepeatDays(1);
      setServesPeople(null);
      setOpenDropdown(null);
      haptic.success();
      fetchDashboard();
    }
    setSaving(false);
  };

  const markSoldOut = (bagId) => {
    Alert.alert("Mark as Sold Out", "Mark this bag as sold out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        style: "destructive",
        onPress: async () => {
          const { error } = await supabase
            .from("bags")
            .update({ quantity_remaining: 0, status: "sold_out" })
            .eq("id", bagId);
          if (error) Alert.alert("Error", error.message);
          else fetchDashboard();
        },
      },
    ]);
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
                { backgroundColor: isAvailable ? T.green : T.muteStrong },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text
                style={[styles.bagCardTitle, !isAvailable && styles.textMuted]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.bagCardMeta}>
                {item.category || t("surpriseBagFallback")} · {discount}% off
              </Text>
            </View>
          </View>
          <View style={styles.bagStatusBadge}>
            <Text
              style={[
                styles.bagStatusText,
                isAvailable
                  ? styles.bagStatusTextAvailable
                  : styles.bagStatusTextSoldOut,
              ]}
            >
              {isAvailable ? t("active") : t("soldOutStatus")}
            </Text>
          </View>
        </View>

        {/* Price row */}
        <View style={styles.bagPriceRow}>
          <View style={styles.bagPriceItem}>
            <Text style={styles.bagPriceLabel}>{t("yourPrice").replace(" (JD) *", "")}</Text>
            <Text style={styles.bagPriceValue}>
              JD {parseFloat(item.price).toFixed(2)}
            </Text>
          </View>
          <View style={styles.bagPriceDivider} />
          <View style={styles.bagPriceItem}>
            <Text style={styles.bagPriceLabel}>{t("originalValue")}</Text>
            <Text style={styles.bagPriceOriginal}>
              JD {parseFloat(item.original_value).toFixed(2)}
            </Text>
          </View>
          <View style={styles.bagPriceDivider} />
          <View style={styles.bagPriceItem}>
            <Text style={styles.bagPriceLabel}>{t("earnedLabel")}</Text>
            <Text style={styles.bagPriceEarned}>
              JD {(parseFloat(item.price) * reserved).toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>
              {reserved} / {item.quantity_total}
            </Text>
            <Text style={styles.progressPct}>{Math.round(fillPct)}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${fillPct}%` }]} />
          </View>
          <View style={styles.progressFooter}>
            <Text style={styles.progressRemaining}>
              {item.quantity_remaining} {t("remaining")}
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
            <Text style={styles.soldOutBtnText}>{t("markSoldOut")}</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <WallpaperBackground />
        <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 12, gap: 16, width: "100%" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <SkeletonBox width={48} height={48} radius={14} />
            <View style={{ gap: 6 }}>
              <SkeletonBox width={150} height={18} radius={6} />
              <SkeletonBox width={90} height={12} radius={6} />
            </View>
          </View>
          <SkeletonBox width="100%" height={64} radius={18} />
          {[0, 1].map((i) => (
            <GlassPanel key={i} radius={18} style={{ padding: 14, gap: 10 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                <SkeletonBox width={120} height={16} radius={6} />
                <SkeletonBox width={60} height={22} radius={100} />
              </View>
              <SkeletonBox width="70%" height={12} radius={6} />
              <View style={{ flexDirection: "row", gap: 8 }}>
                <SkeletonBox width={80} height={24} radius={8} />
                <SkeletonBox width={80} height={24} radius={8} />
              </View>
            </GlassPanel>
          ))}
        </View>
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.noRestaurantContainer}>
        <WallpaperBackground />
        <Ionicons name="storefront-outline" size={48} color={T.muteStrong} />
        <Text style={styles.noRestaurantTitle}>{t("noRestaurantFound") || "No restaurant found"}</Text>
        <Text style={styles.noRestaurantSubtitle}>
          {t("noRestaurantSub") || "Your account is not linked to any restaurant."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <WallpaperBackground />
      <FlatList
        data={bags}
        keyExtractor={(item) => item.id}
        renderItem={renderBag}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View>
            {/* Restaurant header */}
            <View style={[styles.restaurantHeader, { paddingTop: insets.top + 12 }]}>
              <View style={styles.restaurantHeaderLeft}>
                <View style={styles.restaurantAvatar}>
                  <Text style={styles.restaurantAvatarText}>
                    {restaurant.name?.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.restaurantName, ar(isRTL, "bold")]} numberOfLines={1}>{restaurant.name}</Text>
                  <Text style={styles.restaurantMeta}>
                    {restaurant.area} · {restaurant.category}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setModalVisible(true)}
                activeOpacity={0.88}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.addBtnLabel}>{t("addBag").replace("+ ", "")}</Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
            <GlassPanel radius={100} padding={10} style={styles.statsPanel}>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{totalBags}</Text>
                  <Text style={styles.statLabel}>{t("todayBags")}</Text>
                </View>
                <View style={styles.statItemDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{totalReserved}</Text>
                  <Text style={styles.statLabel}>{t("statusReserved")}</Text>
                </View>
                <View style={styles.statItemDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>JD {totalEarned.toFixed(0)}</Text>
                  <Text style={styles.statLabel}>{t("earnedLabel")}</Text>
                </View>
                <View style={styles.statItemDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNum}>{availableBags}</Text>
                  <Text style={styles.statLabel}>{t("active")}</Text>
                </View>
              </View>
            </GlassPanel>

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, ar(isRTL, "bold")]}>{t("todayBags")}</Text>
              <Text style={styles.sectionCount}>{bags.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-handle-outline" size={40} color={T.muteStrong} />
            <Text style={styles.emptyTitle}>{t("noBagsPosted")}</Text>
            <Text style={styles.emptySubtitle}>{t("noBagsPostedSub")}</Text>
            <TouchableOpacity
              style={styles.emptyAddBtn}
              onPress={() => setModalVisible(true)}
            >
              <Text style={styles.emptyAddBtnText}>{t("addNewBag")}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Add Bag Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modal}>
          <WallpaperBackground />
          {/* Glass modal header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleLeft}>
                <View style={styles.modalTitleIcon}>
                  <Ionicons name="bag-handle" size={18} color={T.green} />
                </View>
                <Text style={styles.modalTitle}>{t("addNewBag")}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={18} color={T.mute} />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {/* BAG DETAILS */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="pencil-outline" size={13} color={T.muteStrong} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>{t("bagDetailsSection") || "BAG DETAILS"}</Text>
                </View>

                <Text style={styles.inputLabel}>{t("bagTitle")}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="pricetag-outline" size={15} color={T.muteStrong} style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Surprise Pastry Bag"
                    placeholderTextColor={T.muteStrong}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <Text style={styles.inputLabel}>{t("description")}</Text>
                <View style={[styles.inputWrapper, styles.inputWrapperMulti]}>
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholder="What's in the bag? (optional)"
                    placeholderTextColor={T.muteStrong}
                    value={description}
                    onChangeText={setDescription}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              {/* POSSIBLE CONTENTS */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="list-outline" size={13} color={T.muteStrong} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>{t("possibleContentsSection")}</Text>
                </View>
                <Text style={[styles.inputLabel, { marginBottom: 10 }]}>{t("tapToSelect")}</Text>
                <View style={styles.contentsGrid}>
                  {BAG_CONTENTS.map((item) => {
                    const selected = selectedContents.includes(item.key);
                    return (
                      <TouchableOpacity
                        key={item.key}
                        style={[styles.contentChip, selected && styles.contentChipSelected]}
                        onPress={() =>
                          setSelectedContents((prev) =>
                            prev.includes(item.key)
                              ? prev.filter((k) => k !== item.key)
                              : [...prev, item.key]
                          )
                        }
                        activeOpacity={0.7}
                      >
                        <Ionicons
                          name={item.icon}
                          size={14}
                          color={selected ? "#fff" : T.green}
                        />
                        <Text style={[styles.contentChipText, selected && styles.contentChipTextSelected]}>
                          {t(item.key)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* PRICING */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="cash-outline" size={13} color={T.muteStrong} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>{t("pricingSection") || "PRICING"}</Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>{t("yourPrice")}</Text>
                    <View style={[styles.inputWrapper, styles.inputWrapperGreen]}>
                      <Text style={styles.inputPrefixGreen}>JD</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="3.50"
                        placeholderTextColor={T.muteStrong}
                        keyboardType="decimal-pad"
                        value={price}
                        onChangeText={setPrice}
                      />
                    </View>
                  </View>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>{t("originalValueInput")}</Text>
                    <View style={styles.inputWrapper}>
                      <Text style={styles.inputPrefix}>JD</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="12.00"
                        placeholderTextColor={T.muteStrong}
                        keyboardType="decimal-pad"
                        value={originalValue}
                        onChangeText={setOriginalValue}
                      />
                    </View>
                  </View>
                </View>

                {(() => {
                  const p = parseFloat(price);
                  const o = parseFloat(originalValue);
                  if (!price || !originalValue || isNaN(p) || isNaN(o) || o <= 0 || p <= 0) return null;
                  const disc = Math.round((1 - p / o) * 100);
                  if (disc < 50) {
                    return (
                      <View style={styles.pricingAlert}>
                        <Ionicons name="close-circle-outline" size={16} color={T.urgent} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.pricingAlertTitle}>{t("priceTooHighTitle")}</Text>
                          <Text style={styles.pricingAlertBody}>{t("priceTooHighBlock")}</Text>
                        </View>
                      </View>
                    );
                  }
                  if (disc < 75) {
                    return (
                      <>
                        <View style={styles.discountPreview}>
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>-{disc}%</Text>
                          </View>
                          <Text style={styles.discountPreviewText}>
                            {t("youSave")}{" "}
                            <Text style={styles.discountHighlight}>
                              JD {(o - p).toFixed(2)}
                            </Text>
                          </Text>
                        </View>
                        <View style={styles.pricingWarn}>
                          <Ionicons name="information-circle-outline" size={16} color={T.accent} />
                          <Text style={[styles.pricingWarnText, { flex: 1 }]}>{t("priceLowerSuggestion")}</Text>
                        </View>
                      </>
                    );
                  }
                  return (
                    <View style={styles.discountPreview}>
                      <View style={styles.discountBadge}>
                        <Text style={styles.discountBadgeText}>-{disc}%</Text>
                      </View>
                      <Text style={styles.discountPreviewText}>
                        {t("youSave")}{" "}
                        <Text style={styles.discountHighlight}>
                          JD {(o - p).toFixed(2)}
                        </Text>
                      </Text>
                    </View>
                  );
                })()}
              </View>

              {/* QUANTITY */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="layers-outline" size={13} color={T.mute} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>{t("quantity").replace(" *", "")}</Text>
                </View>
                <DropdownPicker
                  placeholder="Select number of bags"
                  value={quantity}
                  options={QUANTITIES}
                  onSelect={(v) => { setQuantity(v); setOpenDropdown(null); }}
                  isOpen={openDropdown === "qty"}
                  onToggle={() => toggleDropdown("qty")}
                  format={(v) => `${v} bag${v !== 1 ? "s" : ""}`}
                />
              </View>

              {/* SERVING SIZE */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="people-outline" size={13} color={T.mute} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>{t("servingSizeSection")}</Text>
                </View>
                <DropdownPicker
                  placeholder={t("selectServingSize")}
                  value={servesPeople}
                  options={SERVES_OPTIONS}
                  onSelect={(v) => { setServesPeople(v); setOpenDropdown(null); }}
                  isOpen={openDropdown === "serves"}
                  onToggle={() => toggleDropdown("serves")}
                  format={(v) => v === 6 ? t("serves6Plus") : t("servesCount", { count: v })}
                />
              </View>

              {/* PICKUP TIME */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="time-outline" size={13} color={T.mute} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>PICKUP TIME</Text>
                </View>
                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>{t("from")} *</Text>
                    <DropdownPicker
                      placeholder="From"
                      value={pickupStart}
                      options={TIMES}
                      onSelect={(v) => {
                        setPickupStart(v);
                        if (pickupEnd && !isNextDayTime(pickupEnd) && stripND(pickupEnd) < addThirtyMinutes(v)) setPickupEnd(null);
                        setOpenDropdown(null);
                      }}
                      isOpen={openDropdown === "start"}
                      onToggle={() => toggleDropdown("start")}
                    />
                  </View>
                  <View style={[styles.inputHalf, !pickupStart && { opacity: 0.4 }]}>
                    <Text style={styles.inputLabel}>{t("until")} *</Text>
                    <DropdownPicker
                      placeholder="Until"
                      value={pickupEnd}
                      options={getEndTimes(pickupStart)}
                      onSelect={(v) => { if (!pickupStart) return; setPickupEnd(v); setOpenDropdown(null); }}
                      isOpen={openDropdown === "end"}
                      onToggle={() => { if (!pickupStart) return; toggleDropdown("end"); }}
                      format={formatEndTime}
                    />
                  </View>
                </View>
              </View>

              {/* REPEAT POSTING */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="repeat-outline" size={13} color={T.muteStrong} />
                  <Text style={[styles.modalSectionTitle, { color: T.mute }]}>{t("repeatSection")}</Text>
                </View>
                <DropdownPicker
                  placeholder={t("selectRepeatDays")}
                  value={repeatDays}
                  options={REPEAT_OPTIONS}
                  onSelect={(v) => { setRepeatDays(v); setOpenDropdown(null); }}
                  isOpen={openDropdown === "repeat"}
                  onToggle={() => toggleDropdown("repeat")}
                  format={(v) => {
                    if (v === 1) return t("todayOnly");
                    if (v === 7) return t("oneWeek");
                    return t("nDays", { count: v });
                  }}
                />
                {repeatDays > 1 && (
                  <View style={styles.repeatNote}>
                    <Ionicons name="information-circle-outline" size={13} color={T.accent} />
                    <Text style={styles.repeatNoteText}>{t("repeatNoteText", { count: repeatDays })}</Text>
                  </View>
                )}
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
                    <Text style={styles.saveBtnText}>{t("postBag")}</Text>
                  )}
                </TouchableOpacity>
              </View>

              <View style={{ height: insets.bottom + 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  noRestaurantContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  noRestaurantTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: T.ink,
    marginTop: 8,
    textAlign: "center",
  },
  noRestaurantSubtitle: { fontSize: 14, color: T.mute, textAlign: "center" },

  // Restaurant header
  restaurantHeader: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  restaurantHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  restaurantAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantAvatarText: { fontSize: 16, fontWeight: "700", color: T.ink },
  restaurantName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.ink,
    marginBottom: 2,
  },
  restaurantMeta: { fontSize: 12, color: T.mute },
  addBtn: {
    backgroundColor: T.green,
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnLabel: { fontSize: 13, color: "#FFFFFF", fontWeight: "700" },

  // Stats row
  statsPanel: { marginHorizontal: 16, marginBottom: 12 },
  statsRow: { flexDirection: "row" },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statItemDivider: {
    width: 1,
    backgroundColor: "rgba(26,34,24,0.10)",
    marginVertical: 2,
  },
  statNum: {
    fontSize: 15,
    fontWeight: "700",
    color: T.green,
    marginBottom: 2,
    textAlign: "center",
  },
  statLabel: { fontSize: 9, color: T.mute, textAlign: "center", letterSpacing: 0.3 },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 13, fontWeight: "700", color: T.ink, textAlign: "center" },
  sectionCount: { fontSize: 11, color: T.mute },

  // List
  list: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 32 },

  // Bag card
  bagCard: {
    backgroundColor: "rgba(255,255,255,0.82)",
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: T.green,
    shadowColor: "rgba(26,34,24,0.12)",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  bagCardSoldOut: { opacity: 0.7, borderLeftColor: T.muteStrong },
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
  bagStatusDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  bagCardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: T.ink,
    marginBottom: 2,
  },
  textMuted: { color: T.muteStrong },
  bagCardMeta: { fontSize: 12, color: T.mute },
  bagStatusBadge: { marginLeft: 8 },
  bagStatusText: { fontSize: 11, fontWeight: "600" },
  bagStatusTextAvailable: { color: T.green },
  bagStatusTextSoldOut: { color: T.urgent },

  // Price row
  bagPriceRow: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(26,34,24,0.08)",
  },
  bagPriceItem: { flex: 1, alignItems: "center" },
  bagPriceDivider: {
    width: 1,
    backgroundColor: "rgba(26,34,24,0.08)",
    marginHorizontal: 4,
  },
  bagPriceLabel: {
    fontSize: 10,
    color: T.mute,
    marginBottom: 4,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bagPriceValue: { fontSize: 15, fontWeight: "700", color: T.ink },
  bagPriceOriginal: {
    fontSize: 13,
    fontWeight: "500",
    color: T.muteStrong,
    textDecorationLine: "line-through",
  },
  bagPriceEarned: { fontSize: 15, fontWeight: "700", color: T.green },

  // Progress
  progressSection: { marginBottom: 14 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: T.mute, fontWeight: "500" },
  progressPct: { fontSize: 12, fontWeight: "600", color: T.green },
  progressBar: {
    height: 6,
    backgroundColor: "rgba(26,34,24,0.08)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: T.green,
    borderRadius: 3,
  },
  progressFooter: { marginTop: 4 },
  progressRemaining: { fontSize: 11, color: T.muteStrong },

  // Sold out button
  soldOutBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  soldOutBtnText: { fontSize: 13, fontWeight: "600", color: T.urgent },

  // Empty state
  emptyContainer: {
    alignItems: "center",
    paddingTop: 48,
    paddingHorizontal: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: T.ink,
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: T.mute,
    textAlign: "center",
    lineHeight: 22,
  },
  emptyAddBtn: {
    backgroundColor: T.green,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 100,
    marginTop: 8,
    shadowColor: "rgba(30,58,33,0.35)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  emptyAddBtnText: { color: "#fff", fontWeight: "700", fontSize: 15 },

  // Modal
  modal: { flex: 1 },
  modalHeader: {
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(26,34,24,0.07)",
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(26,34,24,0.15)",
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
  modalTitleLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  modalTitleIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(61,107,71,0.12)",
    borderWidth: 1,
    borderColor: "rgba(61,107,71,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: T.ink },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(26,34,24,0.07)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { flex: 1 },
  modalSection: { padding: 20, paddingBottom: 0 },
  sectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 14,
  },
  modalSectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "500",
    color: T.ink,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.80)",
    borderWidth: 1,
    borderColor: "rgba(26,34,24,0.12)",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: "rgba(26,34,24,0.08)",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  inputWrapperGreen: {
    borderColor: "rgba(61,107,71,0.30)",
    backgroundColor: "rgba(61,107,71,0.07)",
  },
  inputWrapperMulti: { alignItems: "flex-start", paddingTop: 4 },
  inputPrefix: {
    fontSize: 14,
    color: T.mute,
    marginRight: 8,
    fontWeight: "600",
  },
  inputPrefixGreen: {
    fontSize: 14,
    color: T.green,
    marginRight: 8,
    fontWeight: "700",
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: T.ink },
  inputMulti: { paddingTop: 8, height: 80, textAlignVertical: "top" },
  inputRow: { flexDirection: "row", gap: 12 },
  inputHalf: { flex: 1 },
  pricingAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(224,92,74,0.10)",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "rgba(224,92,74,0.25)",
  },
  pricingAlertTitle: { fontSize: 13, fontWeight: "700", color: T.urgent, marginBottom: 3 },
  pricingAlertBody: { fontSize: 12, color: T.urgent, lineHeight: 17 },
  pricingWarn: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "rgba(232,153,58,0.10)",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(232,153,58,0.25)",
  },
  pricingWarnText: { fontSize: 12, color: T.accent, lineHeight: 17 },
  discountPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(61,107,71,0.10)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(61,107,71,0.25)",
  },
  discountBadge: {
    backgroundColor: T.accent,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: { fontSize: 12, fontWeight: "700", color: "#fff" },
  discountPreviewText: { fontSize: 13, color: T.green, flex: 1 },
  discountHighlight: { fontWeight: "700", color: T.green },
  saveBtn: {
    backgroundColor: T.green,
    borderRadius: 100,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "rgba(30,58,33,0.40)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },

  // Contents picker
  contentsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  contentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderColor: "rgba(61,107,71,0.30)",
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contentChipSelected: {
    backgroundColor: T.green,
    borderColor: T.green,
  },
  contentChipText: { fontSize: 13, color: T.green, fontWeight: "600" },
  contentChipTextSelected: { color: "#fff" },

  // Image picker
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(26,34,24,0.15)",
    borderStyle: "dashed",
  },
  imagePickerPreview: {
    width: "100%",
    height: 160,
  },
  imagePickerPlaceholder: {
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.55)",
  },
  imagePickerPlaceholderText: {
    fontSize: 13,
    color: T.muteStrong,
    fontWeight: "500",
  },
  imageRemoveBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  imageRemoveBtnText: { fontSize: 13, color: T.mute, fontWeight: "500" },

  // Repeat note
  repeatNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(232,153,58,0.10)",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "rgba(232,153,58,0.25)",
  },
  repeatNoteText: { fontSize: 12, color: T.accent, flex: 1 },
});
