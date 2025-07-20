import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';

import DashboardScreen from '../screens/DashboardScreen';
import ActiveDeliveryScreen from '../screens/ActiveDeliveryScreen';
import EarningsScreen from '../screens/EarningsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import TransactionHistoryScreen from '../screens/TransactionHistoryScreen';

import { theme } from '../styles/theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const DashboardStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
    <Stack.Screen name="ActiveDelivery" component={ActiveDeliveryScreen} options={{ title: 'Delivery Aktif' }} />
  </Stack.Navigator>
);

const EarningsStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="Earnings" component={EarningsScreen} options={{ title: 'Penghasilan' }} />
    <Stack.Screen name="TransactionHistory" component={TransactionHistoryScreen} options={{ title: 'Riwayat Transaksi' }} />
  </Stack.Navigator>
);

const MainNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'DashboardTab') {
            iconName = 'dashboard';
          } else if (route.name === 'EarningsTab') {
            iconName = 'account-balance-wallet';
          } else if (route.name === 'Profile') {
            iconName = 'person';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} options={{ title: 'Dashboard' }} />
      <Tab.Screen name="EarningsTab" component={EarningsStack} options={{ title: 'Penghasilan' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
};

export default MainNavigator;