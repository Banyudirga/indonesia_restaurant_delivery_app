import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, IconButton, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../styles/theme';
import {
  selectCart,
  selectCartItems,
  selectCartTotal,
  updateQuantity,
  removeFromCart,
  clearCart,
} from '../../store/cartSlice';

const CartScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const cart = useSelector(selectCart);
  const cartItems = useSelector(selectCartItems);
  const cartTotal = useSelector(selectCartTotal);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <IconButton
          icon="delete"
          size={24}
          onPress={handleClearCart}
          disabled={cartItems.length === 0}
        />
      ),
    });
  }, [navigation, cartItems.length]);

  const handleClearCart = () => {
    Alert.alert(
      'Hapus Semua',
      'Yakin ingin menghapus semua item dari keranjang?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus', style: 'destructive', onPress: () => dispatch(clearCart()) },
      ]
    );
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity === 0) {
      Alert.alert(
        'Hapus Item',
        'Yakin ingin menghapus item ini dari keranjang?',
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: () => dispatch(removeFromCart(itemId)) },
        ]
      );
    } else {
      dispatch(updateQuantity({ itemId, quantity: newQuantity }));
    }
  };

  const renderCartItem = (item) => (
    <Card key={item.id} style={styles.cartItem}>
      <View style={styles.itemContent}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }}
          style={styles.itemImage}
        />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.spiceLevel}>
            Tingkat Kepedasan: {getSpiceLevelText(item.spiceLevel)}
          </Text>
          {item.toppings && item.toppings.length > 0 && (
            <Text style={styles.toppings}>
              + {item.toppings.map(t => t.name).join(', ')}
            </Text>
          )}
          {item.specialInstructions && (
            <Text style={styles.specialInstructions}>
              Catatan: {item.specialInstructions}
            </Text>
          )}
          <Text style={styles.itemPrice}>
            Rp {(item.unitPrice * item.quantity).toLocaleString()}
          </Text>
        </View>
        <View style={styles.quantityContainer}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity - 1)}
          >
            <Icon name="remove" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={styles.quantity}>{item.quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => handleQuantityChange(item.id, item.quantity + 1)}
          >
            <Icon name="add" size={20} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </Card>
  );

  const getSpiceLevelText = (level) => {
    switch (level) {
      case 'mild': return 'Tidak Pedas';
      case 'medium': return 'Sedang';
      case 'spicy': return 'Pedas';
      case 'extra_spicy': return 'Extra Pedas';
      default: return 'Sedang';
    }
  };

  if (cartItems.length === 0) {
    return (
      <View style={styles.emptyCart}>
        <Icon name="shopping-cart" size={80} color={theme.colors.disabled} />
        <Text style={styles.emptyCartText}>Keranjang Belanja Kosong</Text>
        <Text style={styles.emptyCartSubtext}>
          Yuk, pilih seblak favorit kamu!
        </Text>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('HomeTab')}
          style={styles.shopButton}
        >
          Mulai Belanja
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Restaurant Info */}
        <Card style={styles.restaurantCard}>
          <View style={styles.restaurantHeader}>
            <Icon name="restaurant" size={24} color={theme.colors.primary} />
            <Text style={styles.restaurantName}>{cart.restaurantName}</Text>
          </View>
        </Card>

        {/* Cart Items */}
        <View style={styles.itemsContainer}>
          <Text style={styles.sectionTitle}>Item Pesanan</Text>
          {cartItems.map(renderCartItem)}
        </View>

        {/* Add More Items */}
        <TouchableOpacity
          style={styles.addMoreButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="add" size={24} color={theme.colors.primary} />
          <Text style={styles.addMoreText}>Tambah Item Lain</Text>
        </TouchableOpacity>

        {/* Spacing for fixed bottom section */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Order Summary */}
      <View style={styles.summaryContainer}>
        <Card style={styles.summaryCard}>
          <View style={styles.summaryContent}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                Rp {cart.subtotal.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ongkir</Text>
              <Text style={styles.summaryValue}>
                Rp {cart.deliveryFee.toLocaleString()}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Pajak</Text>
              <Text style={styles.summaryValue}>
                Rp {cart.tax.toLocaleString()}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                Rp {cartTotal.toLocaleString()}
              </Text>
            </View>
          </View>
        </Card>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('Checkout')}
          style={styles.checkoutButton}
          contentStyle={styles.checkoutButtonContent}
        >
          Lanjut ke Checkout
        </Button>
      </View>
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
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyCartText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyCartSubtext: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  shopButton: {
    borderRadius: 25,
  },
  restaurantCard: {
    margin: 16,
    marginBottom: 8,
  },
  restaurantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginLeft: 12,
  },
  itemsContainer: {
    margin: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
  },
  cartItem: {
    marginBottom: 12,
  },
  itemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  spiceLevel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  toppings: {
    fontSize: 12,
    color: theme.colors.primary,
    marginBottom: 2,
  },
  specialInstructions: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginHorizontal: 16,
    minWidth: 24,
    textAlign: 'center',
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderStyle: 'dashed',
  },
  addMoreText: {
    fontSize: 16,
    color: theme.colors.primary,
    marginLeft: 8,
  },
  bottomSpacing: {
    height: 200,
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 16,
  },
  summaryCard: {
    marginBottom: 16,
  },
  summaryContent: {
    padding: 16,
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
    marginVertical: 8,
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
  checkoutButton: {
    borderRadius: 25,
  },
  checkoutButtonContent: {
    height: 50,
  },
});

export default CartScreen;