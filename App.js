import "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { useFonts, ElMessiri_400Regular, ElMessiri_500Medium, ElMessiri_600SemiBold, ElMessiri_700Bold } from "@expo-google-fonts/el-messiri";
import { DMSans_400Regular, DMSans_500Medium, DMSans_600SemiBold, DMSans_700Bold } from "@expo-google-fonts/dm-sans";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, ActivityIndicator, StyleSheet, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "./lib/supabase";
import { LanguageProvider, useLanguage } from "./lang/LanguageContext";
import { LocationProvider } from "./lib/LocationContext";
import { T } from "./components/Glass";
import HomeScreen from "./screens/HomeScreen";
import OrdersScreen from "./screens/OrdersScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import BagDetailScreen from "./screens/BagDetailScreen";
import ConfirmationScreen from "./screens/ConfirmationScreen";
import DashboardScreen from "./screens/DashboardScreen";
import RestaurantOrdersScreen from "./screens/RestaurantOrdersScreen";
import MapScreen from "./screens/MapScreen";
import LandingScreen from "./screens/LandingScreen";
import SignInScreen from "./screens/SignInScreen";
import SignUpScreen from "./screens/SignUpScreen";
import ContactScreen from "./screens/ContactScreen";
import PaymentScreen from "./screens/PaymentScreen";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Minimal tab icon
const TabIcon = ({ iconName, focused, label }) => (
  <View style={{ alignItems: "center", gap: 3, width: 56 }}>
    <Ionicons
      name={focused ? iconName : `${iconName}-outline`}
      size={22}
      color={focused ? T.green : T.muteStrong}
    />
    <Text
      numberOfLines={1}
      style={{ fontSize: 9, fontWeight: "600", color: focused ? T.green : T.muteStrong, textAlign: "center" }}
    >
      {label}
    </Text>
  </View>
);

const TAB_BAR_STYLE = (insets) => ({
  backgroundColor: "#FFFFFF",
  borderTopWidth: 1,
  borderTopColor: "rgba(26,26,26,0.08)",
  elevation: 0,
  shadowColor: "#78716C",
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 1,
  shadowRadius: 12,
  height: Platform.OS === "android"
    ? 58 + insets.bottom
    : 56 + (insets.bottom > 0 ? insets.bottom : 10),
  paddingBottom: Platform.OS === "android"
    ? 6 + insets.bottom
    : insets.bottom > 0 ? insets.bottom : 10,
  paddingTop: Platform.OS === "android" ? 6 : 8,
});

function UserTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE(insets),
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="home" focused={focused} label="Home" /> }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="search" focused={focused} label="Search" /> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="bag-handle" focused={focused} label="Orders" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="person" focused={focused} label="Profile" /> }}
      />
    </Tab.Navigator>
  );
}

function RestaurantTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: TAB_BAR_STYLE(insets),
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="grid" focused={focused} label="Bags" /> }}
      />
      <Tab.Screen
        name="Reservations"
        component={RestaurantOrdersScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="calendar" focused={focused} label="Orders" /> }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="location" focused={focused} label="Map" /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ tabBarIcon: ({ focused }) => <TabIcon iconName="person" focused={focused} label="Profile" /> }}
      />
    </Tab.Navigator>
  );
}

function UserStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={UserTabs} />
      <Stack.Screen name="BagDetail" component={BagDetailScreen} />
      <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
      <Stack.Screen name="Contact" component={ContactScreen} />
      <Stack.Screen name="Payment" component={PaymentScreen} />
    </Stack.Navigator>
  );
}

function RestaurantStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />
      <Stack.Screen name="Contact" component={ContactScreen} />
    </Stack.Navigator>
  );
}

function AppContent() {
  const [user, setUser] = useState(null);
  const [isRestaurant, setIsRestaurant] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        checkProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        checkProfile(session.user.id);
      } else {
        setUser(null);
        setIsRestaurant(false);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkProfile = async (userId) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_restaurant")
      .eq("id", userId)
      .single();
    setIsRestaurant(data?.is_restaurant || false);
    setLoading(false);
  };

  const handleAuthSuccess = (u) => {
    setUser(u);
    checkProfile(u.id);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#FAF7F4" }}>
        <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />
        <ActivityIndicator color={T.green} size="large" />
        <Text style={{ color: T.mute, marginTop: 12, fontSize: 14, fontWeight: "500" }}>
          Wajbeh
        </Text>
      </View>
    );
  }

  if (!user) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Landing" component={LandingScreen} />
          <Stack.Screen name="SignIn">
            {(props) => (
              <SignInScreen {...props} onAuthSuccess={handleAuthSuccess} />
            )}
          </Stack.Screen>
          <Stack.Screen name="SignUp">
            {(props) => (
              <SignUpScreen {...props} onAuthSuccess={handleAuthSuccess} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Contact" component={ContactScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      {isRestaurant ? <RestaurantStack /> : <UserStack />}
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    ElMessiri_400Regular,
    ElMessiri_500Medium,
    ElMessiri_600SemiBold,
    ElMessiri_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <LocationProvider>
          <AppContent />
        </LocationProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
