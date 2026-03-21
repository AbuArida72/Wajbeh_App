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

export default function SignInScreen({ navigation, onAuthSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const signIn = async () => {
    setError("");
    if (!email || !password) {
      setError("Please enter your email and password");
      return;
    }
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.toLowerCase().includes("email not confirmed")) {
        setError(
          "Please confirm your email first. Check your inbox for the confirmation link.",
        );
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Check email confirmed
    if (!data.user.email_confirmed_at) {
      setError(
        "Please confirm your email before signing in. Check your inbox.",
      );
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>🌿 Wajbeh</Text>
            <Text style={styles.title}>Welcome back!</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Email address</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor="#A5C8A5"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="Your password"
              placeholderTextColor="#A5C8A5"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={signIn}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Sign In →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => navigation.navigate("SignUp")}
            >
              <Text style={styles.switchText}>
                Don't have an account?{" "}
                <Text style={styles.switchLink}>Sign Up</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#F0F7F0" },
  container: { flex: 1 },
  backBtn: { padding: 20, paddingBottom: 0 },
  backText: { fontSize: 15, color: "#2E7D32", fontWeight: "600" },
  header: { padding: 24, paddingTop: 16 },
  logo: { fontSize: 24, fontWeight: "800", color: "#2E7D32", marginBottom: 16 },
  title: { fontSize: 28, fontWeight: "800", color: "#1B5E20", marginBottom: 8 },
  subtitle: { fontSize: 15, color: "#888780" },
  form: { padding: 24, paddingTop: 8, gap: 4 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1B5E20",
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: "#1B5E20",
    marginBottom: 4,
  },
  errorBox: {
    backgroundColor: "#FFEBEE",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#FFCDD2",
  },
  errorText: {
    color: "#C62828",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 16,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  switchBtn: { alignItems: "center", marginTop: 20, marginBottom: 32 },
  switchText: { fontSize: 14, color: "#888780" },
  switchLink: { color: "#2E7D32", fontWeight: "700" },
});
