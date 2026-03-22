import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.emoji}>🗺️</Text>
        <Text style={styles.title}>Set Restaurant Location</Text>
        <Text style={styles.subtitle}>
          This feature lets you pin your restaurant's exact location on the map
          so customers can find you easily.
        </Text>

        <View style={styles.divider} />

        <Text style={styles.mobileTitle}>📱 Mobile Only Feature</Text>
        <Text style={styles.mobileText}>
          This feature requires the mobile app to access GPS and map services.
          It is not available in the web browser.
        </Text>

        <View style={styles.stepsCard}>
          <Text style={styles.stepsTitle}>How it will work on mobile:</Text>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>1</Text>
            <Text style={styles.stepText}>Open the app on your phone</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>2</Text>
            <Text style={styles.stepText}>Go to Location tab</Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>3</Text>
            <Text style={styles.stepText}>
              Tap your restaurant's location on the map
            </Text>
          </View>
          <View style={styles.step}>
            <Text style={styles.stepNumber}>4</Text>
            <Text style={styles.stepText}>
              Customers nearby will see your restaurant first
            </Text>
          </View>
        </View>

        <View style={styles.comingSoonBadge}>
          <Text style={styles.comingSoonText}>
            🚀 Coming when deployed to mobile
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F7F0",
    padding: 20,
    justifyContent: "center",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  emoji: { fontSize: 56, marginBottom: 16 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#5F5E5A",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "#E8F5E9",
    marginBottom: 20,
  },
  mobileTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 8,
    textAlign: "center",
  },
  mobileText: {
    fontSize: 13,
    color: "#888780",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  stepsCard: {
    width: "100%",
    backgroundColor: "#F0F7F0",
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  stepsTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 12,
  },
  step: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#2E7D32",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 24,
    fontSize: 12,
    fontWeight: "800",
  },
  stepText: { fontSize: 13, color: "#5F5E5A", flex: 1 },
  comingSoonBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  comingSoonText: { fontSize: 13, color: "#2E7D32", fontWeight: "600" },
});
