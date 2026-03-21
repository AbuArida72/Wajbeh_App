import "react-native-gesture-handler";
import { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { Text, View, ActivityIndicator } from "react-native";
import { supabase } from "./lib/supabase";
import HomeScreen from "./screens/HomeScreen";
import OrdersScreen from "./screens/OrdersScreen";
import ProfileScreen from "./screens/ProfileScreen";
import SearchScreen from "./screens/SearchScreen";
import BagDetailScreen from "./screens/BagDetailScreen";
import ConfirmationScreen from "./screens/ConfirmationScreen";
import DashboardScreen from "./screens/DashboardScreen";
import RestaurantOrdersScreen from "./screens/RestaurantOrdersScreen";
import LandingScreen from "./screens/LandingScreen";
import SignInScreen from "./screens/SignInScreen";
import SignUpScreen from "./screens/SignUpScreen";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabIcon = ({ emoji, label, focused }) => (
  <View
    style={{
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 6,
      gap: 3,
    }}
  >
    <View
      style={{
        width: 44,
        height: 30,
        borderRadius: 15,
        backgroundColor: focused ? "#E8F5E9" : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 18 }}>{emoji}</Text>
    </View>
    <Text
      style={{
        fontSize: 11,
        fontWeight: focused ? "700" : "400",
        color: focused ? "#2E7D32" : "#888780",
      }}
    >
      {label}
    </Text>
  </View>
);

function UserTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#F1F8F1" },
        headerTitleStyle: {
          color: "#1B5E20",
          fontWeight: "800",
          fontSize: 22,
          letterSpacing: 1,
        },
        headerTitleAlign: "center",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0EEE0",
          height: 72,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
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
            <TabIcon emoji="🏠" label="Discover" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          title: "Search",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🔍" label="Search" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{
          title: "My Orders",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🛍️" label="Orders" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function RestaurantTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: "#F1F8F1" },
        headerTitleStyle: {
          color: "#1B5E20",
          fontWeight: "800",
          fontSize: 22,
          letterSpacing: 1,
        },
        headerTitleAlign: "center",
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopColor: "#E0EEE0",
          height: 72,
          paddingBottom: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.06,
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
          title: "Reservations",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🎫" label="Reservations" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📊" label="Dashboard" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
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
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isRestaurant ? (
          <Stack.Screen name="RestaurantTabs" component={RestaurantTabs} />
        ) : (
          <>
            <Stack.Screen name="Tabs" component={UserTabs} />
            <Stack.Screen name="BagDetail" component={BagDetailScreen} />
            <Stack.Screen name="Confirmation" component={ConfirmationScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
