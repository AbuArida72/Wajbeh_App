import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../lib/supabase";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    setLoading(false);
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm("Are you sure you want to sign out?");
    if (confirmed) {
      await supabase.auth.signOut();
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const displayName = user?.user_metadata?.full_name || user?.email;

  const memberSince = new Date(user?.created_at).toLocaleDateString("en-JO", {
    year: "numeric",
    month: "long",
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <Text style={styles.memberSince}>Member since {memberSince}</Text>
      </View>

      {/* Info */}
      <View style={styles.section}>
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Email</Text>
          <Text style={styles.infoValue}>{user?.email}</Text>
        </View>
        {user?.user_metadata?.full_name && (
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{user.user_metadata.full_name}</Text>
          </View>
        )}
        <View style={styles.infoCard}>
          <Text style={styles.infoLabel}>Status</Text>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>✅ Verified</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>🛍️</Text>
          <Text style={styles.statValue}>0</Text>
          <Text style={styles.statLabel}>Bags saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💚</Text>
          <Text style={styles.statValue}>0 kg</Text>
          <Text style={styles.statLabel}>Food saved</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statEmoji}>💰</Text>
          <Text style={styles.statValue}>JD 0</Text>
          <Text style={styles.statLabel}>Money saved</Text>
        </View>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
        <Text style={styles.signOutText}>🚪 Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    backgroundColor: "#2E7D32",
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderWidth: 3,
    borderColor: "rgba(255,255,255,0.5)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#FFFFFF" },
  name: { fontSize: 18, fontWeight: "800", color: "#FFFFFF", marginBottom: 4 },
  email: { fontSize: 14, color: "#A5D6A7", marginBottom: 4 },
  memberSince: { fontSize: 12, color: "#A5D6A7" },
  section: { padding: 16, gap: 10 },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
  },
  infoLabel: { fontSize: 13, color: "#888780" },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B5E20",
    maxWidth: "60%",
    textAlign: "right",
  },
  statusBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: { fontSize: 12, color: "#2E7D32", fontWeight: "600" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
    gap: 4,
  },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: 16, fontWeight: "800", color: "#1B5E20" },
  statLabel: { fontSize: 11, color: "#888780", textAlign: "center" },
  signOutBtn: {
    marginHorizontal: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
  },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#C62828" },
});
