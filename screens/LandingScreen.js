import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  SafeAreaView,
} from "react-native";

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <ImageBackground
        source={{
          uri: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
        }}
        style={styles.hero}
        imageStyle={styles.heroImage}
      >
        <View style={styles.heroOverlay} />
        <SafeAreaView style={styles.heroContent}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>🌿</Text>
            <Text style={styles.logoText}>Wajbeh</Text>
          </View>
          <View style={styles.heroBottom}>
            <Text style={styles.heroTitle}>
              Save food.{"\n"}Save money.{"\n"}Save Jordan.
            </Text>
            <Text style={styles.heroSub}>
              Get surplus food from the best restaurants in Amman at up to 70%
              off
            </Text>
          </View>
        </SafeAreaView>
      </ImageBackground>

      <View style={styles.bottom}>
        <TouchableOpacity
          style={styles.signUpBtn}
          onPress={() => navigation.navigate("SignUp")}
        >
          <Text style={styles.signUpBtnText}>Create Account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signInBtn}
          onPress={() => navigation.navigate("SignIn")}
        >
          <Text style={styles.signInBtnText}>Sign In</Text>
        </TouchableOpacity>

        <Text style={styles.restaurantNote}>
          Are you a restaurant?{" "}
          <Text style={styles.restaurantLink}>Contact us to join</Text>
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  hero: { flex: 1 },
  heroImage: { resizeMode: "cover" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  heroContent: {
    flex: 1,
    justifyContent: "space-between",
    padding: 24,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  logoEmoji: { fontSize: 28 },
  logoText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  heroBottom: { marginBottom: 32 },
  heroTitle: {
    fontSize: 40,
    fontWeight: "900",
    color: "#FFFFFF",
    lineHeight: 48,
    marginBottom: 16,
  },
  heroSub: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    lineHeight: 22,
  },
  bottom: {
    padding: 24,
    paddingBottom: 36,
    backgroundColor: "#FFFFFF",
    gap: 12,
  },
  signUpBtn: {
    backgroundColor: "#2E7D32",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#2E7D32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  signUpBtnText: { color: "#FFFFFF", fontSize: 16, fontWeight: "800" },
  signInBtn: {
    backgroundColor: "#F0F7F0",
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#C8E6C9",
  },
  signInBtnText: { color: "#2E7D32", fontSize: 16, fontWeight: "700" },
  restaurantNote: {
    fontSize: 13,
    color: "#888780",
    textAlign: "center",
    marginTop: 4,
  },
  restaurantLink: { color: "#2E7D32", fontWeight: "600" },
});
