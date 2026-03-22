import "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, ActivityIndicator } from "react-native";
import { supabase } from "./lib/supabase";
import { LanguageProvider, useLanguage } from "./lang/LanguageContext";
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

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ label, focused, children }) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 6,
      gap: 2,
    }}
  >
    <View
      style={{
        width: 40,
        height: 28,
        borderRadius: 14,
        backgroundColor: focused ? "#E8F5E9" : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        style={{
          fontSize: 18,
          filter: focused ? "none" : "grayscale(100%)",
          opacity: focused ? 1 : 0.45,
        }}
      >
        {children}
      </Text>
    </View>
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? "700" : "500",
        color: focused ? "#2E7D32" : "#B4B2A9",
        letterSpacing: 0.2,
      }}
    >
      {label}
    </Text>
  </View>
);

function UserTabs() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F1F8F1",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: { color: "#1B5E20", fontWeight: "800", fontSize: 20 },
        headerTitleAlign: "center",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0F0F0",
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          paddingTop: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "🌿 Wajbeh",
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("discover")} focused={focused}>
              🏠
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: t("search"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("search")} focused={focused}>
              🔍
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: t("orders"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("orders")} focused={focused}>
              🛍️
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t("profile"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("profile")} focused={focused}>
              👤
            </TabIcon>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RestaurantTabs() {
  const { t } = useLanguage();
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#F1F8F1",
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: { color: "#1B5E20", fontWeight: "800", fontSize: 20 },
        headerTitleAlign: "center",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#F0F0F0",
          borderTopWidth: 1,
          height: 68,
          paddingBottom: 8,
          paddingTop: 4,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Reservations"
        component={RestaurantOrdersScreen}
        options={{
          title: t("reservations"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("reservations")} focused={focused}>
              🎫
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: t("dashboard"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("dashboard")} focused={focused}>
              📊
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          title: t("location"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("location")} focused={focused}>
              🗺️
            </TabIcon>
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: t("profile"),
          tabBarIcon: ({ focused }) => (
            <TabIcon label={t("profile")} focused={focused}>
              👤
            </TabIcon>
          ),
        }}
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
    </Stack.Navigator>
  );
}

function RestaurantStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#2E7D32",
        }}
      >
        <Text style={{ fontSize: 48, marginBottom: 16 }}>🌿</Text>
        <ActivityIndicator color="#FFFFFF" size="large" />
        <Text style={{ color: "#A5D6A7", marginTop: 12, fontSize: 14 }}>
          Loading Wajbeh...
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
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
