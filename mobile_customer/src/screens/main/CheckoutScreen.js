import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, TextInput, RadioButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../styles/theme';
import { selectCart, selectCartTotal, clearCart } from '../../store/cartSlice';
import { selectUser } from '../../store/authSlice';
import { orderAPI, paymentAPI } from '../../services/api';
import AddressModal from '../../components/AddressModal';
import PaymentMethodModal from '../../components/PaymentMethodModal';

const CheckoutScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const cartTotal = useSelector(selectCartTotal);
  const user = useSelector(selectUser);

  const [deliveryAddress, setDeliveryAddress] = useState(user?.address || {});
  const [paymentMethod, setPaymentMethod] = useState('qris');
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    try {
      const response = await paymentAPI.getPaymentMethods();
      setPaymentMethods(response.data.paymentMethods);
    } catch (error) {
      console.error('Failed to fetch payment methods:', error);
    }
  };

  const handlePlaceOrder = async () => {
    if (!deliveryAddress.street) {
      Alert.alert('Error', 'Mohon pilih alamat pengiriman');
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        restaurantId: cart.restaurantId,
        items: cart.items.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          spiceLevel: item.spiceLevel,
          toppings: item.toppings,
          specialInstructions: item.specialInstructions,
        })),
        deliveryAddress: {
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          province: deliveryAddress.province,
          postalCode: deliveryAddress.postalCode,
          coordinates: deliveryAddress.coordinates,
          notes: deliveryAddress.notes,
        },
        paymentMethod,
        specialInstructions,
      };

      const response = await orderAPI.createOrder(orderData);
      const order = response.data.order;

      // Clear cart
      dispatch(clearCart());

      // Navigate to payment screen
      navigation.navigate('Payment', { order });
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Gagal membuat pesanan');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodInfo = (methodId) => {
    return paymentMethods.find(method => method.id === methodId);
  };

  const renderOrderSummary = () => (
    <Card style={styles.summaryCard}>
      <View style={styles.summaryHeader}>
        <Text style={styles.summaryTitle}>Ringkasan Pesanan</Text>
      </View>
      <View style={styles.summaryContent}>
        <View style={styles.restaurantInfo}>
          <Icon name="restaurant" size={20} color={theme.colors.primary} />
          <Text style={styles.restaurantName}>{cart.restaurantName}</Text>
        </View>
        <Text style={styles.itemCount}>
          {cart.items.length} item • {cart.items.reduce((total, item) => total + item.quantity, 0)} porsi
        </Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>Rp {cart.subtotal.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ongkir</Text>
          <Text style={styles.summaryValue}>Rp {cart.deliveryFee.toLocaleString()}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pajak</Text>
          <Text style={styles.summaryValue}>Rp {cart.tax.toLocaleString()}</Text>
        </View>
        <Divider style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>Rp {cartTotal.toLocaleString()}</Text>
        </View>
      </View>
    </Card>
  );

  const renderDeliveryAddress = () => (
    <Card style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setAddressModalVisible(true)}
      >
        <View style={styles.sectionHeaderLeft}>
          <Icon name="location-on" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Alamat Pengiriman</Text>
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      
      <View style={styles.sectionContent}>
        {deliveryAddress.street ? (
          <View>
            <Text style={styles.addressText}>
              {deliveryAddress.street}
            </Text>
            <Text style={styles.addressSubtext}>
              {deliveryAddress.city}, {deliveryAddress.province} {deliveryAddress.postalCode}
            </Text>
            {deliveryAddress.notes && (
              <Text style={styles.addressNotes}>
                Catatan: {deliveryAddress.notes}
              </Text>
            )}
          </View>
        ) : (
          <Text style={styles.noAddressText}>
            Pilih alamat pengiriman
          </Text>
        )}
      </View>
    </Card>
  );

  const renderPaymentMethod = () => (
    <Card style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setPaymentModalVisible(true)}
      >
        <View style={styles.sectionHeaderLeft}>
          <Icon name="payment" size={24} color={theme.colors.primary} />
          <Text style={styles.sectionTitle}>Metode Pembayaran</Text>
        </View>
        <Icon name="chevron-right" size={24} color={theme.colors.textSecondary} />
      </TouchableOpacity>
      
      <View style={styles.sectionContent}>
        {paymentMethod && (
          <View style={styles.paymentMethodInfo}>
            <Text style={styles.paymentMethodName}>
              {getPaymentMethodInfo(paymentMethod)?.name}
            </Text>
            <Text style={styles.paymentMethodDesc}>
              {getPaymentMethodInfo(paymentMethod)?.description}
            </Text>
          </View>
        )}
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {renderOrderSummary()}
        {renderDeliveryAddress()}
        {renderPaymentMethod()}
        
        {/* Special Instructions */}
        <Card style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Icon name="note" size={24} color={theme.colors.primary} />
              <Text style={styles.sectionTitle}>Catatan untuk Driver</Text>
            </View>
          </View>
          <View style={styles.sectionContent}>
            <TextInput
              value={specialInstructions}
              onChangeText={setSpecialInstructions}
              placeholder="Contoh: Rumah cat hijau, sebelah warung nasi"
              multiline
              numberOfLines={3}
              style={styles.textInput}
            />
          </View>
        </Card>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Place Order Button */}
      <View style={styles.checkoutContainer}>
        <Button
          mode="contained"
          onPress={handlePlaceOrder}
          loading={loading}
          disabled={loading || !deliveryAddress.street}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
        >
          Pesan Sekarang - Rp {cartTotal.toLocaleString()}
        </Button>
      </View>

      {/* Address Modal */}
      <AddressModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        onSelectAddress={setDeliveryAddress}
        currentAddress={deliveryAddress}
      />

      {/* Payment Method Modal */}
      <PaymentMethodModal
        visible={paymentModalVisible}
        onClose={() => setPaymentModalVisible(false)}
        onSelectPayment={setPaymentMethod}
        currentPayment={paymentMethod}
        paymentMethods={paymentMethods}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  summaryCard: {
    margin: 16,
    marginBottom: 8,
  },
  summaryHeader: {
    padding: 16,
    paddingBottom: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  summaryContent: {
    padding: 16,
    paddingTop: 0,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  restaurantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  itemCount: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    color: theme.colors.text,
  },
  divider: {
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  sectionCard: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 8,
  },
  sectionContent: {
    padding: 16,
    paddingTop: 0,
  },
  addressText: {
    fontSize: 16,
    color: theme.colors.text,
    marginBottom: 4,
  },
  addressSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  addressNotes: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginTop: 4,
  },
  noAddressText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
  },
  paymentMethodInfo: {
    marginTop: 4,
  },
  paymentMethodName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  paymentMethodDesc: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  textInput: {
    backgroundColor: '#fff',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 100,
  },
  checkoutContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 16,
  },
  checkoutButton: {
    borderRadius: 25,
  },
  checkoutButtonContent: {
    height: 50,
  },
});

export default CheckoutScreen;