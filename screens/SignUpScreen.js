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
      setError(t("fillAllFields")); haptic.error(); return;
    }
    if (password !== confirmPassword) {
      setError(t("passwordsMismatch")); haptic.error(); return;
    }
    if (password.length < 6) {
      setError(t("passwordTooShort")); haptic.error(); return;
    }
    haptic.light();
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
    haptic.success();
    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <View style={styles.root}>
        <WallpaperBackground />

        <SafeAreaView style={styles.safe}>
          <View style={styles.doneContainer}>
            <GlassPanel radius={50} style={styles.doneIconCircle}>
              <Ionicons name="mail-outline" size={36} color={T.green} />
            </GlassPanel>
            <Text style={styles.doneTitle}>{t("checkYourEmail")}</Text>
            <Text style={[styles.doneSubtitle, isRTL && styles.rtl]}>{t("weSentLink")}</Text>
            <Text style={styles.doneEmail}>{email}</Text>

            <GlassPanel radius={18} style={{ width: "100%", marginBottom: 28, overflow: "hidden" }}>
              {[t("openEmail"), t("clickLink"), t("comeBackSignIn")].map((step, i) => (
                <View key={i} style={[styles.doneStep, i < 2 && styles.doneStepBorder, isRTL && styles.rtlRow]}>
                  <View style={styles.doneStepBadge}>
                    <Text style={styles.doneStepNum}>{i + 1}</Text>
                  </View>
                  <Text style={[styles.doneStepText, isRTL && styles.rtl]}>{step}</Text>
                </View>
              ))}
            </GlassPanel>

            <GlassButton primary onPress={() => navigation.navigate("SignIn")} style={{ width: "100%" }}>
              {t("goToSignIn")}
            </GlassButton>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <WallpaperBackground />

      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

            {/* Top row */}
            <View style={[styles.topRow, isRTL && styles.rtlRow]}>
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
              <Text style={[styles.heading, ar(isRTL, "bold")]}>{t("createAccount")}</Text>
              <Text style={styles.subHeading}>{t("joinUs")}</Text>
            </View>

            {/* Glass form card */}
            <GlassPanel radius={20} style={{ marginBottom: 16, overflow: "hidden" }}>
              {/* Full name */}
              <View style={[styles.field, styles.fieldBorder, isRTL && styles.rtlRow]}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons name="person-outline" size={16} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("fullName")}</Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.rtl]}
                    placeholder={t("yourFullName")}
                    placeholderTextColor={T.muteStrong}
                    autoCapitalize="words"
                    value={fullName}
                    onChangeText={setFullName}
                  />
                </View>
              </View>
              {/* Email */}
              <View style={[styles.field, styles.fieldBorder, isRTL && styles.rtlRow]}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons name="mail-outline" size={16} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("emailAddress")}</Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.rtl]}
                    placeholder="you@email.com"
                    placeholderTextColor={T.muteStrong}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>
              {/* Password */}
              <View style={[styles.field, styles.fieldBorder, isRTL && styles.rtlRow]}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons name="lock-closed-outline" size={16} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("password")}</Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.rtl]}
                    placeholder={t("atLeast6Chars")}
                    placeholderTextColor={T.muteStrong}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                  />
                </View>
              </View>
              {/* Confirm password */}
              <View style={[styles.field, isRTL && styles.rtlRow]}>
                <View style={styles.fieldIconWrap}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={T.green} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, isRTL && styles.rtl]}>{t("confirmPassword")}</Text>
                  <TextInput
                    style={[styles.fieldInput, isRTL && styles.rtl]}
                    placeholder={t("repeatPassword")}
                    placeholderTextColor={T.muteStrong}
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                  />
                </View>
              </View>
            </GlassPanel>

            {error ? (
              <View style={[styles.errorBox, isRTL && styles.rtlRow]}>
                <Ionicons name="warning-outline" size={14} color={T.urgent} />
                <Text style={[styles.errorText, isRTL && styles.rtl]}>{error}</Text>
              </View>
            ) : null}

            <GlassButton primary onPress={signUp} loading={loading} disabled={loading}>
              {t("createAccountBtn")}
            </GlassButton>

            <TouchableOpacity onPress={() => navigation.navigate("SignIn")} style={{ alignItems: "center", marginTop: 22 }}>
              <Text style={[styles.signInText, isRTL && styles.rtl]}>
                {t("hasAccount")}{" "}
                <Text style={styles.signInLink}>{t("signIn")}</Text>
              </Text>
            </TouchableOpacity>

            {/* Restaurant note */}
            <GlassPanel radius={14} padding={14} style={{ marginTop: 28 }}>
              <View style={[styles.restaurantNoteRow, isRTL && styles.rtlRow]}>
                <View style={styles.noteIconWrap}>
                  <Ionicons name="storefront-outline" size={16} color={T.accent} />
                </View>
                <Text style={[styles.restaurantNoteText, isRTL && styles.rtl]}>{t("restaurantNote")}</Text>
              </View>
            </GlassPanel>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  scroll: { flexGrow: 1, padding: 22, paddingBottom: 32 },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.72)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.90)",
    alignItems: "center", justifyContent: "center",
  },

  // Centered heading
  headingSection: { alignItems: "center", marginBottom: 28 },
  brandBadge: {
    backgroundColor: "rgba(61,107,71,0.10)",
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(61,107,71,0.18)",
    marginBottom: 18,
  },
  brandText: { fontSize: 11, fontWeight: "800", color: T.green, letterSpacing: 1.2, textTransform: "uppercase" },
  heading: { fontSize: 32, fontWeight: "800", color: T.ink, letterSpacing: -1.2, textAlign: "center", marginBottom: 8 },
  subHeading: { fontSize: 13, color: T.mute, textAlign: "center" },

  // Fields
  field: { flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 13, gap: 12 },
  fieldBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(26,34,24,0.08)" },
  fieldIconWrap: {
    width: 34, height: 34, borderRadius: 10,
    backgroundColor: "rgba(61,107,71,0.10)",
    borderWidth: 1, borderColor: "rgba(61,107,71,0.15)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  fieldLabel: { fontSize: 9, fontWeight: "700", color: T.green, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 3 },
  fieldInput: { fontSize: 15, color: T.ink },

  errorBox: {
    flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 14,
    backgroundColor: "rgba(224,92,74,0.08)", borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: "rgba(224,92,74,0.22)",
  },
  errorText: { color: T.urgent, fontSize: 13, flex: 1 },

  signInText: { fontSize: 13, color: T.mute, textAlign: "center" },
  signInLink: { color: T.accent, fontWeight: "700" },

  restaurantNoteRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  noteIconWrap: {
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: "rgba(232,153,58,0.12)",
    borderWidth: 1, borderColor: "rgba(232,153,58,0.20)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  restaurantNoteText: { fontSize: 13, color: T.mute, lineHeight: 20 },

  // Done screen
  doneContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 28 },
  doneIconCircle: { width: 88, height: 88, alignItems: "center", justifyContent: "center", marginBottom: 24 },
  doneTitle: { fontSize: 26, fontWeight: "800", color: T.ink, letterSpacing: -0.8, marginBottom: 8, textAlign: "center" },
  doneSubtitle: { fontSize: 13, color: T.mute, marginBottom: 6, textAlign: "center" },
  doneEmail: { fontSize: 14, fontWeight: "700", color: T.green, marginBottom: 28, textAlign: "center" },
  doneStep: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  doneStepBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(26,34,24,0.07)" },
  doneStepBadge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(61,107,71,0.12)",
    borderWidth: 1, borderColor: "rgba(61,107,71,0.22)",
    alignItems: "center", justifyContent: "center", flexShrink: 0,
  },
  doneStepNum: { fontSize: 12, fontWeight: "700", color: T.green },
  doneStepText: { fontSize: 13, color: T.ink, flex: 1, lineHeight: 19 },
});
