import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { Button, Card, Chip, Divider } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialIcons';

import { theme } from '../../styles/theme';
import { addToCart, selectCartItemsCount } from '../../store/cartSlice';
import MenuItemModal from '../../components/MenuItemModal';
import CartButton from '../../components/CartButton';

const RestaurantDetailScreen = ({ route, navigation }) => {
  const dispatch = useDispatch();
  const { restaurant } = route.params;
  const cartItemsCount = useSelector(selectCartItemsCount);
  
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [menuItemModalVisible, setMenuItemModalVisible] = useState(false);

  const categories = [
    { id: 'all', name: 'Semua' },
    { id: 'seblak_kerupuk', name: 'Seblak Kerupuk' },
    { id: 'seblak_mie', name: 'Seblak Mie' },
    { id: 'seblak_ceker', name: 'Seblak Ceker' },
    { id: 'seblak_sosis', name: 'Seblak Sosis' },
    { id: 'seblak_seafood', name: 'Seblak Seafood' },
  ];

  useEffect(() => {
    navigation.setOptions({
      title: restaurant.name,
      headerRight: () => cartItemsCount > 0 && <CartButton navigation={navigation} />,
    });
  }, [navigation, restaurant.name, cartItemsCount]);

  const filteredMenu = restaurant.menu.filter(item => 
    selectedCategory === 'all' || item.category === selectedCategory
  );

  const handleMenuItemPress = (item) => {
    setSelectedMenuItem(item);
    setMenuItemModalVisible(true);
  };

  const handleAddToCart = (item) => {
    dispatch(addToCart({
      item: {
        ...item,
        id: `${item._id}_${Date.now()}`,
      },
      restaurantId: restaurant._id,
      restaurantName: restaurant.name,
    }));
  };

  const renderMenuItem = ({ item }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={() => handleMenuItemPress(item)}
      disabled={!item.isAvailable}
    >
      <View style={styles.menuItemContent}>
        <Image
          source={{ uri: item.imageUrl || 'https://via.placeholder.com/80' }}
          style={styles.menuItemImage}
        />
        <View style={styles.menuItemInfo}>
          <Text style={styles.menuItemName}>{item.name}</Text>
          <Text style={styles.menuItemDescription} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.menuItemMeta}>
            <Text style={styles.menuItemPrice}>
              Rp {item.basePrice.toLocaleString()}
            </Text>
            <View style={styles.spiceLevelContainer}>
              {item.spiceLevels.map((level, index) => (
                <Chip
                  key={index}
                  mode="outlined"
                  compact
                  style={[styles.spiceLevelChip, { backgroundColor: getSpiceColor(level.level) }]}
                >
                  {getSpiceIcon(level.level)}
                </Chip>
              ))}
            </View>
          </View>
        </View>
      </View>
      {!item.isAvailable && (
        <View style={styles.unavailableOverlay}>
          <Text style={styles.unavailableText}>Tidak Tersedia</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.selectedCategoryChip
      ]}
      onPress={() => setSelectedCategory(item.id)}
    >
      <Text
        style={[
          styles.categoryText,
          selectedCategory === item.id && styles.selectedCategoryText
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  const getSpiceColor = (level) => {
    switch (level) {
      case 'mild': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'spicy': return '#FF5722';
      case 'extra_spicy': return '#D32F2F';
      default: return '#4CAF50';
    }
  };

  const getSpiceIcon = (level) => {
    switch (level) {
      case 'mild': return '🌶️';
      case 'medium': return '🌶️🌶️';
      case 'spicy': return '🌶️🌶️🌶️';
      case 'extra_spicy': return '🌶️🌶️🌶️🌶️';
      default: return '🌶️';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        {/* Restaurant Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: restaurant.bannerUrl || 'https://via.placeholder.com/400x200' }}
            style={styles.bannerImage}
          />
          <View style={styles.restaurantInfo}>
            <Text style={styles.restaurantName}>{restaurant.name}</Text>
            <Text style={styles.restaurantDescription}>{restaurant.description}</Text>
            <View style={styles.restaurantMeta}>
              <View style={styles.rating}>
                <Icon name="star" size={16} color={theme.colors.warning} />
                <Text style={styles.ratingText}>{restaurant.rating.toFixed(1)}</Text>
                <Text style={styles.reviewCount}>({restaurant.totalReviews} reviews)</Text>
              </View>
              <Text style={styles.deliveryTime}>20-30 min</Text>
              <Text style={styles.deliveryFee}>Rp {restaurant.deliveryFee.toLocaleString()}</Text>
            </View>
            <Text style={styles.address}>
              {restaurant.address.street}, {restaurant.address.city}
            </Text>
          </View>
        </View>

        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categories}
            renderItem={renderCategory}
            keyExtractor={item => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesList}
          />
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          <Text style={styles.sectionTitle}>Menu</Text>
          <FlatList
            data={filteredMenu}
            renderItem={renderMenuItem}
            keyExtractor={item => item._id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </ScrollView>

      {/* Menu Item Modal */}
      <MenuItemModal
        visible={menuItemModalVisible}
        menuItem={selectedMenuItem}
        restaurant={restaurant}
        onClose={() => setMenuItemModalVisible(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart Button */}
      {cartItemsCount > 0 && (
        <View style={styles.cartButtonContainer}>
          <Button
            mode="contained"
            onPress={() => navigation.navigate('Cart')}
            style={styles.cartButton}
          >
            Lihat Keranjang ({cartItemsCount})
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: 16,
  },
  bannerImage: {
    width: '100%',
    height: 200,
  },
  restaurantInfo: {
    padding: 16,
  },
  restaurantName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  restaurantDescription: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 12,
  },
  restaurantMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 14,
    marginLeft: 4,
    color: theme.colors.text,
  },
  reviewCount: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginLeft: 4,
  },
  deliveryTime: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  deliveryFee: {
    fontSize: 14,
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  categoriesContainer: {
    paddingVertical: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
    backgroundColor: '#fff',
  },
  selectedCategoryChip: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  selectedCategoryText: {
    color: '#fff',
  },
  menuContainer: {
    paddingBottom: 100,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    paddingHorizontal: 16,
    color: theme.colors.text,
  },
  menuItem: {
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  menuItemContent: {
    flexDirection: 'row',
    padding: 16,
  },
  menuItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  menuItemInfo: {
    flex: 1,
  },
  menuItemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  menuItemDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 8,
  },
  menuItemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuItemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  spiceLevelContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  spiceLevelChip: {
    height: 24,
    width: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unavailableText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cartButtonContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
  cartButton: {
    borderRadius: 25,
  },
});

export default RestaurantDetailScreen;