import { View, Text, StyleSheet } from "react-native";

export default function MapScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Map not available on web</Text>
      <Text style={styles.sub}>
        Use the mobile app to set your restaurant location.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    padding: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 8,
    textAlign: "center",
  },
  sub: { fontSize: 13, color: "#888888", textAlign: "center" },
});
