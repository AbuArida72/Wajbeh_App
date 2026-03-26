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

export default function SignUpScreen({ navigation, onAuthSuccess }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
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
            <Ionicons name="mail-outline" size={36} color="#2E7D32" />
          </View>
          <Text style={styles.doneTitle}>{t("checkYourEmail")}</Text>
          <Text style={[styles.doneSubtitle, isRTL && styles.rtl]}>
            {t("weSentLink")}
          </Text>
          <Text style={styles.doneEmail}>{email}</Text>
          <View style={styles.doneSteps}>
            {[t("openEmail"), t("clickLink"), t("comeBackSignIn")].map((step, i) => (
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
            <Text style={styles.goSignInBtnText}>{t("goToSignIn")}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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

          {/* Heading */}
          <View style={styles.headingSection}>
            <Text style={styles.brandText}>Wajbeh</Text>
            <Text style={[styles.heading, isRTL && styles.rtl]}>
              {t("createAccount")}
            </Text>
            <Text style={[styles.subHeading, isRTL && styles.rtl]}>
              {t("joinUs")}
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Full name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("fullName")}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={16} color="#B8B8B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("yourFullName")}
                  placeholderTextColor="#B8B8B8"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("emailAddress")}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={16} color="#B8B8B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder="you@email.com"
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
                  placeholder={t("atLeast6Chars")}
                  placeholderTextColor="#B8B8B8"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Confirm password */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.label, isRTL && styles.rtl]}>
                {t("confirmPassword")}
              </Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={16} color="#B8B8B8" style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, isRTL && styles.inputRTL]}
                  placeholder={t("repeatPassword")}
                  placeholderTextColor="#B8B8B8"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
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
            <Ionicons name="storefront-outline" size={18} color="#737373" />
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
  safe: { flex: 1, backgroundColor: "#FFFFFF" },
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 20, paddingBottom: 32 },
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
  headingSection: { marginBottom: 28, alignItems: "center" },
  brandText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#2E7D32",
    marginBottom: 12,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    textAlign: "center",
  },
  heading: { fontSize: 26, fontWeight: "700", color: "#0F0F0F", marginBottom: 8, textAlign: "center" },
  subHeading: { fontSize: 14, color: "#737373", lineHeight: 20, textAlign: "center" },

  // Form
  form: { marginBottom: 24 },
  fieldGroup: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "500", color: "#0F0F0F", marginBottom: 8 },
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
  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#0F0F0F" },
  inputRTL: { textAlign: "right" },

  // Error
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

  // Button
  btn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
  signInLink: { alignItems: "center" },
  signInLinkText: { fontSize: 14, color: "#737373" },
  signInLinkHighlight: { color: "#2E7D32", fontWeight: "600" },

  // Restaurant note
  restaurantNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  restaurantNoteText: {
    fontSize: 13,
    color: "#737373",
    flex: 1,
    lineHeight: 20,
  },

  // Done screen
  doneContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#FFFFFF",
  },
  doneIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#F2F8F2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },
  doneTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F0F0F",
    marginBottom: 8,
  },
  doneSubtitle: { fontSize: 14, color: "#737373", marginBottom: 4 },
  doneEmail: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0F0F0F",
    marginBottom: 28,
  },
  doneSteps: { width: "100%", marginBottom: 28, gap: 10 },
  doneStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
  },
  doneStepNum: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  doneStepNumText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  doneStepText: { fontSize: 14, color: "#737373", fontWeight: "400", flex: 1 },
  goSignInBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
  },
  goSignInBtnText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
