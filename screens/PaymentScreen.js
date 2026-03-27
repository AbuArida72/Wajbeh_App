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

function CardVisual({ number, name, expiry, cvv, cvvFocused, t }) {
  return (
    <View style={[styles.card, cvvFocused && styles.cardFlipped]}>
      <View style={styles.cardShine} />
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
      <Text style={styles.cardNumber} numberOfLines={1}>{number}</Text>
      <View style={styles.cardBottomRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.cardFieldLabel}>{t("cardPreviewName")}</Text>
          <Text style={styles.cardFieldValue} numberOfLines={1}>
            {(name || t("cardPreviewName")).toUpperCase()}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end" }}>
          <Text style={styles.cardFieldLabel}>{t("validThru")}</Text>
          <Text style={styles.cardFieldValue}>{expiry || "MM/YY"}</Text>
        </View>
      </View>
      <Text style={styles.cardWatermark}>WAJBEH</Text>
      {cvvFocused && (
        <View style={styles.cvvHintRow}>
          <Text style={styles.cvvHintLabel}>CVV</Text>
          <View style={styles.cvvHintBox}>
            <Text style={styles.cvvHintText}>
              {"•".repeat(cvv?.replace(/\D/g, "").length || 3)}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
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
  const [editMode, setEditMode] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const successTimer = useRef(null);

  const nameRef = useRef(null);
  const expiryRef = useRef(null);
  const cvvRef = useRef(null);

  useEffect(() => {
    loadExistingCard();
    return () => { if (successTimer.current) clearTimeout(successTimer.current); };
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

  const enterEditMode = () => {
    setCardNumber(existingCard?.card_number_masked || "");
    setCardName(existingCard?.cardholder_name || "");
    setExpiry(existingCard?.expiry_date || "");
    setCvv("");
    setFieldErrors({});
    setEditMode(true);
  };

  const cancelEdit = () => {
    setCardNumber("");
    setCardName(existingCard?.cardholder_name || "");
    setExpiry(existingCard?.expiry_date || "");
    setCvv("");
    setFieldErrors({});
    setEditMode(false);
  };

  const handleSave = async () => {
    const cardUnchanged = existingCard && cardNumber === existingCard.card_number_masked;
    const digits = cardNumber.replace(/\D/g, "");
    const expiryDigits = expiry.replace(/\D/g, "");
    const cvvDigits = cvv.replace(/\D/g, "");

    // Collect all field errors at once
    const errors = {};
    if (!cardUnchanged && digits.length < 16) errors.cardNumber = t("enterValidCard");
    if (!cardName.trim()) errors.cardName = t("enterCardholderName");
    if (expiryDigits.length < 4) errors.expiry = t("enterValidExpiry");
    if (cvvDigits.length < 3) errors.cvv = t("enterValidCvv");

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const maskedNumber = cardUnchanged
        ? existingCard.card_number_masked
        : "•••• •••• •••• " + digits.slice(-4);

      const fullNumber = cardUnchanged
        ? existingCard.card_number_full
        : formatCardNumber(cardNumber);

      const payload = {
        user_id: user.id,
        card_number_masked: maskedNumber,
        card_number_full: fullNumber,
        cardholder_name: cardName.trim(),
        expiry_date: expiry,
        cvv_masked: "•••",
      };

      // Upsert — one call handles both insert and update
      const { data: saved, error } = await supabase
        .from("payment_methods")
        .upsert(payload, { onConflict: "user_id" })
        .select()
        .single();

      if (error) throw error;

      // Update local state directly — no second round-trip needed
      setExistingCard(saved);
      setCardNumber("");
      setCvv("");
      setEditMode(false);
      setShowDetails(false);
      setSavedSuccess(true);
      successTimer.current = setTimeout(() => setSavedSuccess(false), 3000);
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
          if (error) {
            Alert.alert("Error", error.message);
          } else {
            setExistingCard(null);
            setCardName("");
            setExpiry("");
            setCardNumber("");
            setCvv("");
            setEditMode(false);
          }
        },
      },
    ]);
  };

  // In view mode use the saved masked number; in edit mode use live input
  const isViewMode = !!existingCard && !editMode;
  const cardIsUnchangedMask = existingCard && cardNumber === existingCard.card_number_masked;
  const displayNumber = isViewMode || cardIsUnchangedMask
    ? (existingCard?.card_number_masked ?? "•••• •••• •••• ••••")
    : formatCardNumber(cardNumber) || "•••• •••• •••• ••••";
  const displayName = isViewMode ? existingCard.cardholder_name : cardName;
  const displayExpiry = isViewMode ? existingCard.expiry_date : expiry;

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
      <View style={[styles.header, { paddingTop: insets.top + 12 }, isRTL && styles.rtlRow]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, isRTL && styles.rtl]}>{t("paymentTitle")}</Text>
          <Text style={[styles.headerSubtitle, isRTL && styles.rtl]}>{t("paymentSubtitle")}</Text>
        </View>
        {existingCard && isViewMode && (
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
          {/* Success banner */}
          {savedSuccess && (
            <View style={[styles.successBanner, isRTL && styles.rtlRow]}>
              <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
              <Text style={[styles.successBannerText, isRTL && styles.rtl]}>
                {t("cardAdded")}
              </Text>
            </View>
          )}

          {/* Card Visual */}
          <View style={styles.cardSection}>
            <CardVisual
              number={displayNumber}
              name={displayName}
              expiry={displayExpiry}
              cvv={cvv}
              cvvFocused={cvvFocused}
              t={t}
            />
          </View>

          {/* VIEW MODE — saved card, no form */}
          {isViewMode && (
            <View style={styles.form}>
              {/* Show / hide details toggle */}
              <TouchableOpacity
                style={[styles.detailsToggleBtn, isRTL && styles.rtlRow]}
                onPress={() => setShowDetails((v) => !v)}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={showDetails ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color="#1B5E20"
                />
                <Text style={styles.detailsToggleBtnText}>
                  {showDetails ? t("hideCardDetails") : t("showCardDetails")}
                </Text>
              </TouchableOpacity>

              {/* Expanded details panel */}
              {showDetails && (
                <View style={styles.detailsPanel}>
                  <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                    <Text style={[styles.detailLabel, isRTL && styles.rtl]}>{t("cardNumber")}</Text>
                    {existingCard.card_number_full ? (
                      <Text style={[styles.detailValue, isRTL && styles.rtl]}>
                        {existingCard.card_number_full}
                      </Text>
                    ) : (
                      <TouchableOpacity onPress={enterEditMode} activeOpacity={0.8}>
                        <Text style={styles.detailReEnter}>{t("reEnterToReveal")}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                    <Text style={[styles.detailLabel, isRTL && styles.rtl]}>{t("cardholderName")}</Text>
                    <Text style={[styles.detailValue, isRTL && styles.rtl]}>
                      {existingCard.cardholder_name}
                    </Text>
                  </View>
                  <View style={styles.detailDivider} />
                  <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                    <Text style={[styles.detailLabel, isRTL && styles.rtl]}>{t("expiryDate")}</Text>
                    <Text style={[styles.detailValue, isRTL && styles.rtl]}>
                      {existingCard.expiry_date}
                    </Text>
                  </View>
                </View>
              )}

              <View style={[styles.savedInfoBox, isRTL && styles.rtlRow]}>
                <Ionicons name="shield-checkmark-outline" size={16} color="#2E7D32" />
                <Text style={[styles.savedInfoText, isRTL && styles.rtl]}>
                  {t("cardSavedInfo")}
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.editBtn, isRTL && styles.rtlRow]}
                onPress={enterEditMode}
                activeOpacity={0.88}
              >
                <Ionicons name="create-outline" size={18} color="#1B5E20" />
                <Text style={styles.editBtnText}>{t("editCard")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ADD / EDIT MODE — form shown */}
          {!isViewMode && (
            <View style={styles.form}>
              {/* Card Number */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, isRTL && styles.rtl]}>{t("cardNumber")}</Text>
                <View style={[styles.inputRow, isRTL && styles.rtlRow, fieldErrors.cardNumber && styles.inputRowError]}>
                  <View style={[styles.inputIconBox, { backgroundColor: "#E8F5E9" }]}>
                    <Ionicons name="card-outline" size={18} color="#2E7D32" />
                  </View>
                  <TextInput
                    style={[styles.input, isRTL && styles.rtlInput]}
                    placeholder="0000 0000 0000 0000"
                    placeholderTextColor="#737373"
                    value={cardNumber}
                    onChangeText={(v) => {
                      if (existingCard && v === existingCard.card_number_masked) {
                        setCardNumber(v);
                        return;
                      }
                      const formatted = formatCardNumber(v);
                      setCardNumber(formatted);
                      if (fieldErrors.cardNumber) setFieldErrors((e) => ({ ...e, cardNumber: null }));
                      if (formatted.replace(/\s/g, "").length === 16) nameRef.current?.focus();
                    }}
                    keyboardType="number-pad"
                    maxLength={19}
                    returnKeyType="next"
                    onSubmitEditing={() => nameRef.current?.focus()}
                  />
                </View>
                {fieldErrors.cardNumber && (
                  <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.cardNumber}</Text>
                )}
              </View>

              {/* Cardholder Name */}
              <View style={styles.fieldGroup}>
                <Text style={[styles.label, isRTL && styles.rtl]}>{t("cardholderName")}</Text>
                <View style={[styles.inputRow, isRTL && styles.rtlRow, fieldErrors.cardName && styles.inputRowError]}>
                  <View style={[styles.inputIconBox, { backgroundColor: "#E3F2FD" }]}>
                    <Ionicons name="person-outline" size={18} color="#1565C0" />
                  </View>
                  <TextInput
                    ref={nameRef}
                    style={[styles.input, isRTL && styles.rtlInput]}
                    placeholder={t("cardholderNamePlaceholder")}
                    placeholderTextColor="#B8B8B8"
                    value={cardName}
                    onChangeText={(v) => {
                      setCardName(v);
                      if (fieldErrors.cardName) setFieldErrors((e) => ({ ...e, cardName: null }));
                    }}
                    autoCapitalize="characters"
                    returnKeyType="next"
                    onSubmitEditing={() => expiryRef.current?.focus()}
                  />
                </View>
                {fieldErrors.cardName && (
                  <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.cardName}</Text>
                )}
              </View>

              {/* Expiry + CVV */}
              <View style={[styles.twoCol, isRTL && styles.rtlRow]}>
                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.label, isRTL && styles.rtl]}>{t("expiryDate")}</Text>
                  <View style={[styles.inputRow, isRTL && styles.rtlRow, fieldErrors.expiry && styles.inputRowError]}>
                    <View style={[styles.inputIconBox, { backgroundColor: "#F3E5F5" }]}>
                      <Ionicons name="calendar-outline" size={18} color="#7B1FA2" />
                    </View>
                    <TextInput
                      ref={expiryRef}
                      style={[styles.input, isRTL && styles.rtlInput]}
                      placeholder={t("expiryPlaceholder")}
                      placeholderTextColor="#B8B8B8"
                      value={expiry}
                      onChangeText={(v) => {
                        setExpiry(formatExpiry(v));
                        if (fieldErrors.expiry) setFieldErrors((e) => ({ ...e, expiry: null }));
                      }}
                      keyboardType="number-pad"
                      maxLength={5}
                      returnKeyType="next"
                      onSubmitEditing={() => cvvRef.current?.focus()}
                    />
                  </View>
                  {fieldErrors.expiry && (
                    <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.expiry}</Text>
                  )}
                </View>

                <View style={[styles.fieldGroup, { flex: 1 }]}>
                  <Text style={[styles.label, isRTL && styles.rtl]}>{t("cvv")}</Text>
                  <View style={[styles.inputRow, isRTL && styles.rtlRow, fieldErrors.cvv && styles.inputRowError]}>
                    <View style={[styles.inputIconBox, { backgroundColor: "#FFF3E0" }]}>
                      <Ionicons name="lock-closed-outline" size={18} color="#E65100" />
                    </View>
                    <TextInput
                      ref={cvvRef}
                      style={[styles.input, isRTL && styles.rtlInput]}
                      placeholder={t("cvvPlaceholder")}
                      placeholderTextColor="#B8B8B8"
                      value={cvv}
                      onChangeText={(v) => {
                        setCvv(v.replace(/\D/g, "").slice(0, 4));
                        if (fieldErrors.cvv) setFieldErrors((e) => ({ ...e, cvv: null }));
                      }}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      onFocus={() => setCvvFocused(true)}
                      onBlur={() => setCvvFocused(false)}
                    />
                  </View>
                  {fieldErrors.cvv && (
                    <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.cvv}</Text>
                  )}
                </View>
              </View>

              {/* Security note */}
              <View style={[styles.secureNote, isRTL && styles.rtlRow]}>
                <Ionicons name="shield-checkmark-outline" size={14} color="#2E7D32" />
                <Text style={[styles.secureNoteText, isRTL && styles.rtl]}>
                  {t("cardSecureNote")}
                </Text>
              </View>

              {/* Save button */}
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled, isRTL && styles.rtlRow]}
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

              {/* Cancel button — only shown when editing an existing card */}
              {editMode && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={cancelEdit}
                  activeOpacity={0.88}
                >
                  <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: "#FAFAFA" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FFFFFF" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
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

  // Success banner
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#A5D6A7",
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2E7D32",
    flex: 1,
  },

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
  cardFlipped: { backgroundColor: "#0D3B12" },
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
  cardBrand: { flexDirection: "row" },
  brandCircle1: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  brandCircle2: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginLeft: -10,
  },
  cardChip: {
    width: 36, height: 28, borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "space-around",
    paddingVertical: 5,
    paddingHorizontal: 4,
  },
  chipLine: { height: 2, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 1 },
  cardNumber: {
    fontSize: 18, fontWeight: "600", color: "#FFFFFF",
    letterSpacing: 3, textAlign: "center",
  },
  cardBottomRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
  },
  cardFieldLabel: {
    fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "600",
    letterSpacing: 1, textTransform: "uppercase", marginBottom: 3,
  },
  cardFieldValue: { fontSize: 13, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.5 },
  cardWatermark: {
    position: "absolute", bottom: 16, left: 0, right: 0,
    textAlign: "center", fontSize: 9, color: "rgba(255,255,255,0.12)",
    fontWeight: "700", letterSpacing: 4,
  },
  cvvHintRow: {
    position: "absolute", bottom: 22, right: 22, alignItems: "flex-end", gap: 4,
  },
  cvvHintLabel: {
    fontSize: 9, color: "rgba(255,255,255,0.6)", fontWeight: "600", letterSpacing: 1,
  },
  cvvHintBox: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6,
  },
  cvvHintText: { fontSize: 14, color: "#FFFFFF", letterSpacing: 4, fontWeight: "700" },

  // Form
  scroll: { flexGrow: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 16 },
  fieldGroup: { gap: 8 },
  twoCol: { flexDirection: "row", gap: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#0F0F0F" },
  inputRow: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 12,
    borderWidth: 1, borderColor: "#DBDBDB", overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  inputRowError: {
    borderColor: "#ED4956",
    borderWidth: 1.5,
  },
  fieldError: {
    fontSize: 12,
    color: "#ED4956",
    fontWeight: "500",
    marginTop: 4,
    marginLeft: 4,
  },
  inputIconBox: {
    width: 48, height: 50, alignItems: "center", justifyContent: "center",
    borderRightWidth: 1, borderRightColor: "#F0F0F0",
  },
  input: {
    flex: 1, height: 50, paddingHorizontal: 14,
    fontSize: 15, color: "#0F0F0F", fontWeight: "500",
  },

  // Security note
  secureNote: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#E8F5E9", borderRadius: 10, padding: 12,
    borderWidth: 1, borderColor: "#A5D6A7",
  },
  secureNoteText: { fontSize: 12, color: "#2E7D32", flex: 1, lineHeight: 18 },

  // Details toggle button
  detailsToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#F0F7F0",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#A5D6A7",
    paddingVertical: 13,
  },
  detailsToggleBtnText: { fontSize: 15, fontWeight: "600", color: "#1B5E20" },

  // Details panel
  detailsPanel: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  detailDivider: { height: 1, backgroundColor: "#F5F5F5", marginHorizontal: 16 },
  detailLabel: { fontSize: 13, color: "#737373", fontWeight: "500" },
  detailValue: { fontSize: 14, color: "#0F0F0F", fontWeight: "600", letterSpacing: 0.3 },
  detailReEnter: { fontSize: 13, color: "#2E7D32", fontWeight: "600", textDecorationLine: "underline" },

  // Saved info box
  savedInfoBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#E8F5E9", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#A5D6A7",
  },
  savedInfoText: { fontSize: 13, color: "#2E7D32", flex: 1, lineHeight: 19 },

  // Edit button
  editBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#FFFFFF", borderRadius: 12,
    borderWidth: 1.5, borderColor: "#1B5E20",
    paddingVertical: 15,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  editBtnText: { fontSize: 15, fontWeight: "700", color: "#1B5E20" },

  // Save button
  saveBtn: {
    backgroundColor: "#2E7D32", borderRadius: 12, paddingVertical: 16,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10,
    shadowColor: "#1B5E20", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },

  // Cancel button
  cancelBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  cancelBtnText: { fontSize: 15, fontWeight: "600", color: "#737373" },
});
