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

export default function SignUpScreen({ navigation, onAuthSuccess }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const signUp = async () => {
    setError("");
    if (!fullName || !email || !password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
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

    // Create profile
    if (data?.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        is_restaurant: false,
      });
    }

    setLoading(false);
    setDone(true);
  };

  if (done) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.doneContainer}>
          <Text style={styles.doneEmoji}>📧</Text>
          <Text style={styles.doneTitle}>Check your email!</Text>
          <Text style={styles.doneSubtitle}>
            We sent a confirmation link to{"\n"}
            <Text style={styles.doneEmail}>{email}</Text>
          </Text>
          <Text style={styles.doneNote}>
            Click the link in the email to confirm your account, then come back
            and sign in.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => navigation.navigate("SignIn")}
          >
            <Text style={styles.signInBtnText}>Go to Sign In →</Text>
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.logo}>🌿 Wajbeh</Text>
            <Text style={styles.title}>Create account</Text>
            <Text style={styles.subtitle}>
              Join thousands saving food in Amman
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Full name</Text>
            <TextInput
              style={styles.input}
              placeholder="Your full name"
              placeholderTextColor="#A5C8A5"
              value={fullName}
              onChangeText={setFullName}
            />

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
              placeholder="At least 6 characters"
              placeholderTextColor="#A5C8A5"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Text style={styles.label}>Confirm password</Text>
            <TextInput
              style={styles.input}
              placeholder="Repeat your password"
              placeholderTextColor="#A5C8A5"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.btn, loading && styles.btnDisabled]}
              onPress={signUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>Create Account →</Text>
              )}
            </TouchableOpacity>

            <View style={styles.noteBox}>
              <Text style={styles.noteText}>
                🏪 Are you a restaurant owner? Contact us at{" "}
                <Text style={styles.noteLink}>hello@wajbeh.jo</Text> to get your
                restaurant listed.
              </Text>
            </View>

            <TouchableOpacity
              style={styles.switchBtn}
              onPress={() => navigation.navigate("SignIn")}
            >
              <Text style={styles.switchText}>
                Already have an account?{" "}
                <Text style={styles.switchLink}>Sign In</Text>
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
  errorText: {
    color: "#C62828",
    fontSize: 13,
    marginVertical: 8,
    textAlign: "center",
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
  noteBox: {
    backgroundColor: "#E8F5E9",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  noteText: { fontSize: 13, color: "#5F5E5A", lineHeight: 20 },
  noteLink: { color: "#2E7D32", fontWeight: "600" },
  switchBtn: { alignItems: "center", marginTop: 20, marginBottom: 32 },
  switchText: { fontSize: 14, color: "#888780" },
  switchLink: { color: "#2E7D32", fontWeight: "700" },
  doneContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: "#F0F7F0",
  },
  doneEmoji: { fontSize: 64, marginBottom: 24 },
  doneTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 15,
    color: "#5F5E5A",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  doneEmail: { fontWeight: "700", color: "#2E7D32" },
  doneNote: {
    fontSize: 13,
    color: "#888780",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  signInBtn: {
    backgroundColor: "#2E7D32",
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signInBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
});
