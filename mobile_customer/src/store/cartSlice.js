import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: [],
    restaurantId: null,
    restaurantName: null,
    subtotal: 0,
    deliveryFee: 0,
    tax: 0,
    total: 0,
  },
  reducers: {
    addToCart: (state, action) => {
      const { item, restaurantId, restaurantName } = action.payload;
      
      // If cart has items from different restaurant, clear cart
      if (state.restaurantId && state.restaurantId !== restaurantId) {
        state.items = [];
      }
      
      state.restaurantId = restaurantId;
      state.restaurantName = restaurantName;
      
      const existingItem = state.items.find(
        (cartItem) => 
          cartItem.menuItemId === item.menuItemId && 
          cartItem.spiceLevel === item.spiceLevel &&
          JSON.stringify(cartItem.toppings) === JSON.stringify(item.toppings)
      );
      
      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        state.items.push(item);
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    removeFromCart: (state, action) => {
      const itemId = action.payload;
      state.items = state.items.filter(item => item.id !== itemId);
      
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    updateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      const item = state.items.find(item => item.id === itemId);
      
      if (item) {
        if (quantity > 0) {
          item.quantity = quantity;
        } else {
          state.items = state.items.filter(item => item.id !== itemId);
        }
      }
      
      if (state.items.length === 0) {
        state.restaurantId = null;
        state.restaurantName = null;
      }
      
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    clearCart: (state) => {
      state.items = [];
      state.restaurantId = null;
      state.restaurantName = null;
      state.subtotal = 0;
      state.deliveryFee = 0;
      state.tax = 0;
      state.total = 0;
    },
    
    setDeliveryFee: (state, action) => {
      state.deliveryFee = action.payload;
      cartSlice.caseReducers.calculateTotals(state);
    },
    
    calculateTotals: (state) => {
      state.subtotal = state.items.reduce((total, item) => {
        return total + (item.unitPrice * item.quantity);
      }, 0);
      
      state.tax = state.subtotal * 0.1; // 10% tax
      state.total = state.subtotal + state.deliveryFee + state.tax;
    },
  },
});

export const { 
  addToCart, 
  removeFromCart, 
  updateQuantity, 
  clearCart, 
  setDeliveryFee 
} = cartSlice.actions;

// Selectors
export const selectCart = (state) => state.cart;
export const selectCartItems = (state) => state.cart.items;
export const selectCartTotal = (state) => state.cart.total;
export const selectCartItemsCount = (state) => 
  state.cart.items.reduce((total, item) => total + item.quantity, 0);

export default cartSlice.reducer;