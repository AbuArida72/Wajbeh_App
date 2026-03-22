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

export default function SignInScreen({ navigation, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState(null);
  const { t, isRTL, language, toggleLanguage } = useLanguage();

  const signIn = async () => {
    setError("");
    if (!email || !password) {
      setError(t("fillAllFields"));
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError("Please confirm your email first. Check your inbox.");
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }
    if (!data.user.email_confirmed_at) {
      setError("Please confirm your email before signing in.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    onAuthSuccess(data.user);
    setLoading(false);
  };

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
          {/* Header banner */}
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
              <Text style={styles.bannerEmoji}>🌿</Text>
              <Text style={styles.bannerTitle}>{t("welcomeBack")}</Text>
              <Text style={styles.bannerSubtitle}>{t("signInSubtitle")}</Text>
            </View>

            {/* Wave shape */}
            <View style={styles.wave} />
          </View>

          {/* Form card */}
          <View style={styles.formCard}>
            {/* Email */}
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

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("password")}
              </Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === "password" && styles.inputWrapperFocused,
                ]}
              >
                <Text style={styles.inputIcon}>🔒</Text>
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={isRTL ? "كلمة المرور" : "Your password"}
                  placeholderTextColor="#B4D4B4"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField("password")}
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

            {/* Sign in button */}
            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={signIn}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>{t("signIn")}</Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Sign up link */}
            <TouchableOpacity
              style={styles.signUpLink}
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={[styles.signUpLinkText, isRTL && styles.rtl]}>
                {t("noAccount")}{" "}
                <Text style={styles.signUpLinkHighlight}>{t("signUp")}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Trust badges */}
          <View style={styles.trustRow}>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🔒</Text>
              <Text style={styles.trustText}>Secure</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>🌿</Text>
              <Text style={styles.trustText}>Eco-friendly</Text>
            </View>
            <View style={styles.trustItem}>
              <Text style={styles.trustIcon}>💚</Text>
              <Text style={styles.trustText}>Local</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F7F0" },
  container: { flex: 1 },
  scroll: { flexGrow: 1 },

  // Banner
  banner: {
    backgroundColor: "#2E7D32",
    paddingBottom: 48,
    position: "relative",
  },
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
  bannerContent: { alignItems: "center", paddingVertical: 20 },
  bannerEmoji: { fontSize: 48, marginBottom: 12 },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  bannerSubtitle: { fontSize: 15, color: "rgba(255,255,255,0.75)" },
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
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 8,
  },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FDF8",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    borderRadius: 14,
    paddingHorizontal: 14,
    overflow: "hidden",
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
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1B5E20",
  },
  inputRTL: { textAlign: "right" },
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
  btn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E8F5E9" },
  dividerText: { fontSize: 12, color: "#B4B2A9" },
  signUpLink: { alignItems: "center" },
  signUpLinkText: { fontSize: 14, color: "#888780" },
  signUpLinkHighlight: { color: "#2E7D32", fontWeight: "800" },

  // Trust badges
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingVertical: 24,
  },
  trustItem: { alignItems: "center", gap: 4 },
  trustIcon: { fontSize: 22 },
  trustText: { fontSize: 11, color: "#B4B2A9", fontWeight: "500" },
});
