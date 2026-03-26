import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useLanguage } from "../lang/LanguageContext";

const AMMAN_REGION = {
  latitude: 31.9539,
  longitude: 35.9106,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [marker, setMarker] = useState(null);
  const [savedMarker, setSavedMarker] = useState(null);
  const [region, setRegion] = useState(AMMAN_REGION);
  const mapRef = useRef(null);

  useEffect(() => {
    loadRestaurantAndLocation();
  }, []);

  const loadRestaurantAndLocation = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

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
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  const handleMapPress = (e) => {
    setMarker(e.nativeEvent.coordinate);
  };

  const saveLocation = async () => {
    if (!marker || !restaurant) return;
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ latitude: marker.latitude, longitude: marker.longitude })
      .eq("id", restaurant.id);

    if (error) {
      Alert.alert(t("error") || "Error", t("locationSaveError"));
    } else {
      setSavedMarker({ ...marker });
      Alert.alert(t("locationSaved"), t("locationSavedMsg"));
    }
    setSaving(false);
  };

  const cancelChanges = () => {
    setMarker(savedMarker);
  };

  const useMyLocation = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("permissionNeeded"), t("locationPermissionMsg"));
      return;
    }
    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    const coord = {
      latitude: loc.coords.latitude,
      longitude: loc.coords.longitude,
    };
    setMarker(coord);
    mapRef.current?.animateToRegion(
      { ...coord, latitudeDelta: 0.005, longitudeDelta: 0.005 },
      600,
    );
  };

  const hasChanges =
    marker &&
    (!savedMarker ||
      marker.latitude !== savedMarker.latitude ||
      marker.longitude !== savedMarker.longitude);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2E7D32" />
        <Text style={styles.loadingText}>{t("loadingMap")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Instruction bar */}
      {savedMarker ? (
        <View style={[styles.instructionBar, isRTL && styles.rtlRow]}>
          <Ionicons name="location" size={20} color="#2E7D32" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.instructionTitle, isRTL && styles.rtl]}>{t("locationConfirmed")}</Text>
            <Text style={[styles.instructionSub, isRTL && styles.rtl]}>{t("contactSupportLocation")}</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.instructionBar, isRTL && styles.rtlRow]}>
          <Ionicons name="location-outline" size={20} color="#737373" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.instructionTitle, isRTL && styles.rtl]}>{t("pinRestaurant")}</Text>
            <Text style={[styles.instructionSub, isRTL && styles.rtl]}>
              {marker ? t("tapToMovePin") : t("tapToPlacePin")}
            </Text>
          </View>
          <TouchableOpacity style={styles.myLocationBtn} onPress={useMyLocation}>
            <Ionicons name="navigate-outline" size={18} color="#2E7D32" />
          </TouchableOpacity>
        </View>
      )}

      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onPress={savedMarker ? undefined : handleMapPress}
        showsUserLocation
        showsMyLocationButton={false}
        mapType="standard"
      >
        {marker && (
          <Marker
            coordinate={marker}
            title={restaurant?.name || t("myRestaurant")}
            description={t("yourRestaurantLocation")}
          />
        )}
      </MapView>

      {/* Coordinates display */}
      {marker && (
        <View style={styles.coordBar}>
          <Text style={styles.coordText}>
            {marker.latitude.toFixed(5)}°N, {marker.longitude.toFixed(5)}°E
          </Text>
        </View>
      )}

      {/* Save / Cancel bar — only when no savedMarker and hasChanges */}
      {!savedMarker && hasChanges && (
        <View style={[styles.actionBar, isRTL && styles.rtlRow]}>
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
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.saveBtnText}>{t("saveLocation")}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  rtl: { textAlign: "right", writingDirection: "rtl" },
  rtlRow: { flexDirection: "row-reverse" },

  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  loadingText: { fontSize: 14, color: "#737373" },

  instructionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#DBDBDB",
  },
  instructionTitle: { fontSize: 14, fontWeight: "600", color: "#0F0F0F", marginBottom: 2 },
  instructionSub: { fontSize: 12, color: "#737373" },
  myLocationBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F2F8F2",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },

  map: { flex: 1 },

  coordBar: {
    position: "absolute",
    bottom: 90,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  coordText: { fontSize: 12, color: "#FFFFFF", fontFamily: Platform.OS === "ios" ? "Courier" : "monospace" },

  actionBar: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#DBDBDB",
  },
  saveBtn: {
    flex: 1,
    backgroundColor: "#2E7D32",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnDisabled: { backgroundColor: "#B8B8B8" },
  saveBtnText: { color: "#FFFFFF", fontWeight: "600", fontSize: 15 },
  cancelBtn: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#FAFAFA",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#DBDBDB",
  },
  cancelBtnText: { color: "#737373", fontWeight: "500", fontSize: 15 },
});
