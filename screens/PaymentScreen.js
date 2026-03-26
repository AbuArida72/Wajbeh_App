import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

function formatCardNumber(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function formatExpiry(raw) {
  const digits = raw.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits;
}

function maskCardNumber(raw) {
  const digits = raw.replace(/\D/g, "");
  if (digits.length <= 4) return digits.padEnd(16, "•").replace(/(.{4})/g, "$1 ").trim();
  const visible = digits.slice(-4);
  const masked = "•".repeat(Math.max(0, digits.length - 4));
  const full = (masked + visible).padEnd(16, "•");
  return full.replace(/(.{4})/g, "$1 ").trim();
}

export default function PaymentScreen({ navigation }) {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [cvvFocused, setCvvFocused] = useState(false);
  const [saving, setSaving] = useState(false);
  const [existingCard, setExistingCard] = useState(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const nameRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);

  useEffect(() => {
    loadExistingCard();
  }, []);

  const loadExistingCard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoadingExisting(false); return; }
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("user_id", user.id)
      .single();
    if (data) {
      setExistingCard(data);
      setCardName(data.cardholder_name || "");
      setExpiry(data.expiry_date || "");
    }
    setLoadingExisting(false);
  };

  const handleSave = async () => {
    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 16) {
      Alert.alert("Invalid Card", "Please enter a valid 16-digit card number.");
      return;
    }
    if (!cardName.trim()) {
      Alert.alert("Missing Name", "Please enter the cardholder name.");
      return;
    }
    const expiryDigits = expiry.replace(/\D/g, "");
    if (expiryDigits.length < 4) {
      Alert.alert("Invalid Expiry", "Please enter a valid expiry date (MM/YY).");
      return;
    }
    const cvvDigits = cvv.replace(/\D/g, "");
    if (cvvDigits.length < 3) {
      Alert.alert("Invalid CVV", "Please enter a valid CVV.");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const last4 = digits.slice(-4);
      const maskedNumber = "•••• •••• •••• " + last4;

      const payload = {
        user_id: user.id,
        card_number_masked: maskedNumber,
        cardholder_name: cardName.trim(),
        expiry_date: expiry,
        cvv_masked: "•••",
      };

      let error;
      if (existingCard) {
        ({ error } = await supabase
          .from("payment_methods")
          .update(payload)
          .eq("id", existingCard.id));
      } else {
        ({ error } = await supabase.from("payment_methods").insert(payload));
      }

      if (error) throw error;

      Alert.alert(t("cardAdded"), "", [
        { text: "OK", onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert("Error", e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = () => {
    Alert.alert(t("removeCard"), t("confirmRemoveCard"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("removeCard"),
        style: "destructive",
        onPress: async () => {
          if (!existingCard) return;
          const { error } = await supabase
            .from("payment_methods")
            .delete()
            .eq("id", existingCard.id);
          if (error) Alert.alert("Error", error.message);
          else navigation.goBack();
        },
      },
    ]);
  };

  const displayNumber = maskCardNumber(cardNumber);
  const displayName = cardName.trim() || t("cardPreviewName");
  const displayExpiry = expiry || "MM/YY";

  if (loadingExisting) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator color="#2E7D32" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, isRTL && styles.rtl]}>{t("paymentTitle")}</Text>
          <Text style={[styles.headerSubtitle, isRTL && styles.rtl]}>{t("paymentSubtitle")}</Text>
        </View>
        {existingCard && (
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color="#FFCDD2" />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card Visual */}
          <View style={styles.cardSection}>
            <View style={[styles.card, cvvFocused && styles.cardFlipped]}>
              {/* Card front */}
              <View style={styles.cardFront}>
                {/* Card shine effect */}
                <View style={styles.cardShine} />

                {/* Top row */}
                <View style={styles.cardTopRow}>
                  <View style={styles.cardBrand}>
                    <View style={styles.brandCircle1} />
                    <View style={styles.brandCircle2} />
                  </View>
                  <View style={styles.cardChip}>
                    <View style={styles.chipLine} />
                    <View style={styles.chipLine} />
                    <View style={styles.chipLine} />
                  </View>
                </View>

                {/* Card number */}
                <Text style={styles.cardNumber} numberOfLines={1}>
                  {displayNumber}
                </Text>

                {/* Bottom row */}
                <View style={styles.cardBottomRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardFieldLabel}>{t("cardPreviewName")}</Text>
                    <Text style={styles.cardFieldValue} numberOfLines={1}>
                      {displayName.toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Text style={styles.cardFieldLabel}>{t("validThru")}</Text>
                    <Text style={styles.cardFieldValue}>{displayExpiry}</Text>
                  </View>
                </View>

                {/* Card label watermark */}
                <Text style={styles.cardWatermark}>WAJBEH</Text>
              </View>

              {/* CVV hint when focused */}
              {cvvFocused && (
                <View style={styles.cvvHintRow}>
                  <Text style={styles.cvvHintLabel}>CVV</Text>
                  <View style={styles.cvvHintBox}>
                    <Text style={styles.cvvHintText}>{"•".repeat(cvv.replace(/\D/g, "").length || 3)}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Card Number */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>{t("cardNumber")}</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconBox, { backgroundColor: "#E8F5E9" }]}>
                  <Ionicons name="card-outline" size={18} color="#2E7D32" />
                </View>
                <TextInput
                  style={[styles.input, isRTL && styles.rtlInput]}
                  placeholder={t("cardNumberPlaceholder")}
                  placeholderTextColor="#B8B8B8"
                  value={cardNumber}
                  onChangeText={(v) => {
                    const formatted = formatCardNumber(v);
                    setCardNumber(formatted);
                    if (formatted.replace(/\s/g, "").length === 16) nameRef.current?.focus();
                  }}
                  keyboardType="number-pad"
                  maxLength={19}
                  returnKeyType="next"
                  onSubmitEditing={() => nameRef.current?.focus()}
                />
              </View>
            </View>

            {/* Cardholder Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>{t("cardholderName")}</Text>
              <View style={styles.inputRow}>
                <View style={[styles.inputIconBox, { backgroundColor: "#E3F2FD" }]}>
                  <Ionicons name="person-outline" size={18} color="#1565C0" />
                </View>
                <TextInput
                  ref={nameRef}
                  style={[styles.input, isRTL && styles.rtlInput]}
                  placeholder={t("cardholderNamePlaceholder")}
                  placeholderTextColor="#B8B8B8"
                  value={cardName}
                  onChangeText={setCardName}
                  autoCapitalize="characters"
                  returnKeyType="next"
                  onSubmitEditing={() => expiryRef.current?.focus()}
                />
              </View>
            </View>

            {/* Expiry + CVV row */}
            <View style={styles.twoCol}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, isRTL && styles.rtl]}>{t("expiryDate")}</Text>
                <View style={styles.inputRow}>
                  <View style={[styles.inputIconBox, { backgroundColor: "#F3E5F5" }]}>
                    <Ionicons name="calendar-outline" size={18} color="#7B1FA2" />
                  </View>
                  <TextInput
                    ref={expiryRef}
                    style={[styles.input, isRTL && styles.rtlInput]}
                    placeholder={t("expiryPlaceholder")}
                    placeholderTextColor="#B8B8B8"
                    value={expiry}
                    onChangeText={(v) => setExpiry(formatExpiry(v))}
                    keyboardType="number-pad"
                    maxLength={5}
                    returnKeyType="next"
                    onSubmitEditing={() => cvvRef.current?.focus()}
                  />
                </View>
              </View>

              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={[styles.label, isRTL && styles.rtl]}>{t("cvv")}</Text>
                <View style={styles.inputRow}>
                  <View style={[styles.inputIconBox, { backgroundColor: "#FFF3E0" }]}>
                    <Ionicons name="lock-closed-outline" size={18} color="#E65100" />
                  </View>
                  <TextInput
                    ref={cvvRef}
                    style={[styles.input, isRTL && styles.rtlInput]}
                    placeholder={t("cvvPlaceholder")}
                    placeholderTextColor="#B8B8B8"
                    value={cvv}
                    onChangeText={(v) => setCvv(v.replace(/\D/g, "").slice(0, 4))}
                    keyboardType="number-pad"
                    maxLength={4}
                    secureTextEntry
                    onFocus={() => setCvvFocused(true)}
                    onBlur={() => setCvvFocused(false)}
                  />
                </View>
              </View>
            </View>

            {/* Security note */}
            <View style={styles.secureNote}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#2E7D32" />
              <Text style={[styles.secureNoteText, isRTL && styles.rtl]}>
                {t("cardSecureNote")}
              </Text>
            </View>

            {/* Save button */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.saveBtnText}>{t("saveCard")}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlInput: { textAlign: "right" },

  // Header
  header: {
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingBottom: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: "#FFFFFF" },
  headerSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 2 },

  // Card visual
  cardSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 1.586,
    borderRadius: 18,
    backgroundColor: "#1B5E20",
    padding: 22,
    justifyContent: "space-between",
    overflow: "hidden",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  cardFlipped: {
    backgroundColor: "#0D3B12",
  },
  cardShine: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardBrand: {
    flexDirection: "row",
  },
  brandCircle1: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  brandCircle2: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginLeft: -10,
  },
  cardChip: {
    width: 36,
    height: 28,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "space-around",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  chipLine: {
    height: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 1,
  },
  cardNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: 3,
    textAlign: "center",
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardFieldLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  cardFieldValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  cardWatermark: {
    position: "absolute",
    bottom: 16,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 9,
    color: "rgba(255,255,255,0.12)",
    fontWeight: "700",
    letterSpacing: 4,
  },
  cvvHintRow: {
    position: "absolute",
    bottom: 22,
    right: 22,
    alignItems: "flex-end",
    gap: 4,
  },
  cvvHintLabel: {
    fontSize: 9,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "600",
    letterSpacing: 1,
  },
  cvvHintBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cvvHintText: { fontSize: 14, color: "#FFFFFF", letterSpacing: 4, fontWeight: "700" },

  // Form
  scroll: { flexGrow: 1 },
  form: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 16,
  },
  fieldGroup: { gap: 8 },
  twoCol: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#0F0F0F" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#DBDBDB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  inputIconBox: {
    width: 48,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRightWidth: 1,
    borderRightColor: "#F0F0F0",
  },
  input: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
    color: "#0F0F0F",
    fontWeight: "500",
  },

  // Security note
  secureNote: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#E8F5E9",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  secureNoteText: { fontSize: 12, color: "#2E7D32", flex: 1, lineHeight: 18 },

  // Save button
  saveBtn: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
});
