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
import * as ImagePicker from "expo-image-picker";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ total: 0, spent: 0 });
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Edit modal
  const [editModal, setEditModal] = useState({ visible: false, type: null });
  const [editValue, setEditValue] = useState("");
  const [editValue2, setEditValue2] = useState(""); // confirm password
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
    if (!editValue.trim()) {
      Alert.alert("Error", "Field cannot be empty.");
      return;
    }
    if (editModal.type === "password") {
      if (editValue.length < 6) {
        Alert.alert("Error", "Password must be at least 6 characters.");
        return;
      }
      if (editValue !== editValue2) {
        Alert.alert("Error", "Passwords do not match.");
        return;
      }
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
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

  return (
    <>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header + Avatar hero */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>{t("profileTitle")}</Text>
          <View style={styles.avatarSection}>
            {/* Avatar */}
            {isRestaurant ? (
              <TouchableOpacity
                style={styles.avatarCircle}
                onPress={handlePickImage}
                activeOpacity={0.8}
                disabled={uploading}
              >
                {restaurant?.logo_url ? (
                  <Image source={{ uri: restaurant.logo_url }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{initials}</Text>
                )}
                <View style={styles.cameraOverlay}>
                  {uploading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="camera" size={14} color="#FFFFFF" />
                  )}
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <Text style={styles.displayName}>{displayName}</Text>
            <Text style={styles.emailText}>{user?.email}</Text>
            {isRestaurant && (
              <Text style={styles.restaurantBadge}>{t("restaurantAccount")}</Text>
            )}
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
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

        <View style={styles.sectionDivider} />

        {/* Account Settings */}
        <Text style={styles.sectionLabel}>{t("accountSettings")}</Text>
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[styles.menuRow, isRTL && styles.rtlRow]}
            onPress={() => openEdit("name")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#E8F5E9" }]}>
                <Ionicons name="person-outline" size={18} color="#2E7D32" />
              </View>
              <View>
                <Text style={styles.menuLabel}>{t("name")}</Text>
                <Text style={styles.menuSubValue} numberOfLines={1}>{displayName}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuRow, isRTL && styles.rtlRow]}
            onPress={() => openEdit("email")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#E3F2FD" }]}>
                <Ionicons name="mail-outline" size={18} color="#1565C0" />
              </View>
              <View>
                <Text style={styles.menuLabel}>{t("email")}</Text>
                <Text style={styles.menuSubValue} numberOfLines={1}>{user?.email}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />
          </TouchableOpacity>

          {!isRestaurant && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity
                style={[styles.menuRow, isRTL && styles.rtlRow]}
                onPress={() => navigation.navigate("Payment")}
                activeOpacity={0.7}
              >
                <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
                  <View style={[styles.menuIconBox, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="card-outline" size={18} color="#2E7D32" />
                  </View>
                  <Text style={styles.menuLabel}>{t("paymentMethod")}</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />
              </TouchableOpacity>
            </>
          )}

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuRow, isRTL && styles.rtlRow]}
            onPress={() => openEdit("password")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="lock-closed-outline" size={18} color="#7B1FA2" />
              </View>
              <View>
                <Text style={styles.menuLabel}>{t("password")}</Text>
                <Text style={styles.menuSubValue}>••••••••</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionDivider} />

        {/* Preferences */}
        <Text style={styles.sectionLabel}>{t("preferences")}</Text>
        <View style={styles.menuSection}>
          <TouchableOpacity
            style={[styles.menuRow, isRTL && styles.rtlRow]}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#E0F7FA" }]}>
                <Ionicons name="globe-outline" size={18} color="#00838F" />
              </View>
              <Text style={styles.menuLabel}>{t("language")}</Text>
            </View>
            <View style={styles.menuRight}>
              <Text style={styles.menuValue}>{language === "en" ? "English" : "العربية"}</Text>
              <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />
            </View>
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuRow, isRTL && styles.rtlRow]}
            onPress={() => navigation.navigate("Contact")}
            activeOpacity={0.7}
          >
            <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#F3E5F5" }]}>
                <Ionicons name="chatbubble-ellipses-outline" size={18} color="#7B1FA2" />
              </View>
              <Text style={styles.menuLabel}>{t("contactUs")}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#B8B8B8" />
          </TouchableOpacity>

          <View style={styles.menuDivider} />

          <TouchableOpacity
            style={[styles.menuRow, isRTL && styles.rtlRow]}
            onPress={handleSignOut}
            activeOpacity={0.7}
          >
            <View style={[styles.menuLeft, isRTL && styles.rtlRow]}>
              <View style={[styles.menuIconBox, { backgroundColor: "#FFEBEE" }]}>
                <Ionicons name="log-out-outline" size={18} color="#ED4956" />
              </View>
              <Text style={[styles.menuLabel, styles.menuLabelDestructive]}>{t("signOut")}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Version */}
        <View style={styles.versionRow}>
          <Text style={styles.versionText}>{t("appVersion")}</Text>
        </View>
      </ScrollView>

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
                  placeholderTextColor="#B8B8B8"
                  autoFocus
                />
                <Text style={styles.inputLabel}>{t("confirmPassword")}</Text>
                <TextInput
                  style={styles.input}
                  value={editValue2}
                  onChangeText={setEditValue2}
                  secureTextEntry
                  placeholder={t("repeatPassword")}
                  placeholderTextColor="#B8B8B8"
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
                  placeholderTextColor="#B8B8B8"
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
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.modalSaveText}>{t("saveChanges")}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  rtlRow: { flexDirection: "row-reverse" },

  // Header + avatar hero
  header: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },

  // Avatar section
  avatarSection: { alignItems: "center" },
  avatarCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  avatarImage: { width: 84, height: 84, borderRadius: 42 },
  avatarText: { fontSize: 30, fontWeight: "700", color: "#1B5E20" },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
  },
  displayName: { fontSize: 17, fontWeight: "700", color: "#FFFFFF", marginBottom: 4 },
  emailText: { fontSize: 13, color: "rgba(255,255,255,0.75)" },
  restaurantBadge: {
    marginTop: 8,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    fontSize: 12,
    color: "#A5D6A7",
    fontWeight: "600",
    overflow: "hidden",
  },

  // Stats row
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: "#DBDBDB",
    backgroundColor: "#E8F5E9",
  },
  statItem: { flex: 1, alignItems: "center" },
  statNum: { fontSize: 16, fontWeight: "700", color: "#1B5E20", marginBottom: 3, textAlign: "center" },
  statLabel: { fontSize: 12, color: "#4CAF50", textAlign: "center" },
  statDivider: { width: 1, backgroundColor: "#A5D6A7", marginHorizontal: 8 },

  sectionDivider: { height: 8, backgroundColor: "#FAFAFA" },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#737373",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 6,
  },

  // Menu
  menuSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.09,
    shadowRadius: 8,
    elevation: 4,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  menuLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  menuRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  menuIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  menuLabel: { fontSize: 15, color: "#0F0F0F", fontWeight: "400" },
  menuSubValue: { fontSize: 12, color: "#737373", marginTop: 1, maxWidth: 200 },
  menuLabelDestructive: { color: "#ED4956" },
  menuValue: { fontSize: 14, color: "#737373" },
  menuDivider: { height: 1, backgroundColor: "#F0F0F0", marginLeft: 66 },

  // Version
  versionRow: { alignItems: "center", paddingTop: 24 },
  versionText: { fontSize: 12, color: "#B8B8B8" },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
    gap: 4,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: "#DBDBDB",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0F0F0F",
    textAlign: "center",
    marginBottom: 16,
  },
  inputLabel: { fontSize: 13, fontWeight: "600", color: "#737373", marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F0F0F",
    backgroundColor: "#FAFAFA",
  },
  inputHint: { fontSize: 12, color: "#737373", marginTop: 6 },
  modalBtnRow: { flexDirection: "row", gap: 12, marginTop: 24 },
  modalCancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalCancelText: { fontSize: 15, color: "#737373", fontWeight: "500" },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: "#2E7D32",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
  },
  modalSaveText: { fontSize: 15, color: "#FFFFFF", fontWeight: "600" },
});
