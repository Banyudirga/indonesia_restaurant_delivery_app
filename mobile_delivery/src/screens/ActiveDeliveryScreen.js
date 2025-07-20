import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
  Dimensions,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Card, Button, FAB } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import Geolocation from 'react-native-geolocation-service';

import { theme } from '../styles/theme';
import { updateOrderStatus } from '../store/deliverySlice';
import { orderAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

const ActiveDeliveryScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { orderId } = route.params;
  
  const [order, setOrder] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [estimatedTime, setEstimatedTime] = useState(null);
  const [distance, setDistance] = useState(null);
  const [navigationStep, setNavigationStep] = useState('pickup'); // 'pickup' or 'delivery'

  useEffect(() => {
    fetchOrder();
    getCurrentLocation();
    const locationInterval = setInterval(getCurrentLocation, 10000); // Update every 10 seconds
    
    return () => clearInterval(locationInterval);
  }, []);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      setOrder(response.data.order);
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch order details');
    }
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCurrentLocation(location);
        
        // In a real app, you would send this to the server
        // updateDriverLocation(location);
      },
      (error) => {
        console.log(error);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      setOrder(prev => ({ ...prev, status: newStatus }));
      
      if (newStatus === 'picked_up') {
        setNavigationStep('delivery');
        Alert.alert('Success', 'Pesanan berhasil diambil. Silakan antar ke pelanggan.');
      } else if (newStatus === 'delivered') {
        Alert.alert('Success', 'Pesanan berhasil diantar!');
        navigation.navigate('Dashboard');
      }
    } catch (error) {
      Alert.alert('Error', error);
    }
  };

  const handleCallCustomer = () => {
    if (order?.customerInfo?.phone) {
      Linking.openURL(`tel:${order.customerInfo.phone}`);
    }
  };

  const handleCallRestaurant = () => {
    if (order?.restaurantId?.phone) {
      Linking.openURL(`tel:${order.restaurantId.phone}`);
    }
  };

  const handleNavigate = () => {
    if (!currentLocation) return;
    
    const destination = navigationStep === 'pickup' 
      ? order.restaurantId.address.coordinates
      : order.deliveryAddress.coordinates;
    
    const url = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${destination.latitude},${destination.longitude}&travelmode=driving`;
    
    Linking.openURL(url);
  };

  const getDestinationCoordinates = () => {
    if (!order) return null;
    
    return navigationStep === 'pickup'
      ? order.restaurantId.address.coordinates
      : order.deliveryAddress.coordinates;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ready_for_pickup': return 'Siap Diambil';
      case 'picked_up': return 'Sedang Diantar';
      case 'on_the_way': return 'Dalam Perjalanan';
      case 'delivered': return 'Selesai';
      default: return status;
    }
  };

  const getNextAction = () => {
    if (!order) return null;
    
    switch (order.status) {
      case 'ready_for_pickup':
        return {
          label: 'Pesanan Diambil',
          action: () => handleStatusUpdate('picked_up'),
          color: theme.colors.primary,
        };
      case 'picked_up':
        return {
          label: 'Mulai Antar',
          action: () => handleStatusUpdate('on_the_way'),
          color: theme.colors.primary,
        };
      case 'on_the_way':
        return {
          label: 'Pesanan Diantar',
          action: () => handleStatusUpdate('delivered'),
          color: theme.colors.success,
        };
      default:
        return null;
    }
  };

  if (!order) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading order details...</Text>
      </View>
    );
  }

  const destination = getDestinationCoordinates();
  const nextAction = getNextAction();

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: currentLocation?.latitude || destination?.latitude || -6.2,
          longitude: currentLocation?.longitude || destination?.longitude || 106.8,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
        followsUserLocation={true}
      >
        {/* Restaurant Marker */}
        {navigationStep === 'pickup' && (
          <Marker
            coordinate={order.restaurantId.address.coordinates}
            title="Restaurant"
            description={order.restaurantId.name}
          >
            <View style={styles.restaurantMarker}>
              <Icon name="restaurant" size={20} color="#fff" />
            </View>
          </Marker>
        )}
        
        {/* Customer Marker */}
        {navigationStep === 'delivery' && (
          <Marker
            coordinate={order.deliveryAddress.coordinates}
            title="Customer"
            description={order.customerInfo.name}
          >
            <View style={styles.customerMarker}>
              <Icon name="home" size={20} color="#fff" />
            </View>
          </Marker>
        )}

        {/* Directions */}
        {currentLocation && destination && (
          <MapViewDirections
            origin={currentLocation}
            destination={destination}
            apikey="YOUR_GOOGLE_MAPS_API_KEY"
            strokeWidth={3}
            strokeColor={theme.colors.primary}
            onStart={(params) => {
              console.log('Started routing between locations');
            }}
            onReady={(result) => {
              setDistance(result.distance);
              setEstimatedTime(result.duration);
            }}
            onError={(errorMessage) => {
              console.log('Routing error:', errorMessage);
            }}
          />
        )}
      </MapView>

      {/* Order Info Card */}
      <Card style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderStatus}>
            Status: {getStatusText(order.status)}
          </Text>
        </View>
        
        <View style={styles.orderContent}>
          {navigationStep === 'pickup' ? (
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>📍 Ambil di:</Text>
              <Text style={styles.locationName}>{order.restaurantId.name}</Text>
              <Text style={styles.locationAddress}>
                {order.restaurantId.address.street}, {order.restaurantId.address.city}
              </Text>
              <TouchableOpacity onPress={handleCallRestaurant}>
                <Text style={styles.phoneNumber}>📞 {order.restaurantId.phone}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.locationInfo}>
              <Text style={styles.locationTitle}>📍 Antar ke:</Text>
              <Text style={styles.locationName}>{order.customerInfo.name}</Text>
              <Text style={styles.locationAddress}>
                {order.deliveryAddress.street}, {order.deliveryAddress.city}
              </Text>
              <TouchableOpacity onPress={handleCallCustomer}>
                <Text style={styles.phoneNumber}>📞 {order.customerInfo.phone}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.orderDetails}>
            <Text style={styles.orderItems}>
              📦 {order.items.length} items • Rp {order.totalAmount.toLocaleString()}
            </Text>
            <Text style={styles.paymentMethod}>
              {order.paymentMethod === 'cash' ? '💵 Bayar Tunai' : '💳 Sudah Dibayar'}
            </Text>
            {estimatedTime && (
              <Text style={styles.estimatedTime}>
                ⏱️ Estimasi: {Math.ceil(estimatedTime)} menit
              </Text>
            )}
          </View>
        </View>
      </Card>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={handleNavigate}
          style={styles.actionButton}
          icon="navigation"
        >
          Navigasi
        </Button>
        
        <Button
          mode="outlined"
          onPress={navigationStep === 'pickup' ? handleCallRestaurant : handleCallCustomer}
          style={styles.actionButton}
          icon="phone"
        >
          Telepon
        </Button>
        
        {nextAction && (
          <Button
            mode="contained"
            onPress={nextAction.action}
            style={[styles.actionButton, { backgroundColor: nextAction.color }]}
          >
            {nextAction.label}
          </Button>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  map: {
    flex: 1,
  },
  restaurantMarker: {
    backgroundColor: theme.colors.primary,
    padding: 8,
    borderRadius: 20,
  },
  customerMarker: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 20,
  },
  orderCard: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    maxHeight: height * 0.4,
  },
  orderHeader: {
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  orderStatus: {
    fontSize: 14,
    color: theme.colors.primary,
    marginTop: 4,
  },
  orderContent: {
    padding: 16,
  },
  locationInfo: {
    marginBottom: 16,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  phoneNumber: {
    fontSize: 14,
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
  orderDetails: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  orderItems: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 4,
  },
  paymentMethod: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  actionButtons: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 0.3,
    marginHorizontal: 4,
  },
});

export default ActiveDeliveryScreen;