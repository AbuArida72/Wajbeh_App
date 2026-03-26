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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function SignInScreen({ navigation, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
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
        setError(t("emailNotConfirmed"));
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }
    if (!data.user.email_confirmed_at) {
      setError(t("confirmEmailFirst"));
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
          {/* Top row */}
          <View style={styles.topRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={20} color="#0F0F0F" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
              <Text style={styles.langBtnText}>
                {language === "en" ? t("switchToArabic") : t("switchToEnglish")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Brand + heading */}
          <View style={styles.headingSection}>
            <Text style={styles.brandText}>Wajbeh</Text>
            <Text style={[styles.heading, isRTL && styles.rtl]}>{t("signInTitle")}</Text>
            <Text style={[styles.subHeading, isRTL && styles.rtl]}>
              {t("signInSubtitle")}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("emailAddress")}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#B8B8B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("emailPlaceholder")}
                  placeholderTextColor="#B8B8B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("password")}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color="#B8B8B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("passwordPlaceholder")}
                  placeholderTextColor="#B8B8B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View style={styles.errorBox}>
                <Ionicons name="warning-outline" size={16} color="#ED4956" />
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
              <Text style={styles.dividerText}>{t("orDivider")}</Text>
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
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeText}>{t("secureBadge")}</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeText}>{t("ecoFriendlyBadge")}</Text>
            </View>
            <View style={styles.trustBadge}>
              <Text style={styles.trustBadgeText}>{t("localBadge")}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20 },
  rtl: { textAlign: "right", writingDirection: "rtl" },

  // Top row
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  langBtn: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  langBtnText: { color: "#737373", fontWeight: "600", fontSize: 13 },

  // Heading
  headingSection: { marginBottom: 32, alignItems: "center" },
  brandText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  heading: { fontSize: 28, fontWeight: "700", color: "#0F0F0F", marginBottom: 8, textAlign: "center" },
  subHeading: { fontSize: 14, color: "#737373", lineHeight: 20, textAlign: "center" },

  // Form
  form: {
    backgroundColor: "#FFFFFF",
    marginBottom: 32,
  },
  fieldGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0F0F0F",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#DBDBDB",
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputIcon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
    color: "#0F0F0F",
  },
  inputRTL: { textAlign: "right" },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#ED4956",
  },
  errorText: { color: "#ED4956", fontSize: 13, flex: 1, lineHeight: 18 },
  btn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 20,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#DBDBDB" },
  dividerText: { fontSize: 12, color: "#B8B8B8" },
  signUpLink: { alignItems: "center" },
  signUpLinkText: { fontSize: 14, color: "#737373" },
  signUpLinkHighlight: { color: "#2E7D32", fontWeight: "600" },

  // Trust badges
  trustRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  trustBadge: {
    backgroundColor: "#FAFAFA",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  trustBadgeText: { fontSize: 12, color: "#737373", fontWeight: "500" },
});
