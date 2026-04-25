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
import { GlassPanel, T, WallpaperBackground, TextBackdrop, ar, FONTS } from "../components/Glass";

export default function ContactScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { t, isRTL } = useLanguage();
  const [expandedFaq, setExpandedFaq] = useState(null);

  const CONTACT_ITEMS = [
    {
      label: "Email",
      value: "support@wajbeh.jo",
      icon: "mail-outline",
      action: () => Linking.openURL("mailto:support@wajbeh.jo"),
    },
    {
      label: "WhatsApp",
      value: "+962 7X XXX XXXX",
      icon: "logo-whatsapp",
      action: () => Linking.openURL("https://wa.me/96270000000"),
    },
    {
      label: "Instagram",
      value: "@wajbeh.jo",
      icon: "logo-instagram",
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
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }, isRTL && styles.rtlRow]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Ionicons name={isRTL ? "arrow-forward" : "arrow-back"} size={18} color={T.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isRTL && styles.rtl, ar(isRTL, "bold")]}>{t("contactTitle")}</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Intro */}
        <GlassPanel radius={20} padding={20} style={{ marginBottom: 24, alignItems: "center" }}>
          <Text style={[styles.introTitle, isRTL && styles.rtl]}>{t("hereToHelp")}</Text>
          <Text style={[styles.introSub, isRTL && styles.rtl]}>{t("reachOut")}</Text>
        </GlassPanel>

        {/* Contact channels */}
        <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>{t("getInTouch")}</Text>
        <GlassPanel radius={18} style={{ overflow: "hidden", marginBottom: 24 }}>
          {CONTACT_ITEMS.map((item, i) => (
            <View key={i}>
              <TouchableOpacity
                style={[styles.contactRow, isRTL && styles.rtlRow]}
                onPress={item.action}
                activeOpacity={0.7}
              >
                <View style={[styles.contactLeft, isRTL && styles.rtlRow]}>
                  <Ionicons name={item.icon} size={20} color={T.green} />
                  <View>
                    <Text style={[styles.contactLabel, isRTL && styles.rtl]}>{item.label}</Text>
                    <Text style={[styles.contactValue, isRTL && styles.rtl]}>{item.value}</Text>
                  </View>
                </View>
                <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={14} color={T.muteStrong} />
              </TouchableOpacity>
              {i < CONTACT_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassPanel>

        {/* FAQ */}
        <Text style={[styles.sectionLabel, isRTL && styles.rtl]}>{t("faqLabel")}</Text>
        <GlassPanel radius={18} style={{ overflow: "hidden", marginBottom: 24 }}>
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
                  size={14}
                  color={T.muteStrong}
                />
              </TouchableOpacity>
              {expandedFaq === i && (
                <Text style={[styles.faqAnswer, isRTL && styles.rtl]}>{item.a}</Text>
              )}
              {i < FAQ_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </GlassPanel>

        <Text style={styles.footerText}>{t("appTagline")}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  header: {
    backgroundColor: "#FFFFFF",
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: T.border,
  },
  backBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: T.bg,
    borderWidth: 1, borderColor: T.border,
    alignItems: "center", justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", color: T.ink, fontFamily: FONTS.bold },

  content: { paddingHorizontal: 20, paddingTop: 16 },

  introTitle: { fontSize: 17, fontWeight: "700", color: T.ink, marginBottom: 8, textAlign: "center" },
  introSub: { fontSize: 13, color: T.mute, lineHeight: 20, textAlign: "center" },

  sectionLabel: { fontSize: 9, fontWeight: "700", color: T.muteStrong, letterSpacing: 1.2, marginBottom: 8, textTransform: "uppercase" },

  contactRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16 },
  contactLeft: { flexDirection: "row", alignItems: "center", gap: 14, flex: 1 },
  contactLabel: { fontSize: 10, color: T.muteStrong, marginBottom: 2, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },
  contactValue: { fontSize: 14, fontWeight: "600", color: T.ink },

  faqRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, gap: 12 },
  faqQuestion: { flex: 1, fontSize: 13, fontWeight: "600", color: T.ink, lineHeight: 19 },
  faqAnswer: { fontSize: 12, color: T.mute, lineHeight: 19, paddingHorizontal: 16, paddingBottom: 16 },

  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)", marginHorizontal: 14 },

  footerText: { fontSize: 11, color: T.muteStrong, textAlign: "center", marginTop: 8 },
});
