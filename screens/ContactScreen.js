import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../lang/LanguageContext";

export default function ContactScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const CONTACT_ITEMS = [
    {
      label: "Email",
      value: "support@wajbeh.com",
      iconName: "mail-outline",
      iconBg: "#E3F2FD",
      iconColor: "#1565C0",
      action: () => Linking.openURL("mailto:support@wajbeh.com"),
    },
    {
      label: "WhatsApp",
      value: "+962 7X XXX XXXX",
      iconName: "logo-whatsapp",
      iconBg: "#E8F5E9",
      iconColor: "#2E7D32",
      action: () => Linking.openURL("https://wa.me/96270000000"),
    },
    {
      label: "Instagram",
      value: "@wajbeh.jo",
      iconName: "logo-instagram",
      iconBg: "#FCE4EC",
      iconColor: "#C2185B",
      action: () => Linking.openURL("https://instagram.com/wajbeh.jo"),
    },
  ];

  const FAQ_ITEMS = [
    { q: t("faqAppWorks"), a: t("faqAppWorksAnswer") },
    { q: t("faqPickupCode"), a: t("faqPickupCodeAnswer") },
    { q: t("faqCancel"), a: t("faqCancelAnswer") },
    { q: t("faqRestaurant"), a: t("faqRestaurantAnswer") },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1B5E20" barStyle="light-content" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }, isRTL && styles.rtlRow]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtl]}>{t("contactTitle")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.introBlock}>
          <Text style={[styles.introTitle, isRTL && styles.rtl]}>{t("hereToHelp")}</Text>
          <Text style={[styles.introSub, isRTL && styles.rtl]}>{t("reachOut")}</Text>
        </View>

        <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>{t("getInTouch")}</Text>
        <View style={styles.card}>
          {CONTACT_ITEMS.map((item, i) => (
            <View key={i}>
              <TouchableOpacity
                style={[styles.contactRow, isRTL && styles.rtlRow]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={[styles.contactLeft, isRTL && styles.rtlRow]}>
                  <View style={[styles.contactIconWrap, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.iconName} size={18} color={item.iconColor} />
                  </View>
                  <View>
                    <Text style={[styles.contactLabel, isRTL && styles.rtl]}>{item.label}</Text>
                    <Text style={[styles.contactValue, isRTL && styles.rtl]}>{item.value}</Text>
                  </View>
                </View>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={16} color="#B8B8B8" />
              </TouchableOpacity>
              {i < CONTACT_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>{t("faqLabel")}</Text>
        <View style={styles.card}>
          {FAQ_ITEMS.map((item, i) => (
            <View key={i}>
              <TouchableOpacity
                style={[styles.faqRow, isRTL && styles.rtlRow]}
                onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}
                activeOpacity={0.7}
              >
                <Text style={[styles.faqQuestion, isRTL && styles.rtl]} numberOfLines={expandedFaq === i ? 0 : 1}>
                  {item.q}
                </Text>
                <Ionicons
                  name={expandedFaq === i ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#737373"
                />
              </TouchableOpacity>
              {expandedFaq === i && (
                <Text style={[styles.faqAnswer, isRTL && styles.rtl]}>{item.a}</Text>
              )}
              {i < FAQ_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerNoteText}>{t("wajbehTagline")}</Text>
          <Text style={styles.footerNoteVersion}>v1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAFAFA" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1B5E20",
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  introBlock: {
    backgroundColor: "#E8F5E9",
    borderRadius: 14,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#A5D6A7",
    alignItems: "center",
  },
  introTitle: { fontSize: 18, fontWeight: "700", color: "#1B5E20", marginBottom: 8, textAlign: "center" },
  introSub: { fontSize: 14, color: "#4CAF50", lineHeight: 21, textAlign: "center" },

  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2E7D32",
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EBEBEB",
    overflow: "hidden",
    marginBottom: 24,
  },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  contactIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  contactLabel: { fontSize: 12, color: "#737373", marginBottom: 2, fontWeight: "500" },
  contactValue: { fontSize: 14, fontWeight: "600", color: "#0F0F0F" },

  faqRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    gap: 12,
  },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: "600", color: "#0F0F0F", lineHeight: 20 },
  faqAnswer: {
    fontSize: 13,
    color: "#737373",
    lineHeight: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 0,
    backgroundColor: "#FAFAFA",
  },

  divider: { height: 1, backgroundColor: "#F0F0F0", marginHorizontal: 16 },

  footerNote: { alignItems: "center", paddingTop: 8 },
  footerNoteText: { fontSize: 12, color: "#A5D6A7", marginBottom: 4, fontWeight: "500" },
  footerNoteVersion: { fontSize: 11, color: "#B8B8B8" },
});
