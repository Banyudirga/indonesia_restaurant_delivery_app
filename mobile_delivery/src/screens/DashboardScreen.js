import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, Switch, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Geolocation from 'react-native-geolocation-service';

import { theme } from '../styles/theme';
import {
  selectDelivery,
  selectIsOnline,
  selectAvailableOrders,
  selectEarnings,
  setOnlineStatus,
  setCurrentLocation,
  getAvailableOrders,
  getEarnings,
  acceptOrder,
} from '../store/deliverySlice';
import { selectUser } from '../store/authSlice';

const DashboardScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const delivery = useSelector(selectDelivery);
  const isOnline = useSelector(selectIsOnline);
  const availableOrders = useSelector(selectAvailableOrders);
  const earnings = useSelector(selectEarnings);
  const user = useSelector(selectUser);

  const [refreshing, setRefreshing] = useState(false);
  const [locationPermission, setLocationPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
  }, []);

  useEffect(() => {
    if (locationPermission) {
      getCurrentLocation();
    }
  }, [locationPermission]);

  useEffect(() => {
    if (isOnline && delivery.currentLocation) {
      fetchData();
      const interval = setInterval(() => {
        fetchData();
      }, 30000); // Refresh every 30 seconds
      return () => clearInterval(interval);
    }
  }, [isOnline, delivery.currentLocation]);

  const requestLocationPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'Delivery app needs location access to find nearby orders.',
            buttonPositive: 'OK',
          }
        );
        setLocationPermission(granted === PermissionsAndroid.RESULTS.GRANTED);
      } catch (err) {
        console.warn(err);
      }
    } else {
      setLocationPermission(true);
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        dispatch(setCurrentLocation(location));
      },
      (error) => {
        console.log(error);
        Alert.alert('Error', 'Unable to get current location');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const fetchData = async () => {
    if (delivery.currentLocation) {
      dispatch(getAvailableOrders(delivery.currentLocation));
      dispatch(getEarnings('today'));
    }
  };

  const handleToggleOnline = async (value) => {
    try {
      dispatch(setOnlineStatus(value));
      // In a real app, you would call an API to update online status
    } catch (error) {
      Alert.alert('Error', 'Failed to update online status');
    }
  };

  const handleAcceptOrder = async (orderId) => {
    try {
      await dispatch(acceptOrder(orderId)).unwrap();
      Alert.alert('Success', 'Order accepted successfully');
      navigation.navigate('ActiveDelivery', { orderId });
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const renderOrderCard = ({ item }) => (
    <Card style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.restaurantName}>{item.restaurantId.name}</Text>
          <Text style={styles.orderDistance}>
            📍 {calculateDistance(item.restaurantId.address.coordinates)} km
          </Text>
        </View>
        <View style={styles.orderEarnings}>
          <Text style={styles.earningsAmount}>
            Rp {item.deliveryFee.toLocaleString()}
          </Text>
          <Text style={styles.earningsLabel}>Earning</Text>
        </View>
      </View>
      
      <View style={styles.orderDetails}>
        <View style={styles.orderMeta}>
          <Text style={styles.orderItems}>📦 {item.items.length} items</Text>
          <Text style={styles.orderValue}>
            💰 Rp {item.totalAmount.toLocaleString()}
          </Text>
          <Text style={styles.paymentMethod}>
            {item.paymentMethod === 'cash' ? '💵 Cash' : '💳 Digital'}
          </Text>
        </View>
        
        <View style={styles.deliveryInfo}>
          <Text style={styles.deliveryAddress}>
            📍 {item.deliveryAddress.street}, {item.deliveryAddress.city}
          </Text>
          <Text style={styles.estimatedTime}>
            ⏱️ Est. {item.estimatedDeliveryTime} min
          </Text>
        </View>
      </View>
      
      <View style={styles.orderActions}>
        <Button
          mode="outlined"
          onPress={() => {/* Show order details */}}
          style={styles.detailsButton}
        >
          Details
        </Button>
        <Button
          mode="contained"
          onPress={() => handleAcceptOrder(item._id)}
          style={styles.acceptButton}
        >
          Accept
        </Button>
      </View>
    </Card>
  );

  const calculateDistance = (restaurantCoords) => {
    if (!delivery.currentLocation) return 0;
    
    const lat1 = delivery.currentLocation.latitude;
    const lon1 = delivery.currentLocation.longitude;
    const lat2 = restaurantCoords.latitude;
    const lon2 = restaurantCoords.longitude;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance.toFixed(1);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Halo, {user?.fullName}!</Text>
            <Text style={styles.subtitle}>
              {isOnline ? 'Kamu sedang online' : 'Kamu sedang offline'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            <View style={styles.onlineToggle}>
              <Text style={styles.toggleLabel}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
              <Switch
                value={isOnline}
                onValueChange={handleToggleOnline}
                color={theme.colors.primary}
              />
            </View>
          </View>
        </View>

        {/* Earnings Summary */}
        <Card style={styles.earningsCard}>
          <Text style={styles.earningsTitle}>Penghasilan Hari Ini</Text>
          <View style={styles.earningsGrid}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>
                Rp {earnings.today.toLocaleString()}
              </Text>
              <Text style={styles.earningsLabel}>Total</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>{earnings.deliveryCount}</Text>
              <Text style={styles.earningsLabel}>Delivery</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsValue}>
                {earnings.averageRating.toFixed(1)}⭐
              </Text>
              <Text style={styles.earningsLabel}>Rating</Text>
            </View>
          </View>
        </Card>

        {/* Online Status Message */}
        {!isOnline && (
          <Card style={styles.statusCard}>
            <View style={styles.statusContent}>
              <Icon name="info" size={24} color={theme.colors.primary} />
              <Text style={styles.statusText}>
                Aktifkan status online untuk melihat pesanan tersedia
              </Text>
            </View>
          </Card>
        )}

        {/* Available Orders */}
        {isOnline && (
          <View style={styles.ordersSection}>
            <Text style={styles.sectionTitle}>
              Pesanan Tersedia ({availableOrders.length})
            </Text>
            {availableOrders.length > 0 ? (
              <FlatList
                data={availableOrders}
                renderItem={renderOrderCard}
                keyExtractor={item => item._id}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  Belum ada pesanan tersedia saat ini
                </Text>
                <Text style={styles.emptySubtext}>
                  Pesanan baru akan muncul di sini
                </Text>
              </Card>
            )}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <FAB
        style={styles.fab}
        icon="refresh"
        onPress={() => fetchData()}
        disabled={!isOnline}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.primary,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'center',
  },
  onlineToggle: {
    alignItems: 'center',
  },
  toggleLabel: {
    fontSize: 12,
    color: '#fff',
    marginBottom: 4,
  },
  earningsCard: {
    margin: 16,
    marginBottom: 8,
  },
  earningsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    padding: 16,
    paddingBottom: 8,
  },
  earningsGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  earningsItem: {
    flex: 1,
    alignItems: 'center',
  },
  earningsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  earningsLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statusContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.text,
    marginLeft: 12,
    flex: 1,
  },
  ordersSection: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  orderCard: {
    marginBottom: 12,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  orderDistance: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  orderEarnings: {
    alignItems: 'center',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  orderDetails: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  orderMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  orderItems: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  orderValue: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  paymentMethod: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  deliveryInfo: {
    marginBottom: 8,
  },
  deliveryAddress: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  estimatedTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  orderActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 8,
  },
  detailsButton: {
    flex: 0.4,
  },
  acceptButton: {
    flex: 0.55,
  },
  emptyCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 8,
  },
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.primary,
  },
});

export default DashboardScreen;