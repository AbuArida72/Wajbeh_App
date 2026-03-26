import "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
import ContactScreen from "./screens/ContactScreen";
import PaymentScreen from "./screens/PaymentScreen";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ iconName, focused }) => (
  <View style={{ alignItems: "center", justifyContent: "center" }}>
    <Ionicons
      name={focused ? iconName : `${iconName}-outline`}
      size={24}
      color={focused ? "#2E7D32" : "#8E8E8E"}
    />
  </View>
);

function UserTabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#DBDBDB",
          elevation: 0,
          shadowOpacity: 0,
          height: 50 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="search" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="bag-handle" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" focused={focused} />
          ),
        }}
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
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 0.5,
          borderTopColor: "#DBDBDB",
          elevation: 0,
          shadowOpacity: 0,
          height: 50 + (insets.bottom > 0 ? insets.bottom : 8),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          paddingTop: 4,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="grid" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Reservations"
        component={RestaurantOrdersScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="calendar" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="location" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon iconName="person" focused={focused} />
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
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#FFFFFF",
        }}
      >
        <ActivityIndicator color="#2E7D32" size="large" />
        <Text style={{ color: "#737373", marginTop: 12, fontSize: 14 }}>
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
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
