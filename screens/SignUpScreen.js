import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function SignUpScreen({ navigation, onAuthSuccess }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const { t, isRTL, language, toggleLanguage } = useLanguage();

  const signUp = async () => {
    setError("");
    if (!fullName || !email || !password || !confirmPassword) {
      setError(t("fillAllFields"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    if (data?.user) {
      await supabase
        .from("profiles")
        .upsert({ id: data.user.id, is_restaurant: false });
    }
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <View style={styles.doneIconCircle}>
            <Text style={styles.doneIcon}>📧</Text>
          </View>
          <Text style={styles.doneTitle}>
            {isRTL ? "تحقق من بريدك!" : "Check your email!"}
          </Text>
          <Text style={[styles.doneSubtitle, isRTL && styles.rtl]}>
            {isRTL
              ? "أرسلنا رابط التأكيد إلى"
              : "We sent a confirmation link to"}
          </Text>
          <Text style={styles.doneEmail}>{email}</Text>
          <View style={styles.doneSteps}>
            {[
              isRTL ? "افتح بريدك الإلكتروني" : "Open your email",
              isRTL ? "اضغط على رابط التأكيد" : "Click the confirmation link",
              isRTL ? "عد وسجّل دخولك" : "Come back and sign in",
            ].map((step, i) => (
              <View key={i} style={styles.doneStep}>
                <View style={styles.doneStepNum}>
                  <Text style={styles.doneStepNumText}>{i + 1}</Text>
                </View>
                <Text style={[styles.doneStepText, isRTL && styles.rtl]}>
                  {step}
                </Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.goSignInBtn}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.goSignInBtnText}>
              {isRTL ? "الذهاب لتسجيل الدخول →" : "Go to Sign In →"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const inputField = (
    key,
    placeholder,
    icon,
    secure = false,
    keyboard = "default",
  ) => (
    <View style={styles.fieldGroup}>
      <Text style={[styles.label, isRTL && styles.rtl]}>{t(key)}</Text>
      <View
        style={[
          styles.inputWrapper,
          focusedField === key && styles.inputWrapperFocused,
        ]}
      >
        <Text style={styles.inputIcon}>{icon}</Text>
        <TextInput
          style={[styles.input, isRTL && styles.inputRTL]}
          placeholder={placeholder}
          placeholderTextColor="#B4D4B4"
          secureTextEntry={secure}
          keyboardType={keyboard}
          autoCapitalize={keyboard === "email-address" ? "none" : "words"}
          value={
            key === "fullName"
              ? fullName
              : key === "emailAddress"
                ? email
                : key === "password"
                  ? password
                  : confirmPassword
          }
          onChangeText={
            key === "fullName"
              ? setFullName
              : key === "emailAddress"
                ? setEmail
                : key === "password"
                  ? setPassword
                  : setConfirmPassword
          }
          onFocus={() => setFocusedField(key)}
          onBlur={() => setFocusedField(null)}
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* Banner */}
          <View style={styles.banner}>
            <View style={styles.bannerTop}>
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => navigation.goBack()}
              >
                <Text style={styles.backText}>{isRTL ? "→" : "←"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
                <Text style={styles.langBtnText}>
                  {language === "en" ? "🇯🇴 AR" : "🇬🇧 EN"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.bannerContent}>
              <Text style={styles.bannerEmoji}>🌱</Text>
              <Text style={styles.bannerTitle}>{t("createAccount")}</Text>
              <Text style={styles.bannerSubtitle}>{t("joinUs")}</Text>
            </View>
            <View style={styles.wave} />
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Benefits pills */}
            <View style={styles.benefitsRow}>
              <View style={styles.benefitPill}>
                <Text style={styles.benefitText}>🆓 Free to join</Text>
              </View>
              <View style={styles.benefitPill}>
                <Text style={styles.benefitText}>💚 Save food</Text>
              </View>
              <View style={styles.benefitPill}>
                <Text style={styles.benefitText}>💰 Save money</Text>
              </View>
            </View>

            <View style={styles.formDivider} />

            {/* Fields */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("fullName")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "name" && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={isRTL ? "اسمك الكامل" : "Your full name"}
                  placeholderTextColor="#B4D4B4"
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("emailAddress")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "email" && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>✉️</Text>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder="you@email.com"
                  placeholderTextColor="#B4D4B4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("password")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "pass" && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={
                    isRTL ? "٦ أحرف على الأقل" : "At least 6 characters"
                  }
                  placeholderTextColor="#B4D4B4"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("pass")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("confirmPassword")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "confirm" && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔐</Text>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={
                    isRTL ? "أعد كلمة المرور" : "Repeat your password"
                  }
                  placeholderTextColor="#B4D4B4"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedField("confirm")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={[styles.errorText, isRTL && styles.rtl]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Submit */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={signUp}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{t("createAccountBtn")}</Text>
              )}
            </TouchableOpacity>

            {/* Sign in link */}
            <TouchableOpacity
              style={styles.signInLink}
              onPress={() => navigation.navigate("SignIn")}
            >
              <Text style={[styles.signInLinkText, isRTL && styles.rtl]}>
                {t("hasAccount")}{" "}
                <Text style={styles.signInLinkHighlight}>{t("signIn")}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Restaurant note */}
          <View style={styles.restaurantNote}>
            <Text style={styles.restaurantNoteIcon}>🏪</Text>
            <Text style={[styles.restaurantNoteText, isRTL && styles.rtl]}>
              {t("restaurantNote")}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F7F0" },
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingBottom: 32 },
  rtl: { textAlign: "right", writingDirection: "rtl" },

  // Banner
  banner: { backgroundColor: "#2E7D32", paddingBottom: 48 },
  bannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    paddingTop: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  backText: { fontSize: 18, color: "#FFFFFF", fontWeight: "700" },
  langBtn: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  langBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 13 },
  bannerContent: { alignItems: "center", paddingVertical: 16 },
  bannerEmoji: { fontSize: 44, marginBottom: 10 },
  bannerTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  bannerSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.75)" },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
    backgroundColor: "#F0F7F0",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },

  // Form card
  formCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    marginTop: -8,
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },

  // Benefits
  benefitsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  benefitPill: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  benefitText: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  formDivider: { height: 1, backgroundColor: "#F0F7F0", marginBottom: 16 },

  // Fields
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "700", color: "#1B5E20", marginBottom: 8 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FDF8",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputWrapperFocused: {
    borderColor: "#2E7D32",
    backgroundColor: "#FFFFFF",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputIcon: { fontSize: 16, marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: "#1B5E20" },
  inputRTL: { textAlign: "right" },

  // Error
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorIcon: { fontSize: 14 },
  errorText: { color: "#C62828", fontSize: 13, flex: 1, lineHeight: 18 },

  // Button
  btn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  signInLink: { alignItems: "center" },
  signInLinkText: { fontSize: 14, color: "#888780" },
  signInLinkHighlight: { color: "#2E7D32", fontWeight: "800" },

  // Restaurant note
  restaurantNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    margin: 20,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  restaurantNoteIcon: { fontSize: 20 },
  restaurantNoteText: {
    fontSize: 13,
    color: "#5F5E5A",
    flex: 1,
    lineHeight: 20,
  },

  // Done screen
  doneContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F0F7F0",
  },
  doneIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 3,
    borderColor: "#C8E6C9",
  },
  doneIcon: { fontSize: 48 },
  doneTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
  },
  doneSubtitle: { fontSize: 15, color: "#888780", marginBottom: 4 },
  doneEmail: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 28,
  },
  doneSteps: { width: "100%", marginBottom: 28, gap: 12 },
  doneStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  doneStepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  doneStepNumText: { color: "#FFFFFF", fontWeight: "800", fontSize: 13 },
  doneStepText: { fontSize: 14, color: "#1B5E20", fontWeight: "500", flex: 1 },
  goSignInBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    width: "100%",
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  goSignInBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
