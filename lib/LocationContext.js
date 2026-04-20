import { createContext, useContext, useState, useEffect, useRef } from "react";
import * as Location from "expo-location";

const LocationContext = createContext({
  cityName: null,
  userLocation: null,
  locationReady: false,
});

export function LocationProvider({ children }) {
  const [cityName, setCityName] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [locationReady, setLocationReady] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (requested.current) return;
    requested.current = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setLocationReady(true);
          return;
        }
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setUserLocation(coords);

        const [place] = await Location.reverseGeocodeAsync(coords);
        if (place) {
          const city = place.city || place.subregion || place.region || null;
          const country = place.country || null;
          setCityName(city && country ? `${city}, ${country}` : city || country || null);
        }
      } catch (_) {
        // silent — fallback text handled by consumers
      } finally {
        setLocationReady(true);
      }
    })();
  }, []);

  return (
    <LocationContext.Provider value={{ cityName, userLocation, locationReady }}>
      {children}
    </LocationContext.Provider>
  );
}

export const useLocation = () => useContext(LocationContext);
