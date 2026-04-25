import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from "react-native";
import AppDialog, { useDialog } from "../components/AppDialog";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { WallpaperBackground, GlassPanel, GlassButton, T, ar } from "../components/Glass";

const AMMAN_REGION = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const SUPPORT_EMAIL = "support@wajbeh.jo";
const SUPPORT_WA    = "https://wa.me/96270000000";

export default function MapScreen() {
  const { t, isRTL } = useLanguage();
  const insets = useSafeAreaInsets();
  const { dialogProps, alert: showAlert } = useDialog();
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [marker, setMarker]         = useState(null);
  const [savedMarker, setSavedMarker] = useState(null);
  const [region, setRegion]         = useState(AMMAN_REGION);
  const [mapType, setMapType]       = useState("standard");
  const [address, setAddress]       = useState(null);
  const mapRef = useRef(null);

  useEffect(() => { loadRestaurantAndLocation(); }, []);

  const loadRestaurantAndLocation = async () => {
    const { data: { user } } = await supabase.auth.getUser();

    const { data } = await supabase
      .from("restaurants")
      .select("id, name, latitude, longitude")
      .eq("owner_id", user.id)
      .single();

    if (data) {
      setRestaurant(data);
      if (data.latitude && data.longitude) {
        const coord = { latitude: data.latitude, longitude: data.longitude };
        setMarker(coord);
        setSavedMarker(coord);
        setRegion({ ...coord, latitudeDelta: 0.01, longitudeDelta: 0.01 });
        fetchAddress(coord);
      } else {
        await centerOnDeviceLocation();
      }
    } else {
      await centerOnDeviceLocation();
    }

    setLoading(false);
  };

  const centerOnDeviceLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === "granted") {
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const fetchAddress = async (coord) => {
    try {
      const results = await Location.reverseGeocodeAsync(coord);
      if (results?.length > 0) {
        const r = results[0];
        const parts = [r.street, r.district || r.subregion, r.city].filter(Boolean);
        setAddress(parts.slice(0, 2).join(", ") || null);
      }
    } catch {
      setAddress(null);
    }
  };

  const handleMapPress = (e) => {
    const coord = e.nativeEvent.coordinate;
    setMarker(coord);
    setAddress(null);
    fetchAddress(coord);
  };

  const saveLocation = async () => {
    if (!marker || !restaurant) return;
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ latitude: marker.latitude, longitude: marker.longitude })
      .eq("id", restaurant.id);

    if (error) {
      showAlert(t("error") || "Error", t("locationSaveError"));
    } else {
      setSavedMarker({ ...marker });
      showAlert(t("locationSaved"), t("locationSavedMsg"));
    }
    setSaving(false);
  };

  const cancelChanges = () => {
    setMarker(savedMarker);
    if (savedMarker) fetchAddress(savedMarker);
    else setAddress(null);
  };

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      showAlert(t("permissionNeeded"), t("locationPermissionMsg"));
      return;
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
    const coord = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
    setMarker(coord);
    setAddress(null);
    fetchAddress(coord);
    mapRef.current?.animateToRegion({ ...coord, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 600);
  };

  const recenterMap = () => {
    if (marker) {
      mapRef.current?.animateToRegion({ ...marker, latitudeDelta: 0.008, longitudeDelta: 0.008 }, 500);
    }
  };

  const toggleMapType = () => setMapType((p) => (p === "standard" ? "satellite" : "standard"));

  const hasChanges =
    marker &&
    (!savedMarker ||
      marker.latitude !== savedMarker.latitude ||
      marker.longitude !== savedMarker.longitude);

  const topBarH = insets.top + 74;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>

        <GlassPanel radius={20} padding={28} style={styles.loadingCard}>
          <ActivityIndicator size="large" color={T.green} />
          <Text style={[styles.loadingText, ar(isRTL)]}>{t("loadingMap")}</Text>
        </GlassPanel>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── TOP BAR ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + 10 }]}>
        <View style={[styles.topBarInner, isRTL && styles.rtlRow]}>
          {/* Status dot + name */}
          <View style={[styles.topBarTexts, isRTL && { alignItems: "flex-end" }]}>
            <View style={[styles.statusRow, isRTL && styles.rtlRow]}>
              <View style={[styles.statusDot, { backgroundColor: savedMarker ? T.green : T.muteStrong }]} />
              <Text
                style={[styles.restaurantName, isRTL && styles.rtl, ar(isRTL, "semiBold")]}
                numberOfLines={1}
              >
                {restaurant?.name || t("myRestaurant")}
              </Text>
            </View>
            <Text style={[styles.topBarSub, isRTL && styles.rtl]} numberOfLines={1}>
              {savedMarker
                ? address || t("locationConfirmed")
                : marker
                ? address || t("tapToMovePin")
                : t("tapToPlacePin")}
            </Text>
          </View>

          {/* My location button (only shown before location is locked) */}
          {!savedMarker && (
            <TouchableOpacity style={styles.glassIconBtn} onPress={useMyLocation}>
              <Ionicons name="navigate" size={18} color={T.green} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── MAP ── */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onPress={savedMarker ? undefined : handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        mapType={mapType}
        showsCompass={false}
        showsScale
      >
        {marker && (
          <Marker
            coordinate={marker}
            title={restaurant?.name || t("myRestaurant")}
            description={address || t("yourRestaurantLocation")}
            pinColor={T.green}
          />
        )}
      </MapView>

      {/* ── SIDE BUTTONS — upper right ── */}
      <View style={[styles.sideStack, { top: topBarH + 12 }]}>
        <TouchableOpacity style={styles.glassIconBtn} onPress={toggleMapType}>
          <Ionicons
            name={mapType === "standard" ? "globe-outline" : "map-outline"}
            size={19}
            color={T.green}
          />
          <Text style={styles.sideBtnLabel}>
            {mapType === "standard" ? "SAT" : "MAP"}
          </Text>
        </TouchableOpacity>

        {marker && (
          <TouchableOpacity style={styles.glassIconBtn} onPress={recenterMap}>
            <Ionicons name="locate-outline" size={19} color={T.green} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── BOTTOM BAR ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>

        {savedMarker ? (
          /* Location locked — show contact-us section */
          <View style={styles.bottomContent}>
            {/* Coord row */}
            <View style={[styles.coordRow, isRTL && styles.rtlRow]}>
              <Ionicons name="location" size={13} color={T.green} />
              <Text style={[styles.coordText, { color: T.green }, isRTL && styles.rtl]} numberOfLines={1}>
                {address || `${marker?.latitude.toFixed(5)}, ${marker?.longitude.toFixed(5)}`}
              </Text>
              <View style={styles.confirmedBadge}>
                <Ionicons name="checkmark-circle" size={11} color="#fff" />
                <Text style={styles.confirmedBadgeText}>{t("locationConfirmed")}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Contact-us panel */}
            <View style={[styles.contactSection, isRTL && { alignItems: "flex-end" }]}>
              <Text style={[styles.contactTitle, isRTL && styles.rtl, ar(isRTL, "semiBold")]}>
                {t("changeLocationTitle")}
              </Text>
              <Text style={[styles.contactSub, isRTL && styles.rtl]}>
                {t("changeLocationSub")}
              </Text>
              <View style={[styles.contactBtns, isRTL && styles.rtlRow]}>
                <TouchableOpacity
                  style={styles.contactBtn}
                  onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
                >
                  <Ionicons name="mail-outline" size={15} color={T.green} />
                  <Text style={styles.contactBtnText}>{t("contactEmailBtn")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.contactBtn, styles.contactBtnWa]}
                  onPress={() => Linking.openURL(SUPPORT_WA)}
                >
                  <Ionicons name="logo-whatsapp" size={15} color="#fff" />
                  <Text style={[styles.contactBtnText, { color: "#fff" }]}>{t("contactWhatsAppBtn")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          /* Not yet saved — editing flow */
          <View style={styles.bottomContent}>
            {/* Coord / hint row */}
            <View style={[styles.coordRow, isRTL && styles.rtlRow]}>
              <Ionicons name="location-outline" size={13} color={T.mute} />
              <Text style={[styles.coordText, isRTL && styles.rtl]} numberOfLines={1}>
                {marker
                  ? address || `${marker.latitude.toFixed(5)}, ${marker.longitude.toFixed(5)}`
                  : t("tapToPlacePin")}
              </Text>
            </View>

            {hasChanges && <View style={styles.divider} />}

            {hasChanges && (
              <View style={[styles.actionRow, isRTL && styles.rtlRow]}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={cancelChanges}
                  disabled={saving}
                >
                  <Text style={styles.cancelBtnText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={saveLocation}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.saveBtnText}>{t("saveLocation")}</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </View>
      <AppDialog {...dialogProps} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F7F2" },
  rtl:       { textAlign: "right", writingDirection: "rtl" },
  rtlRow:    { flexDirection: "row-reverse" },

  // Loading
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingCard:      { alignItems: "center", gap: 14, minWidth: 180 },
  loadingText:      { fontSize: 14, color: T.mute, marginTop: 4 },

  // Top bar
  topBar: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(15,23,42,0.06)",
    backgroundColor: "#FFFFFF",
    zIndex: 10,
  },
  topBarInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  topBarTexts: { flex: 1, gap: 3 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  restaurantName: {
    fontSize: 15,
    fontWeight: "700",
    color: T.ink,
    flexShrink: 1,
  },
  topBarSub: {
    fontSize: 12,
    color: T.mute,
    paddingStart: 15,
  },

  // Map
  map: { flex: 1 },

  // Shared glass icon button
  glassIconBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    borderWidth: 1,
    borderColor: "rgba(26,26,26,0.10)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  sideBtnLabel: {
    fontSize: 8,
    fontWeight: "700",
    color: T.green,
    letterSpacing: 0.5,
  },

  // Side stack
  sideStack: {
    position: "absolute",
    right: 14,
    gap: 8,
  },

  // Bottom bar
  bottomBar: {
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(15,23,42,0.06)",
    backgroundColor: "#FFFFFF",
  },
  bottomContent: { gap: 10 },

  // Coordinates row
  coordRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  coordText: {
    flex: 1,
    fontSize: 12,
    color: T.mute,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: T.green,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  confirmedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },

  divider: { height: 1, backgroundColor: "rgba(15,23,42,0.06)" },

  // Contact section
  contactSection: { gap: 8 },
  contactTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: T.ink,
  },
  contactSub: {
    fontSize: 12,
    color: T.mute,
    lineHeight: 17,
  },
  contactBtns: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  contactBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "rgba(21,128,61,0.08)",
    borderWidth: 1,
    borderColor: "rgba(21,128,61,0.18)",
  },
  contactBtnWa: {
    backgroundColor: "#25D366",
    borderColor: "rgba(0,0,0,0.06)",
  },
  contactBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: T.green,
  },

  // Editing actions
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "rgba(15,23,42,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.08)",
  },
  cancelBtnText: { color: T.ink, fontWeight: "500", fontSize: 14 },
  saveBtn: {
    flex: 1,
    backgroundColor: T.green,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(30,58,33,0.40)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  saveBtnDisabled: { backgroundColor: T.muteStrong, shadowOpacity: 0 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
});
