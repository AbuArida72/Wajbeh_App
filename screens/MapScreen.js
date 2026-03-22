import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

export default function MapScreen() {
  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero banner */}
      <View style={styles.hero}>
        <View style={styles.heroPattern}>
          {["📍", "🗺️", "📌", "🧭", "📡"].map((e, i) => (
            <Text
              key={i}
              style={[
                styles.patternItem,
                {
                  opacity: 0.08 + i * 0.03,
                  fontSize: 32 + i * 8,
                  top: `${10 + i * 15}%`,
                  left: i % 2 === 0 ? `${5 + i * 10}%` : undefined,
                  right: i % 2 !== 0 ? `${5 + i * 8}%` : undefined,
                },
              ]}
            >
              {e}
            </Text>
          ))}
        </View>
        <View style={styles.heroContent}>
          <View style={styles.heroIconCircle}>
            <Text style={styles.heroIcon}>🗺️</Text>
          </View>
          <Text style={styles.heroTitle}>Restaurant Location</Text>
          <Text style={styles.heroSubtitle}>
            Help customers find you on the map
          </Text>
        </View>
        <View style={styles.wave} />
      </View>

      <View style={styles.content}>
        {/* Mobile only banner */}
        <View style={styles.mobileBanner}>
          <View style={styles.mobileBannerLeft}>
            <Text style={styles.mobileBannerIcon}>📱</Text>
            <View>
              <Text style={styles.mobileBannerTitle}>Mobile Only Feature</Text>
              <Text style={styles.mobileBannerSub}>
                Not available in web browser
              </Text>
            </View>
          </View>
          <View style={styles.mobileBannerBadge}>
            <Text style={styles.mobileBannerBadgeText}>Coming soon</Text>
          </View>
        </View>

        {/* What this does */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What this feature does</Text>
          <View style={styles.featureCard}>
            {[
              {
                icon: "📍",
                title: "Pin your location",
                desc: "Tap exactly where your restaurant is on the map of Amman",
              },
              {
                icon: "👥",
                title: "Reach nearby customers",
                desc: "Customers searching near your area will see your bags first",
              },
              {
                icon: "🧭",
                title: "Get directions",
                desc: "Customers can get turn-by-turn directions to your restaurant",
              },
            ].map((item, i, arr) => (
              <View key={i}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconBox}>
                    <Text style={styles.featureItemIcon}>{item.icon}</Text>
                  </View>
                  <View style={styles.featureItemRight}>
                    <Text style={styles.featureItemTitle}>{item.title}</Text>
                    <Text style={styles.featureItemDesc}>{item.desc}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <View style={styles.featureDivider} />}
              </View>
            ))}
          </View>
        </View>

        {/* How it will work */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How it will work on mobile</Text>
          {[
            {
              step: "1",
              text: "Download Wajbeh on your iPhone or Android",
              icon: "📲",
            },
            {
              step: "2",
              text: "Sign in with your restaurant account",
              icon: "🔐",
            },
            { step: "3", text: "Go to the Location tab", icon: "🗺️" },
            {
              step: "4",
              text: "Tap your restaurant's location on the map",
              icon: "📍",
            },
            {
              step: "5",
              text: "Save — customers nearby will find you!",
              icon: "✅",
            },
          ].map((item, i) => (
            <View key={i} style={styles.stepItem}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>{item.step}</Text>
              </View>
              <Text style={styles.stepIcon}>{item.icon}</Text>
              <Text style={styles.stepText}>{item.text}</Text>
            </View>
          ))}
        </View>

        {/* Why it matters */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Why location matters</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>📈</Text>
              <Text style={styles.statNum}>3x</Text>
              <Text style={styles.statLabel}>
                More visibility with location pinned
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statNum}>Local</Text>
              <Text style={styles.statLabel}>
                Only show to nearby customers
              </Text>
            </View>
          </View>
        </View>

        {/* CTA */}
        <View style={styles.ctaCard}>
          <Text style={styles.ctaEmoji}>🚀</Text>
          <Text style={styles.ctaTitle}>Coming with the mobile app</Text>
          <Text style={styles.ctaText}>
            We're working on deploying Wajbeh to the App Store and Google Play.
            Location features will be fully available then.
          </Text>
          <View style={styles.ctaBadgeRow}>
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaBadgeText}>🍎 App Store</Text>
            </View>
            <View style={styles.ctaBadge}>
              <Text style={styles.ctaBadgeText}>🤖 Google Play</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 32 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F7F0" },

  // Hero
  hero: {
    backgroundColor: "#2E7D32",
    paddingBottom: 48,
    overflow: "hidden",
  },
  heroPattern: {
    ...StyleSheet.absoluteFillObject,
  },
  patternItem: { position: "absolute" },
  heroContent: {
    alignItems: "center",
    paddingTop: 36,
    paddingBottom: 12,
  },
  heroIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.25)",
  },
  heroIcon: { fontSize: 38 },
  heroTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 6,
  },
  heroSubtitle: { fontSize: 14, color: "#A5D6A7", textAlign: "center" },
  wave: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    backgroundColor: "#F0F7F0",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
  },

  content: { padding: 20 },

  // Mobile banner
  mobileBanner: {
    backgroundColor: "#FFF3E0",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#FFE082",
  },
  mobileBannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  mobileBannerIcon: { fontSize: 28 },
  mobileBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#E65100",
    marginBottom: 2,
  },
  mobileBannerSub: { fontSize: 12, color: "#F57C00" },
  mobileBannerBadge: {
    backgroundColor: "#FF6F00",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mobileBannerBadgeText: { fontSize: 11, color: "#FFFFFF", fontWeight: "700" },

  // Sections
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#888780",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 12,
  },

  // Feature card
  featureCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    overflow: "hidden",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 14,
    padding: 16,
  },
  featureIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#E8F5E9",
    alignItems: "center",
    justifyContent: "center",
  },
  featureItemIcon: { fontSize: 22 },
  featureItemRight: { flex: 1 },
  featureItemTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1B5E20",
    marginBottom: 4,
  },
  featureItemDesc: { fontSize: 13, color: "#888780", lineHeight: 18 },
  featureDivider: {
    height: 1,
    backgroundColor: "#F0F7F0",
    marginHorizontal: 16,
  },

  // Steps
  stepItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2E7D32",
    alignItems: "center",
    justifyContent: "center",
  },
  stepBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  stepIcon: { fontSize: 20 },
  stepText: { fontSize: 13, color: "#5F5E5A", flex: 1, lineHeight: 18 },

  // Stats
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E8F5E9",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statEmoji: { fontSize: 28, marginBottom: 8 },
  statNum: {
    fontSize: 22,
    fontWeight: "800",
    color: "#1B5E20",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#888780",
    textAlign: "center",
    lineHeight: 16,
  },

  // CTA card
  ctaCard: {
    backgroundColor: "#1B5E20",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#1B5E20",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaEmoji: { fontSize: 40, marginBottom: 12 },
  ctaTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFFFFF",
    marginBottom: 8,
    textAlign: "center",
  },
  ctaText: {
    fontSize: 13,
    color: "#A5D6A7",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  ctaBadgeRow: { flexDirection: "row", gap: 10 },
  ctaBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
  },
  ctaBadgeText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
});
