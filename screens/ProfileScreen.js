import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
  Modal,
  TextInput,
  Image,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GlassPanel, GlassButton, T, WallpaperBackground, WALLPAPER, TextBackdrop, ar } from "../components/Glass";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ total: 0, spent: 0 });
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [editModal, setEditModal] = useState({ visible: false, type: null });
  const [editValue, setEditValue] = useState("");
  const [editValue2, setEditValue2] = useState("");
  const [saving, setSaving] = useState(false);

  const { t, language, toggleLanguage, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const { data: { user: u } } = await supabase.auth.getUser();
    setUser(u);
    if (!u) { setLoading(false); return; }

    const [{ data: profile }, { data: orders }] = await Promise.all([
      supabase.from("profiles").select("is_restaurant").eq("id", u.id).single(),
      supabase.from("orders").select("amount_paid").eq("user_id", u.id),
    ]);

    const isRest = profile?.is_restaurant || false;
    setIsRestaurant(isRest);

    if (isRest) {
      const { data: rest } = await supabase
        .from("restaurants")
        .select("id, name, logo_url")
        .eq("owner_id", u.id)
        .single();
      setRestaurant(rest);
    }

    if (orders) {
      setOrderStats({
        total: orders.length,
        spent: orders.reduce((s, o) => s + parseFloat(o.amount_paid || 0), 0),
      });
    }

    setLoading(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to upload a logo.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.75,
    });

    if (result.canceled) return;

    setUploading(true);
    try {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileName = `logo_${restaurant.id}_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("restaurant-logos")
        .upload(fileName, blob, { contentType: "image/jpeg", upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("restaurant-logos")
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("restaurants")
        .update({ logo_url: publicUrl })
        .eq("id", restaurant.id);

      if (updateError) throw updateError;

      setRestaurant((prev) => ({ ...prev, logo_url: publicUrl }));
    } catch (e) {
      Alert.alert("Upload failed", e.message);
    } finally {
      setUploading(false);
    }
  };

  const openEdit = (type) => {
    setEditValue(
      type === "name" ? (user?.user_metadata?.full_name || "") :
      type === "email" ? (user?.email || "") : ""
    );
    setEditValue2("");
    setEditModal({ visible: true, type });
  };

  const handleSave = async () => {
    if (!editValue.trim()) { Alert.alert("Error", "Field cannot be empty."); return; }
    if (editModal.type === "password") {
      if (editValue.length < 6) { Alert.alert("Error", "Password must be at least 6 characters."); return; }
      if (editValue !== editValue2) { Alert.alert("Error", "Passwords do not match."); return; }
    }

    setSaving(true);
    try {
      let updatePayload = {};
      if (editModal.type === "name") updatePayload = { data: { full_name: editValue.trim() } };
      else if (editModal.type === "email") updatePayload = { email: editValue.trim() };
      else if (editModal.type === "password") updatePayload = { password: editValue };

      const { data, error } = await supabase.auth.updateUser(updatePayload);
      if (error) throw error;

      if (editModal.type === "email") {
        Alert.alert("Check your email", "A confirmation link has been sent to your new address.");
      } else {
        setUser(data.user);
        Alert.alert("Saved", "Your profile has been updated.");
      }
      setEditModal({ visible: false, type: null });
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(t("signOut"), t("signOutConfirm"), [
      { text: t("cancel") || "Cancel", style: "cancel" },
      { text: t("signOut"), style: "destructive", onPress: () => supabase.auth.signOut() },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <WallpaperBackground />
        <View style={styles.center}><ActivityIndicator size="large" color={T.green} /></View>
      </View>
    );
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0];

  const memberSince = new Date(user?.created_at).toLocaleDateString(
    language === "ar" ? "ar-JO" : "en-JO",
    { year: "numeric", month: "short" },
  );

  const editModalTitle =
    editModal.type === "name" ? t("editName") :
    editModal.type === "email" ? t("changeEmail") : t("changePassword");

  const ACCOUNT_ROWS = [
    { type: "name", icon: "person-outline", label: t("name"), value: displayName },
    { type: "email", icon: "mail-outline", label: t("email"), value: user?.email },
    ...(!isRestaurant ? [{ type: "payment", icon: "card-outline", label: t("paymentMethod"), value: null, nav: true }] : []),
    { type: "password", icon: "lock-closed-outline", label: t("password"), value: "••••••••" },
  ];

  return (
    <>
      <View style={styles.root}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <WallpaperBackground />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }]}
        >
          {/* Header label */}
          <Text style={[styles.screenLabel, isRTL && styles.rtl]}>· {t("appName")}</Text>
          <Text style={[styles.screenTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>{t("profileTitle")}</Text>

          {/* Avatar card */}
          <GlassPanel radius={24} padding={20} style={styles.avatarCard}>
            <View style={{ alignItems: "center" }}>
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={isRestaurant ? handlePickImage : undefined}
                disabled={!isRestaurant || uploading}
                activeOpacity={isRestaurant ? 0.8 : 1}
              >
                {isRestaurant && restaurant?.logo_url ? (
                  <Image source={{ uri: restaurant.logo_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
                {isRestaurant && (
                  <View style={styles.cameraOverlay}>
                    {uploading
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Ionicons name="camera" size={13} color="#fff" />
                    }
                  </View>
                )}
              </TouchableOpacity>
              <Text style={styles.displayName}>{displayName}</Text>
              <Text style={styles.emailText}>{user?.email}</Text>
              {isRestaurant && (
                <View style={styles.restaurantBadge}>
                  <Text style={styles.restaurantBadgeText}>{t("restaurantAccount")}</Text>
                </View>
              )}
            </View>

            {/* Stats */}
            <View style={[styles.statsRow, isRTL && styles.rtlRow]}>
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{orderStats.total}</Text>
                <Text style={styles.statLabel}>{t("ordersCount")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>JD {orderStats.spent.toFixed(0)}</Text>
                <Text style={styles.statLabel}>{isRestaurant ? t("earned") : t("spent")}</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statNum}>{memberSince}</Text>
                <Text style={styles.statLabel}>{t("memberBadge")}</Text>
              </View>
            </View>
          </GlassPanel>

          {/* Account Settings */}
          <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>{t("accountSettings")}</Text>
          <GlassPanel radius={18} style={{ overflow: "hidden", marginBottom: 16 }}>
            {ACCOUNT_ROWS.map((row, i) => (
              <View key={row.type}>
                <TouchableOpacity
                  style={[styles.menuRow, isRTL && styles.rtlRow]}
                  onPress={() => row.nav ? navigation.navigate("Payment") : openEdit(row.type)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
                    <View style={styles.menuIconBadge}>
                      <Ionicons name={row.icon} size={15} color={T.green} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.menuLabel, isRTL && styles.rtl]}>{row.label}</Text>
                      {row.value && <Text style={[styles.menuSub, isRTL && styles.rtl]} numberOfLines={1}>{row.value}</Text>}
                    </View>
                  </View>
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={T.muteStrong} />
                </TouchableOpacity>
                {i < ACCOUNT_ROWS.length - 1 && <View style={styles.menuDivider} />}
              </View>
            ))}
          </GlassPanel>

          {/* Preferences */}
          <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>{t("preferences")}</Text>
          <GlassPanel radius={18} style={{ overflow: "hidden", marginBottom: 16 }}>
            <TouchableOpacity style={[styles.menuRow, isRTL && styles.rtlRow]} onPress={toggleLanguage} activeOpacity={0.7}>
              <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
                <View style={styles.menuIconBadge}>
                  <Ionicons name="globe-outline" size={15} color={T.green} />
                </View>
                <Text style={[styles.menuLabel, isRTL && styles.rtl]}>{t("language")}</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.menuValue}>{language === "en" ? "English" : "العربية"}</Text>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={T.muteStrong} />
              </View>
            </TouchableOpacity>
            <View style={styles.menuDivider} />
            <TouchableOpacity style={[styles.menuRow, isRTL && styles.rtlRow]} onPress={() => navigation.navigate("Contact")} activeOpacity={0.7}>
              <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
                <View style={styles.menuIconBadge}>
                  <Ionicons name="chatbubble-ellipses-outline" size={15} color={T.green} />
                </View>
                <Text style={[styles.menuLabel, isRTL && styles.rtl]}>{t("contactUs")}</Text>
              </View>
              <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={T.muteStrong} />
            </TouchableOpacity>
          </GlassPanel>

          {/* Sign out */}
          <GlassButton danger onPress={handleSignOut} style={{ borderColor: "rgba(237,73,86,0.35)" }}>
            {t("signOut")}
          </GlassButton>

          <Text style={styles.versionText}>{t("appVersion")}</Text>
        </ScrollView>
      </View>

      {/* Edit Modal */}
      <Modal
        visible={editModal.visible}
        transparent
        animationType="slide"
        onRequestClose={() => setEditModal({ visible: false, type: null })}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setEditModal({ visible: false, type: null })}
          />
          <View style={styles.modalSheet}>
            <LinearGradient colors={WALLPAPER.colors} start={WALLPAPER.start} end={WALLPAPER.end} style={StyleSheet.absoluteFill} />
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{editModalTitle}</Text>

            {editModal.type === "password" ? (
              <>
                <Text style={styles.inputLabel}>{t("newPassword")}</Text>
                <TextInput
                  style={styles.input}
                  value={editValue}
                  onChangeText={setEditValue}
                  secureTextEntry
                  placeholder={t("atLeast6Chars")}
                  placeholderTextColor={T.muteStrong}
                  autoFocus
                />
                <Text style={styles.inputLabel}>{t("confirmPassword")}</Text>
                <TextInput
                  style={styles.input}
                  value={editValue2}
                  onChangeText={setEditValue2}
                  secureTextEntry
                  placeholder={t("repeatPassword")}
                  placeholderTextColor={T.muteStrong}
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>
                  {editModal.type === "name" ? t("fullName") : t("emailAddress")}
                </Text>
                <TextInput
                  style={styles.input}
                  value={editValue}
                  onChangeText={setEditValue}
                  keyboardType={editModal.type === "email" ? "email-address" : "default"}
                  autoCapitalize={editModal.type === "email" ? "none" : "words"}
                  placeholder={editModal.type === "name" ? t("yourName") : "email@example.com"}
                  placeholderTextColor={T.muteStrong}
                  autoFocus
                />
                {editModal.type === "email" && (
                  <Text style={styles.inputHint}>{t("confirmEmailHint")}</Text>
                )}
              </>
            )}

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEditModal({ visible: false, type: null })}
              >
                <Text style={styles.modalCancelText}>{t("cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.modalSaveText}>{t("saveChanges")}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  scroll: { paddingHorizontal: 20 },
  screenLabel: { fontSize: 9, letterSpacing: 1.3, textTransform: "uppercase", color: T.green, fontWeight: "700", marginBottom: 4 },
  screenTitle: { fontSize: 26, fontWeight: "800", color: T.ink, letterSpacing: -0.8, marginBottom: 20 },

  // Avatar card
  avatarCard: { marginBottom: 24 },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderWidth: 2, borderColor: "rgba(255,255,255,0.8)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12, overflow: "hidden",
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontSize: 28, fontWeight: "700", color: T.ink },
  cameraOverlay: {
    position: "absolute", bottom: 0, left: 0, right: 0, height: 24,
    backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center",
  },
  displayName: { fontSize: 17, fontWeight: "700", color: T.ink, marginBottom: 3 },
  emailText: { fontSize: 12, color: T.mute },
  restaurantBadge: { marginTop: 8, backgroundColor: "rgba(61,107,71,0.12)", borderRadius: 100, paddingHorizontal: 12, paddingVertical: 4 },
  restaurantBadgeText: { fontSize: 11, color: T.green, fontWeight: "600" },

  statsRow: { flexDirection: "row", marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(26,34,24,0.08)" },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 15, fontWeight: "700", color: T.green, marginBottom: 2, textAlign: "center" },
  statLabel: { fontSize: 9, color: T.mute, textAlign: "center", letterSpacing: 0.3 },
  statDivider: { width: 1, backgroundColor: "rgba(26,34,24,0.10)", marginVertical: 2 },

  sectionLabel: { fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase", color: T.green, fontWeight: "700", marginBottom: 8 },

  menuIconBadge: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(61,107,71,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  menuRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  menuLabel: { fontSize: 14, color: T.ink, fontWeight: "600" },
  menuSub: { fontSize: 11, color: T.mute, marginTop: 1, maxWidth: 200 },
  menuValue: { fontSize: 13, color: T.mute },
  menuDivider: { height: 1, backgroundColor: "rgba(26,34,24,0.07)", marginHorizontal: 14 },

  versionText: { fontSize: 11, color: T.muteStrong, textAlign: "center", marginTop: 20 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.35)" },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, gap: 4, overflow: "hidden" },
  modalHandle: { width: 40, height: 4, backgroundColor: "rgba(26,34,24,0.2)", borderRadius: 2, alignSelf: "center", marginBottom: 20 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: T.ink, textAlign: "center", marginBottom: 16 },
  inputLabel: { fontSize: 11, fontWeight: "700", color: T.green, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: "rgba(61,107,71,0.25)", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: T.ink, backgroundColor: "rgba(255,255,255,0.75)",
  },
  inputHint: { fontSize: 11, color: T.mute, marginTop: 6 },
  modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalCancelBtn: { flex: 1, borderWidth: 1, borderColor: "rgba(26,34,24,0.2)", borderRadius: 100, paddingVertical: 13, alignItems: "center" },
  modalCancelText: { fontSize: 14, color: T.mute, fontWeight: "500" },
  modalSaveBtn: { flex: 1, backgroundColor: T.green, borderRadius: 100, paddingVertical: 13, alignItems: "center" },
  modalSaveText: { fontSize: 14, color: "#fff", fontWeight: "600" },
});
