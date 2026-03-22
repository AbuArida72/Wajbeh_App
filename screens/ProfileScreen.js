import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orderStats, setOrderStats] = useState({ total: 0, spent: 0 });
  const { t, language, toggleLanguage, isRTL } = useLanguage();

  useEffect(() => {
    getUser();
  }, []);

  const getUser = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
    if (user) fetchStats(user.id);
    setLoading(false);
  };

  const fetchStats = async (userId) => {
    const { data } = await supabase
      .from("orders")
      .select("amount_paid, status")
      .eq("user_id", userId);
    if (data) {
      const total = data.length;
      const spent = data.reduce(
        (s, o) => s + parseFloat(o.amount_paid || 0),
        0,
      );
      setOrderStats({ total, spent });
    }
  };

  const handleSignOut = async () => {
    const confirmed = window.confirm(t("signOutConfirm"));
    if (confirmed) await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() || "??";

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split("@")[0];

  const memberSince = new Date(user?.created_at).toLocaleDateString(
    language === "ar" ? "ar-JO" : "en-JO",
    { year: "numeric", month: "long" },
  );

  const savedMoney = (orderStats.total * 8).toFixed(2);
  const savedFood = (orderStats.total * 0.5).toFixed(1);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero header */}
      <View style={styles.hero}>
        <View style={styles.heroPattern}>
          {[...Array(6)].map((_, i) => (
            <Text
              key={i}
              style={[
                styles.patternLeaf,
                { opacity: 0.06 + i * 0.02, fontSize: 40 + i * 8 },
              ]}
            >
              🌿
            </Text>
          ))}
        </View>
        <View style={styles.heroContent}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarRing}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            </View>
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓</Text>
            </View>
          </View>
          <Text style={styles.heroName}>{displayName}</Text>
          <Text style={styles.heroEmail}>{user?.email}</Text>
          <View style={styles.memberPill}>
            <Text style={styles.memberPillText}>
              🌱 {t("memberSince")} {memberSince}
            </Text>
          </View>
        </View>
      </View>

      {/* Impact stats */}
      <View style={styles.impactSection}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>
          Your impact 🌍
        </Text>
        <View style={styles.impactGrid}>
          <View style={[styles.impactCard, styles.impactCardGreen]}>
            <Text style={styles.impactEmoji}>🛍️</Text>
            <Text style={styles.impactNum}>{orderStats.total}</Text>
            <Text style={styles.impactLabel}>{t("bagsSaved")}</Text>
          </View>
          <View style={[styles.impactCard, styles.impactCardBlue]}>
            <Text style={styles.impactEmoji}>♻️</Text>
            <Text style={styles.impactNum}>{savedFood} kg</Text>
            <Text style={styles.impactLabel}>{t("foodSaved")}</Text>
          </View>
          <View style={[styles.impactCard, styles.impactCardAmber]}>
            <Text style={styles.impactEmoji}>💰</Text>
            <Text style={styles.impactNum}>JD {savedMoney}</Text>
            <Text style={styles.impactLabel}>{t("moneySaved")}</Text>
          </View>
        </View>
      </View>

      {/* Account info */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>
          Account details
        </Text>
        <View style={styles.infoGroup}>
          <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>✉️</Text>
              <Text style={[styles.infoLabel, isRTL && styles.rtl]}>
                {t("email")}
              </Text>
            </View>
            <Text
              style={[styles.infoValue, isRTL && styles.rtl]}
              numberOfLines={1}
            >
              {user?.email}
            </Text>
          </View>

          <View style={styles.infoDivider} />

          {user?.user_metadata?.full_name && (
            <>
              <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
                <View style={styles.infoLeft}>
                  <Text style={styles.infoIcon}>👤</Text>
                  <Text style={[styles.infoLabel, isRTL && styles.rtl]}>
                    {t("name")}
                  </Text>
                </View>
                <Text style={[styles.infoValue, isRTL && styles.rtl]}>
                  {user.user_metadata.full_name}
                </Text>
              </View>
              <View style={styles.infoDivider} />
            </>
          )}

          <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>🔒</Text>
              <Text style={[styles.infoLabel, isRTL && styles.rtl]}>
                {t("status")}
              </Text>
            </View>
            <View style={styles.verifiedTag}>
              <Text style={styles.verifiedTagText}>{t("verified")}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, isRTL && styles.rtl]}>
          Preferences
        </Text>
        <View style={styles.infoGroup}>
          <TouchableOpacity
            style={[styles.infoRow, isRTL && styles.rtlRow]}
            onPress={toggleLanguage}
            activeOpacity={0.7}
          >
            <View style={styles.infoLeft}>
              <Text style={styles.infoIcon}>🌐</Text>
              <Text style={[styles.infoLabel, isRTL && styles.rtl]}>
                Language
              </Text>
            </View>
            <View style={styles.langTag}>
              <Text style={styles.langTagText}>
                {language === "en" ? "🇬🇧 English" : "🇯🇴 العربية"}
              </Text>
              <Text style={styles.langTagArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Sign out */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={handleSignOut}
          activeOpacity={0.88}
        >
          <Text style={styles.signOutIcon}>🚪</Text>
          <Text style={styles.signOutText}>{t("signOut")}</Text>
        </TouchableOpacity>
      </View>

      {/* App info */}
      <View style={styles.appInfo}>
        <Text style={styles.appInfoText}>🌿 Wajbeh وجبة · v1.0.0</Text>
        <Text style={styles.appInfoSub}>Fighting food waste in Jordan 🇯🇴</Text>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  // Hero
  hero: {
    backgroundColor: "#2E7D32",
    paddingBottom: 32,
    overflow: "hidden",
  },
  heroPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-around",
    alignItems: "center",
  },
  patternLeaf: { position: "absolute" },
  heroContent: { alignItems: "center", paddingTop: 32, paddingBottom: 8 },
  avatarWrapper: { position: "relative", marginBottom: 14 },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  avatarCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { fontSize: 30, fontWeight: "800", color: "#FFFFFF" },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  verifiedBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  heroName: {
    fontSize: 22,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  heroEmail: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    marginBottom: 12,
  },
  memberPill: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  memberPillText: { color: "#A5D6A7", fontSize: 12, fontWeight: "600" },

  // Impact
  impactSection: { padding: 16, paddingBottom: 4 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888780",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  impactGrid: { flexDirection: "row", gap: 10 },
  impactCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  impactCardGreen: {
    backgroundColor: "#E8F5E9",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  impactCardBlue: {
    backgroundColor: "#E3F2FD",
    borderWidth: 1,
    borderColor: "#BBDEFB",
  },
  impactCardAmber: {
    backgroundColor: "#FFF8E1",
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  impactEmoji: { fontSize: 24, marginBottom: 6 },
  impactNum: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 2,
  },
  impactLabel: {
    fontSize: 10,
    color: "#888780",
    textAlign: "center",
    fontWeight: "500",
  },

  // Sections
  section: { paddingHorizontal: 16, paddingBottom: 4, marginTop: 12 },
  infoGroup: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    overflow: "hidden",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  infoLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  infoIcon: { fontSize: 18 },
  infoLabel: { fontSize: 14, color: "#5F5E5A", fontWeight: "500" },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1B5E20",
    maxWidth: "55%",
    textAlign: "right",
  },
  infoDivider: { height: 1, backgroundColor: "#F0F7F0", marginHorizontal: 16 },
  verifiedTag: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  verifiedTagText: { fontSize: 12, color: "#2E7D32", fontWeight: "700" },
  langTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  langTagText: { fontSize: 14, color: "#1B5E20", fontWeight: "600" },
  langTagArrow: { fontSize: 18, color: "#B4B2A9", fontWeight: "300" },

  // Sign out
  signOutBtn: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1.5,
    borderColor: "#FFCDD2",
  },
  signOutIcon: { fontSize: 18 },
  signOutText: { fontSize: 15, fontWeight: "700", color: "#C62828" },

  // App info
  appInfo: { alignItems: "center", paddingTop: 20, paddingBottom: 8 },
  appInfoText: {
    fontSize: 13,
    color: "#B4B2A9",
    fontWeight: "500",
    marginBottom: 4,
  },
  appInfoSub: { fontSize: 12, color: "#C8E6C9" },
});
