import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { GlassPanel, GlassButton, Chip, T, WallpaperBackground, TextBackdrop, ar } from "../components/Glass";
import { haptic } from "../lib/haptics";

export default function SignInScreen({ navigation, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { t, isRTL, language, toggleLanguage } = useLanguage();

  const signIn = async () => {
    setError("");
    if (!email || !password) { setError(t("fillAllFields")); haptic.error(); return; }
    haptic.light();
    setLoading(true);
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) {
      setError(err.message.toLowerCase().includes("email not confirmed") ? t("emailNotConfirmed") : err.message);
      setLoading(false);
      return;
    }
    if (!data.user.email_confirmed_at) {
      setError(t("confirmEmailFirst"));
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }
    haptic.success();
    onAuthSuccess(data.user);
    setLoading(false);
  };

  return (
    <View style={styles.root}>


      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* Nav row */}
            <View style={[styles.navRow, isRTL && styles.rtlRow]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color={T.ink} />
              </TouchableOpacity>
              <Chip onPress={toggleLanguage}>
                {language === "en" ? "العربية" : "English"}
              </Chip>
            </View>

            {/* Heading — centered */}
            <View style={styles.headingSection}>
              <View style={styles.brandBadge}>
                <Text style={[styles.brandText, ar(isRTL, "bold")]}>{t("appName")}</Text>
              </View>
              <Text style={[styles.heading, ar(isRTL, "bold")]}>{t("welcomeBack") || "Welcome back"}</Text>
              <Text style={styles.subHeading}>{t("signInSubtitle") || "Sign in to your account"}</Text>
            </View>

            {/* Glass form card */}
            <GlassPanel radius={22} style={{ marginBottom: 14, overflow: "hidden" }}>
              {/* Email field */}
              <View style={[styles.field, styles.fieldBorder, isRTL && styles.rtlRow]}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons name="mail-outline" size={16} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("emailAddress") || "Email"}</Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.rtl]}
                    placeholder={t("emailPlaceholder") || "you@email.com"}
                    placeholderTextColor={T.muteStrong}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
              {/* Password field */}
              <View style={[styles.field, isRTL && styles.rtlRow]}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons name="lock-closed-outline" size={16} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("password") || "Password"}</Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.rtl]}
                    placeholder={t("passwordPlaceholder") || "Your password"}
                    placeholderTextColor={T.muteStrong}
                    secureTextEntry={!showPw}
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <Ionicons name={showPw ? "eye-off-outline" : "eye-outline"} size={16} color={T.muteStrong} />
                </TouchableOpacity>
              </View>
            </GlassPanel>

            {/* Error */}
            {!!error && (
              <View style={[styles.errorBox, isRTL && styles.rtlRow]}>
                <Ionicons name="warning-outline" size={14} color={T.urgent} />
                <Text style={[styles.errorText, isRTL && styles.rtl]}>{error}</Text>
              </View>
            )}

            <GlassButton primary onPress={signIn} loading={loading} disabled={loading}>
              {t("signIn") || "Sign in"}
            </GlassButton>

            {/* Divider */}
            <View style={styles.dividerRow}>
              <View style={styles.divLine} />
              <Text style={styles.divText}>{t("orDivider") || "or"}</Text>
              <View style={styles.divLine} />
            </View>

            <TouchableOpacity onPress={() => navigation.navigate("SignUp")} style={{ alignItems: "center" }}>
              <Text style={[styles.signUpText, isRTL && styles.rtl]}>
                {t("noAccount") || "Don't have an account?"}{" "}
                <Text style={styles.signUpLink}>{t("signUp") || "Sign up"}</Text>
              </Text>
            </TouchableOpacity>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 16 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  navRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 36 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#FFFFFF",
    borderWidth: 1, borderColor: "rgba(26,26,26,0.12)",
    alignItems: "center", justifyContent: "center",
  },

  // Centered heading
  headingSection: { alignItems: "center", marginBottom: 32 },
  brandBadge: {
    backgroundColor: "rgba(21,128,61,0.08)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(21,128,61,0.15)",
    marginBottom: 18,
  },
  brandText: { fontSize: 11, fontWeight: "800", color: T.green, letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { fontSize: 34, fontWeight: "800", color: T.ink, letterSpacing: -1.2, marginBottom: 8, textAlign: "center" },
  subHeading: { fontSize: 14, color: T.mute, textAlign: "center" },

  // Fields
  field: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 14, gap: 12 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(15,23,42,0.06)" },
  fieldIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(21,128,61,0.08)",
    borderWidth: 1, borderColor: "rgba(21,128,61,0.12)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  fieldLabel: { fontSize: 9, fontWeight: "700", color: T.green, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  fieldInput: { fontSize: 15, color: T.ink, paddingVertical: 0 },
  eyeBtn: { padding: 6, marginLeft: 4 },

  errorBox: {
    flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 14,
    backgroundColor: "rgba(224,92,74,0.08)", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "rgba(224,92,74,0.22)",
  },
  errorText: { color: T.urgent, fontSize: 13, flex: 1 },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 22 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(15,23,42,0.08)" },
  divText: { fontSize: 11, color: T.muteStrong, fontWeight: "600" },

  signUpText: { fontSize: 14, color: T.mute, textAlign: "center" },
  signUpLink: { color: T.green, fontWeight: "700" },
});
