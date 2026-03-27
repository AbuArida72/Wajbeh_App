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
  Image,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lang/LanguageContext";

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
        <Ionicons name={isOpen ? "chevron-up" : "chevron-down"} size={16} color="#737373" />
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
                {selected && <Ionicons name="checkmark" size={15} color="#2E7D32" />}
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
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  value: { fontSize: 15, color: "#0F0F0F", fontWeight: "500" },
  placeholder: { fontSize: 15, color: "#B8B8B8" },
  list: {
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    maxHeight: 200,
    marginTop: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
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
    borderBottomColor: "#F5F5F5",
  },
  optionSelected: { backgroundColor: "#E8F5E9" },
  optionText: { fontSize: 15, color: "#0F0F0F" },
  optionTextSelected: { color: "#2E7D32", fontWeight: "600" },
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
  const [bagImage, setBagImage] = useState(null); // null = use default
  const [repeatDays, setRepeatDays] = useState(1);
  const [servesPeople, setServesPeople] = useState(null);
  const [openDropdown, setOpenDropdown] = useState(null); // 'qty' | 'start' | 'end'

  const toggleDropdown = (key) => setOpenDropdown((prev) => (prev === key ? null : key));

  const pickBagImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionRequired"), t("galleryPermission"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (!result.canceled) setBagImage(result.assets[0].uri);
  };

  const uploadBagImage = async (uri) => {
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const ext = uri.split(".").pop()?.split("?")[0] || "jpg";
      const fileName = `bag-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("bag-images")
        .upload(fileName, blob, { contentType: `image/${ext}` });
      if (error) return DEFAULT_BAG_IMAGE;
      const { data: urlData } = supabase.storage
        .from("bag-images")
        .getPublicUrl(fileName);
      return urlData.publicUrl;
    } catch {
      return DEFAULT_BAG_IMAGE;
    }
  };

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
      return;
    }
    if (!isNextDayTime(pickupEnd) && pickupStart >= pickupEnd) {
      Alert.alert(t("pickupWindow"), "");
      return;
    }
    const discountPct = Math.round(
      (1 - parseFloat(price) / parseFloat(originalValue)) * 100,
    );
    if (discountPct < 50) {
      Alert.alert(t("priceTooHighTitle"), t("priceTooHighBlock"));
      return;
    }
    setSaving(true);

    let imageUrl = DEFAULT_BAG_IMAGE;
    if (bagImage) imageUrl = await uploadBagImage(bagImage);

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
      setBagImage(null);
      setRepeatDays(1);
      setServesPeople(null);
      setOpenDropdown(null);
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
                { backgroundColor: isAvailable ? "#2E7D32" : "#B8B8B8" },
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
                {item.category || "Surprise Bag"} · {discount}% off
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
              {isAvailable ? t("active") : t("soldOutStatus").replace("🔴 ", "")}
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
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!restaurant) {
    return (
      <View style={styles.noRestaurantContainer}>
        <Ionicons name="storefront-outline" size={48} color="#B8B8B8" />
        <Text style={styles.noRestaurantTitle}>No restaurant found</Text>
        <Text style={styles.noRestaurantSubtitle}>
          Your account is not linked to any restaurant.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
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
                  <Text style={styles.restaurantName} numberOfLines={1}>{restaurant.name}</Text>
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
                <Ionicons name="add" size={16} color="#1B5E20" />
                <Text style={styles.addBtnLabel}>{t("addBag").replace("+ ", "")}</Text>
              </TouchableOpacity>
            </View>

            {/* Stats row */}
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

            {/* Section title */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{t("todayBags")}</Text>
              <Text style={styles.sectionCount}>{bags.length}</Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bag-handle-outline" size={40} color="#B8B8B8" />
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
          {/* Green modal header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHandle} />
            <View style={styles.modalTitleRow}>
              <View style={styles.modalTitleLeft}>
                <View style={styles.modalTitleIcon}>
                  <Ionicons name="bag-handle" size={18} color="#FFFFFF" />
                </View>
                <Text style={styles.modalTitle}>{t("addNewBag")}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
            <ScrollView
              style={styles.modalBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
            >
              {/* BAG IMAGE */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="image-outline" size={13} color="#6A1B9A" />
                  <Text style={[styles.modalSectionTitle, { color: "#6A1B9A" }]}>{t("bagImageSection")}</Text>
                </View>
                <TouchableOpacity style={styles.imagePicker} onPress={pickBagImage} activeOpacity={0.85}>
                  {bagImage ? (
                    <Image source={{ uri: bagImage }} style={styles.imagePickerPreview} />
                  ) : (
                    <View style={styles.imagePickerPlaceholder}>
                      <Ionicons name="camera-outline" size={28} color="#B8B8B8" />
                      <Text style={styles.imagePickerPlaceholderText}>{t("tapToUploadImage")}</Text>
                    </View>
                  )}
                </TouchableOpacity>
                {bagImage && (
                  <TouchableOpacity style={styles.imageRemoveBtn} onPress={() => setBagImage(null)} activeOpacity={0.8}>
                    <Text style={styles.imageRemoveBtnText}>{t("useDefaultImage")}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* BAG DETAILS */}
              <View style={styles.modalSection}>
                <View style={styles.sectionChip}>
                  <Ionicons name="pencil-outline" size={13} color="#1565C0" />
                  <Text style={[styles.modalSectionTitle, { color: "#1565C0" }]}>BAG DETAILS</Text>
                </View>

                <Text style={styles.inputLabel}>{t("bagTitle")}</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="pricetag-outline" size={15} color="#B8B8B8" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Surprise Pastry Bag"
                    placeholderTextColor="#B8B8B8"
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>

                <Text style={styles.inputLabel}>{t("description")}</Text>
                <View style={[styles.inputWrapper, styles.inputWrapperMulti]}>
                  <TextInput
                    style={[styles.input, styles.inputMulti]}
                    placeholder="What's in the bag? (optional)"
                    placeholderTextColor="#B8B8B8"
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
                  <Ionicons name="list-outline" size={13} color="#2E7D32" />
                  <Text style={[styles.modalSectionTitle, { color: "#2E7D32" }]}>{t("possibleContentsSection")}</Text>
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
                          color={selected ? "#FFFFFF" : "#2E7D32"}
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
                  <Ionicons name="cash-outline" size={13} color="#E65100" />
                  <Text style={[styles.modalSectionTitle, { color: "#E65100" }]}>PRICING</Text>
                </View>

                <View style={styles.inputRow}>
                  <View style={styles.inputHalf}>
                    <Text style={styles.inputLabel}>{t("yourPrice")}</Text>
                    <View style={[styles.inputWrapper, styles.inputWrapperGreen]}>
                      <Text style={styles.inputPrefixGreen}>JD</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="3.50"
                        placeholderTextColor="#B8B8B8"
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
                        placeholderTextColor="#B8B8B8"
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
                        <Ionicons name="close-circle-outline" size={16} color="#C62828" />
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
                          <Ionicons name="information-circle-outline" size={16} color="#E65100" />
                          <Text style={[styles.pricingWarnText, { flex: 1 }]}>{t("priceLowerSuggestion")}</Text>
                        </View>
                      </>
                    );
                  }
                  return (
                    <View style={styles.discountPreview}>
                      <View style={[styles.discountBadge, { backgroundColor: "#1B5E20" }]}>
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
                  <Ionicons name="layers-outline" size={13} color="#6A1B9A" />
                  <Text style={[styles.modalSectionTitle, { color: "#6A1B9A" }]}>{t("quantity").replace(" *", "")}</Text>
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
                  <Ionicons name="people-outline" size={13} color="#0277BD" />
                  <Text style={[styles.modalSectionTitle, { color: "#0277BD" }]}>{t("servingSizeSection")}</Text>
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
                  <Ionicons name="time-outline" size={13} color="#00838F" />
                  <Text style={[styles.modalSectionTitle, { color: "#00838F" }]}>PICKUP TIME</Text>
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
                  <Ionicons name="repeat-outline" size={13} color="#BF360C" />
                  <Text style={[styles.modalSectionTitle, { color: "#BF360C" }]}>{t("repeatSection")}</Text>
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
                    <Ionicons name="information-circle-outline" size={13} color="#BF360C" />
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

              <View style={{ height: 40 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  noRestaurantContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    gap: 12,
    backgroundColor: "#FFFFFF",
  },
  noRestaurantTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0F0F0F",
    marginTop: 8,
    textAlign: "center",
  },
  noRestaurantSubtitle: { fontSize: 14, color: "#737373", textAlign: "center" },

  // Restaurant header
  restaurantHeader: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingBottom: 28,
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
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  restaurantAvatarText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  restaurantName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 2,
  },
  restaurantMeta: { fontSize: 12, color: "rgba(255,255,255,0.7)" },
  addBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  addBtnLabel: { fontSize: 13, color: "#1B5E20", fontWeight: "700" },

  // Stats row
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#E8F5E9",
    borderBottomWidth: 1,
    borderBottomColor: "#A5D6A7",
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  statItemDivider: {
    width: 1,
    backgroundColor: "#A5D6A7",
    marginVertical: 4,
  },
  statNum: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 3,
    textAlign: "center",
  },
  statLabel: { fontSize: 11, color: "#4CAF50", textAlign: "center" },

  // Section header
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F0F0F", textAlign: "center" },
  sectionCount: { fontSize: 13, color: "#737373" },

  // List
  list: { paddingHorizontal: 0, paddingTop: 0, paddingBottom: 32 },

  // Bag card
  bagCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#2E7D32",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
  },
  bagCardSoldOut: { opacity: 0.7, borderLeftColor: "#B8B8B8" },
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
    color: "#0F0F0F",
    marginBottom: 2,
  },
  textMuted: { color: "#B8B8B8" },
  bagCardMeta: { fontSize: 12, color: "#737373" },
  bagStatusBadge: { marginLeft: 8 },
  bagStatusText: { fontSize: 11, fontWeight: "600" },
  bagStatusTextAvailable: { color: "#2E7D32" },
  bagStatusTextSoldOut: { color: "#ED4956" },

  // Price row
  bagPriceRow: {
    flexDirection: "row",
    backgroundColor: "#FAFAFA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  bagPriceItem: { flex: 1, alignItems: "center" },
  bagPriceDivider: {
    width: 1,
    backgroundColor: "#EBEBEB",
    marginHorizontal: 4,
  },
  bagPriceLabel: {
    fontSize: 10,
    color: "#737373",
    marginBottom: 4,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  bagPriceValue: { fontSize: 15, fontWeight: "700", color: "#0F0F0F" },
  bagPriceOriginal: {
    fontSize: 13,
    fontWeight: "500",
    color: "#B8B8B8",
    textDecorationLine: "line-through",
  },
  bagPriceEarned: { fontSize: 15, fontWeight: "700", color: "#2E7D32" },

  // Progress
  progressSection: { marginBottom: 14 },
  progressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  progressLabel: { fontSize: 12, color: "#737373", fontWeight: "500" },
  progressPct: { fontSize: 12, fontWeight: "600", color: "#2E7D32" },
  progressBar: {
    height: 6,
    backgroundColor: "#F0F0F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2E7D32",
    borderRadius: 3,
  },
  progressFooter: { marginTop: 4 },
  progressRemaining: { fontSize: 11, color: "#B8B8B8" },

  // Sold out button
  soldOutBtn: {
    paddingVertical: 10,
    alignItems: "center",
  },
  soldOutBtnText: { fontSize: 13, fontWeight: "600", color: "#ED4956" },

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
    color: "#0F0F0F",
    marginTop: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#737373",
    textAlign: "center",
    lineHeight: 22,
  },
  emptyAddBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyAddBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },

  // Modal
  modal: { flex: 1, backgroundColor: "#FAFAFA" },
  modalHeader: {
    backgroundColor: "#1B5E20",
    paddingTop: 16,
    paddingBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.35)",
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
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  modalBody: { flex: 1, backgroundColor: "#FAFAFA" },
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
    color: "#0F0F0F",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  inputWrapperGreen: {
    borderColor: "#A5D6A7",
    backgroundColor: "#F2F8F2",
  },
  inputWrapperMulti: { alignItems: "flex-start", paddingTop: 4 },
  inputPrefix: {
    fontSize: 14,
    color: "#737373",
    marginRight: 8,
    fontWeight: "600",
  },
  inputPrefixGreen: {
    fontSize: 14,
    color: "#2E7D32",
    marginRight: 8,
    fontWeight: "700",
  },
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#0F0F0F" },
  inputMulti: { paddingTop: 8, height: 80, textAlignVertical: "top" },
  inputRow: { flexDirection: "row", gap: 12 },
  inputHalf: { flex: 1 },
  pricingAlert: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFEBEE",
    borderRadius: 10,
    padding: 12,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  pricingAlertTitle: { fontSize: 13, fontWeight: "700", color: "#C62828", marginBottom: 3 },
  pricingAlertBody: { fontSize: 12, color: "#B71C1C", lineHeight: 17 },
  pricingWarn: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFE0B2",
  },
  pricingWarnText: { fontSize: 12, color: "#E65100", lineHeight: 17 },
  discountPreview: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  discountBadge: {
    backgroundColor: "#F57F17",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  discountBadgeText: { fontSize: 12, fontWeight: "700", color: "#FFFFFF" },
  discountPreviewText: { fontSize: 13, color: "#2E7D32", flex: 1 },
  discountHighlight: { fontWeight: "700", color: "#1B5E20" },
  saveBtn: {
    backgroundColor: "#1B5E20",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
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
    borderColor: "#A5D6A7",
    backgroundColor: "#F9FBE7",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  contentChipSelected: {
    backgroundColor: "#2E7D32",
    borderColor: "#2E7D32",
  },
  contentChipText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
  contentChipTextSelected: { color: "#FFFFFF" },

  // Image picker
  imagePicker: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#DBDBDB",
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
    backgroundColor: "#FAFAFA",
  },
  imagePickerPlaceholderText: {
    fontSize: 13,
    color: "#B8B8B8",
    fontWeight: "500",
  },
  imageRemoveBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  imageRemoveBtnText: { fontSize: 13, color: "#737373", fontWeight: "500" },

  // Repeat note
  repeatNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#FBE9E7",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#FFCCBC",
  },
  repeatNoteText: { fontSize: 12, color: "#BF360C", flex: 1 },
});
