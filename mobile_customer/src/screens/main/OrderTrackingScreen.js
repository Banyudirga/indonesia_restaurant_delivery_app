import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
} from 'react-native';
import { Card, Button, Avatar } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';
import MapView, { Marker, Polyline } from 'react-native-maps';
import io from 'socket.io-client';

import { theme } from '../../styles/theme';
import { orderAPI } from '../../services/api';

const OrderTrackingScreen = ({ route, navigation }) => {
  const { orderId } = route.params;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);

  useEffect(() => {
    fetchOrder();
    setupSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      const response = await orderAPI.getOrderById(orderId);
      setOrder(response.data.order);
    } catch (error) {
      Alert.alert('Error', 'Gagal memuat data pesanan');
    } finally {
      setLoading(false);
    }
  };

  const setupSocket = () => {
    const newSocket = io('http://localhost:3000');
    
    newSocket.on('connect', () => {
      console.log('Connected to socket');
      newSocket.emit('join_order', orderId);
    });

    newSocket.on('order_status_updated', (data) => {
      if (data.orderId === orderId) {
        setOrder(prev => ({ ...prev, status: data.status }));
      }
    });

    newSocket.on('driver_location_updated', (data) => {
      if (data.orderId === orderId) {
        setDriverLocation(data.location);
      }
    });

    setSocket(newSocket);
  };

  const handleCallDriver = () => {
    if (order?.deliveryPartnerId?.phone) {
      const phoneNumber = `tel:${order.deliveryPartnerId.phone}`;
      Linking.openURL(phoneNumber);
    }
  };

  const handleCallRestaurant = () => {
    if (order?.restaurantId?.phone) {
      const phoneNumber = `tel:${order.restaurantId.phone}`;
      Linking.openURL(phoneNumber);
    }
  };

  const getStatusSteps = () => {
    const steps = [
      { key: 'confirmed', label: 'Pesanan Dikonfirmasi', completed: false },
      { key: 'preparing', label: 'Sedang Dimasak', completed: false },
      { key: 'ready_for_pickup', label: 'Siap Diambil', completed: false },
      { key: 'picked_up', label: 'Sedang Diantar', completed: false },
      { key: 'delivered', label: 'Selesai', completed: false },
    ];

    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered'];
    const currentIndex = statusOrder.indexOf(order?.status);

    return steps.map((step, index) => {
      if (index <= currentIndex - 1) {
        step.completed = true;
      }
      return step;
    });
  };

  const renderStatusStep = (step, index, steps) => {
    const isActive = index === steps.findIndex(s => !s.completed);
    const isCompleted = step.completed;

    return (
      <View key={step.key} style={styles.statusStep}>
        <View style={styles.statusStepLeft}>
          <View style={[
            styles.statusIcon,
            isCompleted && styles.statusIconCompleted,
            isActive && styles.statusIconActive,
          ]}>
            {isCompleted ? (
              <Icon name="check" size={16} color="#fff" />
            ) : (
              <View style={styles.statusIconEmpty} />
            )}
          </View>
          {index < steps.length - 1 && (
            <View style={[
              styles.statusLine,
              isCompleted && styles.statusLineCompleted,
            ]} />
          )}
        </View>
        <View style={styles.statusStepContent}>
          <Text style={[
            styles.statusStepLabel,
            isCompleted && styles.statusStepLabelCompleted,
            isActive && styles.statusStepLabelActive,
          ]}>
            {step.label}
          </Text>
          {isActive && (
            <Text style={styles.statusStepTime}>
              {getEstimatedTime(step.key)}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const getEstimatedTime = (status) => {
    switch (status) {
      case 'confirmed': return 'Memproses pesanan...';
      case 'preparing': return 'Estimasi 15-20 menit';
      case 'ready_for_pickup': return 'Menunggu driver...';
      case 'picked_up': return 'Estimasi 10-15 menit';
      default: return '';
    }
  };

  const renderMap = () => {
    if (!order?.deliveryAddress?.coordinates) return null;

    const customerLocation = {
      latitude: order.deliveryAddress.coordinates.latitude,
      longitude: order.deliveryAddress.coordinates.longitude,
    };

    const restaurantLocation = {
      latitude: order.restaurantId.address.coordinates.latitude,
      longitude: order.restaurantId.address.coordinates.longitude,
    };

    return (
      <Card style={styles.mapCard}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: customerLocation.latitude,
            longitude: customerLocation.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}
        >
          <Marker
            coordinate={restaurantLocation}
            title="Restaurant"
            description={order.restaurantId.name}
          >
            <View style={styles.restaurantMarker}>
              <Icon name="restaurant" size={20} color="#fff" />
            </View>
          </Marker>
          
          <Marker
            coordinate={customerLocation}
            title="Tujuan"
            description="Lokasi pengiriman"
          >
            <View style={styles.customerMarker}>
              <Icon name="home" size={20} color="#fff" />
            </View>
          </Marker>

          {driverLocation && (
            <Marker
              coordinate={driverLocation}
              title="Driver"
              description="Lokasi driver"
            >
              <View style={styles.driverMarker}>
                <Icon name="motorcycle" size={20} color="#fff" />
              </View>
            </Marker>
          )}

          {driverLocation && (
            <Polyline
              coordinates={[driverLocation, customerLocation]}
              strokeColor={theme.colors.primary}
              strokeWidth={3}
            />
          )}
        </MapView>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Memuat data pesanan...</Text>
      </View>
    );
  }

  if (!order) {
    return (
      <View style={styles.errorContainer}>
        <Text>Pesanan tidak ditemukan</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Order Header */}
      <Card style={styles.headerCard}>
        <View style={styles.headerContent}>
          <Text style={styles.orderNumber}>#{order.orderNumber}</Text>
          <Text style={styles.orderStatus}>
            Status: {getStatusText(order.status)}
          </Text>
          <Text style={styles.estimatedTime}>
            Estimasi tiba: {getEstimatedDeliveryTime()}
          </Text>
        </View>
      </Card>

      {/* Map */}
      {renderMap()}

      {/* Order Status */}
      <Card style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Status Pesanan</Text>
        </View>
        <View style={styles.statusContent}>
          {getStatusSteps().map((step, index, steps) => 
            renderStatusStep(step, index, steps)
          )}
        </View>
      </Card>

      {/* Driver Info */}
      {order.deliveryPartnerId && (
        <Card style={styles.driverCard}>
          <View style={styles.driverHeader}>
            <Text style={styles.driverTitle}>Info Driver</Text>
          </View>
          <View style={styles.driverContent}>
            <Avatar.Text
              size={50}
              label={order.deliveryPartnerId.fullName.charAt(0)}
              style={styles.driverAvatar}
            />
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {order.deliveryPartnerId.fullName}
              </Text>
              <Text style={styles.driverPhone}>
                {order.deliveryPartnerId.phone}
              </Text>
              <Text style={styles.driverVehicle}>
                🏍️ Motor
              </Text>
            </View>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallDriver}
            >
              <Icon name="phone" size={24} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </Card>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          mode="outlined"
          onPress={handleCallRestaurant}
          style={styles.actionButton}
          icon="restaurant"
        >
          Hubungi Restaurant
        </Button>
        
        {order.deliveryPartnerId && (
          <Button
            mode="contained"
            onPress={handleCallDriver}
            style={styles.actionButton}
            icon="phone"
          >
            Hubungi Driver
          </Button>
        )}
      </View>
    </ScrollView>
  );
};

const getStatusText = (status) => {
  switch (status) {
    case 'pending': return 'Menunggu Konfirmasi';
    case 'confirmed': return 'Dikonfirmasi';
    case 'preparing': return 'Sedang Dimasak';
    case 'ready_for_pickup': return 'Siap Diambil';
    case 'picked_up': return 'Sedang Diantar';
    case 'on_the_way': return 'Dalam Perjalanan';
    case 'delivered': return 'Selesai';
    case 'cancelled': return 'Dibatalkan';
    default: return status;
  }
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCard: {
    margin: 16,
    marginBottom: 8,
  },
  headerContent: {
    padding: 16,
  },
  orderNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  orderStatus: {
    fontSize: 16,
    color: theme.colors.primary,
    marginTop: 4,
  },
  estimatedTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  mapCard: {
    marginHorizontal: 16,
    marginBottom: 8,
    height: 200,
  },
  map: {
    flex: 1,
    borderRadius: 8,
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
  driverMarker: {
    backgroundColor: '#FF9800',
    padding: 8,
    borderRadius: 20,
  },
  statusCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  statusHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statusContent: {
    padding: 16,
    paddingTop: 0,
  },
  statusStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  statusStepLeft: {
    alignItems: 'center',
    marginRight: 16,
  },
  statusIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusIconActive: {
    backgroundColor: theme.colors.primary,
  },
  statusIconEmpty: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  statusLine: {
    width: 2,
    height: 24,
    backgroundColor: '#e0e0e0',
    marginTop: 8,
  },
  statusLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  statusStepContent: {
    flex: 1,
    justifyContent: 'center',
  },
  statusStepLabel: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statusStepLabelCompleted: {
    color: theme.colors.text,
    fontWeight: 'bold',
  },
  statusStepLabelActive: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  statusStepTime: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  driverCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  driverHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  driverTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  driverContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 0,
  },
  driverAvatar: {
    backgroundColor: theme.colors.primary,
    marginRight: 16,
  },
  driverInfo: {
    flex: 1,
  },
  driverName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  driverPhone: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  driverVehicle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  callButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
  },
  actionButtons: {
    padding: 16,
    gap: 8,
  },
  actionButton: {
    borderRadius: 25,
  },
});

export default OrderTrackingScreen;