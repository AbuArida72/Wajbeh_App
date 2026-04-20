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
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { T, GlassPanel, WallpaperBackground, ar } from "../components/Glass";

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
  const flipAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(flipAnim, {
      toValue: cvvFocused ? 1 : 0,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [cvvFocused]);

  const frontRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotateY = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-180deg", "0deg"],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 0.45, 0.55, 1],
    outputRange: [0, 0, 1, 1],
  });

  const cvvDigits = cvv?.replace(/\D/g, "") || "";

  return (
    <View style={styles.cardWrapper}>
      {/* Inner clip handles borderRadius + overflow — shadow lives on outer wrapper */}
      <View style={styles.cardClip}>
      {/* ── Front face ── */}
      <Animated.View style={[styles.card, { transform: [{ rotateY: frontRotateY }], opacity: frontOpacity }]}>
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
        <Text style={styles.cardWatermark}>ZAYTOON</Text>
      </Animated.View>

      {/* ── Back face ── */}
      <Animated.View style={[styles.cardBack, { transform: [{ rotateY: backRotateY }], opacity: backOpacity }]}>
        <Text style={styles.cardWatermark}>ZAYTOON</Text>
        {/* Magnetic stripe */}
        <View style={styles.magStripe} />
        {/* Signature strip + CVV */}
        <View style={styles.cvvStripRow}>
          <View style={styles.cvvSignatureStrip} />
          <View style={styles.cvvBox}>
            <Text style={styles.cvvBoxLabel}>CVV</Text>
            <Text style={styles.cvvBoxValue}>
              {cvvDigits.length > 0 ? cvvDigits : "•••"}
            </Text>
          </View>
        </View>
      </Animated.View>
      </View>{/* end cardClip */}
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
        <WallpaperBackground />
        <ActivityIndicator color={T.green} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.wrapper}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
      <WallpaperBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }, isRTL && styles.rtlRow]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={T.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>{t("paymentTitle")}</Text>
          <Text style={[styles.headerSubtitle, isRTL && styles.rtl]}>{t("paymentSubtitle")}</Text>
        </View>
        {existingCard && isViewMode && (
          <TouchableOpacity style={styles.removeBtn} onPress={handleRemove} activeOpacity={0.8}>
            <Ionicons name="trash-outline" size={18} color={T.urgent} />
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
              <Ionicons name="checkmark-circle" size={18} color={T.green} />
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
                <View style={styles.fieldIconWrap}>
                  <Ionicons name={showDetails ? "eye-off-outline" : "eye-outline"} size={16} color={T.green} />
                </View>
                <Text style={styles.detailsToggleBtnText}>
                  {showDetails ? t("hideCardDetails") : t("showCardDetails")}
                </Text>
              </TouchableOpacity>

              {/* Expanded details panel */}
              {showDetails && (
                <GlassPanel radius={16} style={{ overflow: "hidden" }}>
                  {[
                    { label: t("cardNumber"), key: "number" },
                    { label: t("cardholderName"), key: "name" },
                    { label: t("expiryDate"), key: "expiry" },
                  ].map(({ label, key }, i, arr) => (
                    <View key={key}>
                      <View style={[styles.detailRow, isRTL && styles.rtlRow]}>
                        <Text style={[styles.detailLabel, isRTL && styles.rtl]}>{label}</Text>
                        {key === "number" ? (
                          existingCard.card_number_full ? (
                            <Text style={[styles.detailValue, isRTL && styles.rtl]}>
                              {existingCard.card_number_full}
                            </Text>
                          ) : (
                            <TouchableOpacity onPress={enterEditMode} activeOpacity={0.8}>
                              <Text style={styles.detailReEnter}>{t("reEnterToReveal")}</Text>
                            </TouchableOpacity>
                          )
                        ) : (
                          <Text style={[styles.detailValue, isRTL && styles.rtl]}>
                            {key === "name" ? existingCard.cardholder_name : existingCard.expiry_date}
                          </Text>
                        )}
                      </View>
                      {i < arr.length - 1 && <View style={styles.detailDivider} />}
                    </View>
                  ))}
                </GlassPanel>
              )}

              {/* Saved info */}
              <GlassPanel radius={14} padding={14} style={{ overflow: "hidden" }}>
                <View style={[{ flexDirection: "row", alignItems: "center", gap: 10 }, isRTL && styles.rtlRow]}>
                  <View style={styles.fieldIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={15} color={T.green} />
                  </View>
                  <Text style={[styles.savedInfoText, isRTL && styles.rtl, { flex: 1 }]}>
                    {t("cardSavedInfo")}
                  </Text>
                </View>
              </GlassPanel>

              <TouchableOpacity
                style={[styles.editBtn, isRTL && styles.rtlRow]}
                onPress={enterEditMode}
                activeOpacity={0.88}
              >
                <Ionicons name="create-outline" size={18} color={T.green} />
                <Text style={styles.editBtnText}>{t("editCard")}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ADD / EDIT MODE — glass form */}
          {!isViewMode && (
            <View style={styles.form}>
              {/* Glass fields panel */}
              <GlassPanel radius={20} style={{ overflow: "hidden" }}>
                {/* Card Number */}
                <View style={[styles.field, styles.fieldBorder, isRTL && styles.rtlRow]}>
                  <View style={styles.fieldIconWrap}>
                    <Ionicons name="card-outline" size={16} color={T.green} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("cardNumber")}</Text>
                    <TextInput
                      style={[styles.fieldInput, isRTL && styles.rtlInput,
                        fieldErrors.cardNumber && styles.fieldInputError]}
                      placeholder="0000 0000 0000 0000"
                      placeholderTextColor={T.muteStrong}
                      value={cardNumber}
                      onChangeText={(v) => {
                        if (existingCard && v === existingCard.card_number_masked) {
                          setCardNumber(v); return;
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
                    {fieldErrors.cardNumber && (
                      <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.cardNumber}</Text>
                    )}
                  </View>
                </View>

                {/* Cardholder Name */}
                <View style={[styles.field, styles.fieldBorder, isRTL && styles.rtlRow]}>
                  <View style={[styles.fieldIconWrap, { backgroundColor: "rgba(232,153,58,0.12)" }]}>
                    <Ionicons name="person-outline" size={16} color={T.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("cardholderName")}</Text>
                    <TextInput
                      ref={nameRef}
                      style={[styles.fieldInput, isRTL && styles.rtlInput,
                        fieldErrors.cardName && styles.fieldInputError]}
                      placeholder={t("cardholderNamePlaceholder")}
                      placeholderTextColor={T.muteStrong}
                      value={cardName}
                      onChangeText={(v) => {
                        setCardName(v);
                        if (fieldErrors.cardName) setFieldErrors((e) => ({ ...e, cardName: null }));
                      }}
                      autoCapitalize="characters"
                      returnKeyType="next"
                      onSubmitEditing={() => expiryRef.current?.focus()}
                    />
                    {fieldErrors.cardName && (
                      <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.cardName}</Text>
                    )}
                  </View>
                </View>

                {/* Expiry + CVV — side by side in same panel */}
                <View style={[styles.twoFieldRow, isRTL && styles.rtlRow]}>
                  <View style={[styles.field, { flex: 1 }, isRTL && styles.rtlRow]}>
                    <View style={[styles.fieldIconWrap, { backgroundColor: "rgba(123,31,162,0.09)" }]}>
                      <Ionicons name="calendar-outline" size={16} color="#7B1FA2" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("expiryDate")}</Text>
                      <TextInput
                        ref={expiryRef}
                        style={[styles.fieldInput, isRTL && styles.rtlInput,
                          fieldErrors.expiry && styles.fieldInputError]}
                        placeholder={t("expiryPlaceholder")}
                        placeholderTextColor={T.muteStrong}
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
                      {fieldErrors.expiry && (
                        <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.expiry}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.twoFieldDivider} />

                  <View style={[styles.field, { flex: 1 }, isRTL && styles.rtlRow]}>
                    <View style={[styles.fieldIconWrap, { backgroundColor: "rgba(224,92,74,0.10)" }]}>
                      <Ionicons name="lock-closed-outline" size={16} color={T.urgent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("cvv")}</Text>
                      <TextInput
                        ref={cvvRef}
                        style={[styles.fieldInput, isRTL && styles.rtlInput,
                          fieldErrors.cvv && styles.fieldInputError]}
                        placeholder={t("cvvPlaceholder")}
                        placeholderTextColor={T.muteStrong}
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
                      {fieldErrors.cvv && (
                        <Text style={[styles.fieldError, isRTL && styles.rtl]}>{fieldErrors.cvv}</Text>
                      )}
                    </View>
                  </View>
                </View>
              </GlassPanel>

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
  wrapper: { flex: 1, backgroundColor: "#fdfcf9" },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },
  rtlInput: { textAlign: "right" },

  // Header
  header: {
    backgroundColor: "transparent",
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },
  removeBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(224,92,74,0.10)",
    borderWidth: 1,
    borderColor: "rgba(224,92,74,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 18, fontWeight: "700", color: T.ink },
  headerSubtitle: { fontSize: 12, color: T.mute, marginTop: 2 },

  // Success banner
  successBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(61,107,71,0.10)",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "rgba(61,107,71,0.25)",
  },
  successBannerText: {
    fontSize: 14,
    fontWeight: "600",
    color: T.green,
    flex: 1,
  },

  // Card visual
  cardSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 8,
    alignItems: "center",
  },
  // Outer wrapper — carries the shadow, rounded to match card shape
  // backgroundColor needed on Android so elevation shadow renders correctly
  cardWrapper: {
    width: "100%",
    maxWidth: 340,
    aspectRatio: 1.586,
    borderRadius: 18,
    backgroundColor: T.green,
    shadowColor: T.green,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  // Inner clip — overflow:hidden rounds the corners without clipping the shadow
  cardClip: {
    flex: 1,
    borderRadius: 18,
    overflow: "hidden",
  },
  // Front face — fills cardClip absolutely
  card: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: T.green,
    padding: 22,
    justifyContent: "space-between",
  },
  // Back face — fills cardClip absolutely
  cardBack: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "#2a5034",
    justifyContent: "flex-start",
  },
  magStripe: {
    height: 52,
    backgroundColor: "rgba(0,0,0,0.78)",
    marginTop: 24,
  },
  cvvStripRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  cvvSignatureStrip: {
    flex: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  cvvBox: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignItems: "center",
    minWidth: 64,
  },
  cvvBoxLabel: {
    fontSize: 8,
    color: "#555",
    fontWeight: "700",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  cvvBoxValue: {
    fontSize: 18,
    color: "#0F0F0F",
    fontWeight: "800",
    letterSpacing: 4,
    marginTop: 3,
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
  // Form
  scroll: { flexGrow: 1 },
  form: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },

  // Glass field rows (Sign In–style)
  field: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 12, gap: 12,
  },
  fieldBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(26,34,24,0.07)",
  },
  fieldIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(61,107,71,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  fieldLabel: {
    fontSize: 10, fontWeight: "700", color: T.green,
    textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 2,
  },
  fieldInput: {
    fontSize: 15, color: T.ink, fontWeight: "500",
    paddingVertical: 2,
  },
  fieldInputError: { color: T.urgent },
  fieldError: {
    fontSize: 11, color: T.urgent, fontWeight: "600",
    marginTop: 2, letterSpacing: 0.2,
  },
  twoFieldRow: { flexDirection: "row" },
  twoFieldDivider: { width: 1, backgroundColor: "rgba(26,34,24,0.07)", marginVertical: 10 },

  // Security note
  secureNoteText: { fontSize: 12, color: T.green, lineHeight: 18 },

  // Details toggle button
  detailsToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.85)",
    paddingVertical: 13,
    shadowColor: "rgba(40,55,35,0.10)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  detailsToggleBtnText: { fontSize: 14, fontWeight: "600", color: T.green },

  // Details panel rows (inside GlassPanel)
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  detailDivider: { height: 1, backgroundColor: "rgba(26,34,24,0.07)", marginHorizontal: 14 },
  detailLabel: { fontSize: 13, color: T.mute, fontWeight: "500" },
  detailValue: { fontSize: 14, color: T.ink, fontWeight: "600", letterSpacing: 0.3 },
  detailReEnter: { fontSize: 13, color: T.green, fontWeight: "600", textDecorationLine: "underline" },

  // Saved info
  savedInfoText: { fontSize: 13, color: T.green, lineHeight: 19 },

  // Edit button
  editBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "rgba(255,255,255,0.72)", borderRadius: 100,
    borderWidth: 1.5, borderColor: T.green,
    paddingVertical: 14,
    shadowColor: "rgba(40,55,35,0.10)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  editBtnText: { fontSize: 14, fontWeight: "700", color: T.green },

  // Save button
  saveBtn: {
    backgroundColor: T.green, borderRadius: 100, paddingVertical: 15,
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.25)",
    shadowColor: "rgba(30,60,35,0.35)", shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1, shadowRadius: 18, elevation: 5,
    marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },

  // Cancel button
  cancelBtn: {
    alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 100,
    backgroundColor: "rgba(255,255,255,0.55)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.75)",
  },
  cancelBtnText: { fontSize: 14, fontWeight: "600", color: T.mute },
});
