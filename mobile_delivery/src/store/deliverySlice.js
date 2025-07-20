import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { deliveryAPI } from '../services/api';

// Async thunks
export const getAvailableOrders = createAsyncThunk(
  'delivery/getAvailableOrders',
  async (location, { rejectWithValue }) => {
    try {
      const response = await deliveryAPI.getAvailableOrders(location);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch orders');
    }
  }
);

export const acceptOrder = createAsyncThunk(
  'delivery/acceptOrder',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await deliveryAPI.acceptOrder(orderId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to accept order');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'delivery/updateOrderStatus',
  async ({ orderId, status }, { rejectWithValue }) => {
    try {
      const response = await deliveryAPI.updateOrderStatus(orderId, status);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update status');
    }
  }
);

export const getActiveDeliveries = createAsyncThunk(
  'delivery/getActiveDeliveries',
  async (_, { rejectWithValue }) => {
    try {
      const response = await deliveryAPI.getActiveDeliveries();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch deliveries');
    }
  }
);

export const getEarnings = createAsyncThunk(
  'delivery/getEarnings',
  async (period, { rejectWithValue }) => {
    try {
      const response = await deliveryAPI.getEarnings(period);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch earnings');
    }
  }
);

const deliverySlice = createSlice({
  name: 'delivery',
  initialState: {
    isOnline: false,
    currentLocation: null,
    availableOrders: [],
    activeDeliveries: [],
    completedDeliveries: [],
    earnings: {
      today: 0,
      thisWeek: 0,
      thisMonth: 0,
      deliveryCount: 0,
      averageRating: 0,
    },
    isLoading: false,
    error: null,
  },
  reducers: {
    setOnlineStatus: (state, action) => {
      state.isOnline = action.payload;
    },
    setCurrentLocation: (state, action) => {
      state.currentLocation = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    removeAvailableOrder: (state, action) => {
      state.availableOrders = state.availableOrders.filter(
        order => order._id !== action.payload
      );
    },
    addActiveDelivery: (state, action) => {
      state.activeDeliveries.push(action.payload);
    },
    updateActiveDelivery: (state, action) => {
      const { orderId, updates } = action.payload;
      const index = state.activeDeliveries.findIndex(order => order._id === orderId);
      if (index !== -1) {
        state.activeDeliveries[index] = { ...state.activeDeliveries[index], ...updates };
      }
    },
    removeActiveDelivery: (state, action) => {
      state.activeDeliveries = state.activeDeliveries.filter(
        order => order._id !== action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // Get Available Orders
    builder.addCase(getAvailableOrders.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(getAvailableOrders.fulfilled, (state, action) => {
      state.isLoading = false;
      state.availableOrders = action.payload.orders;
    });
    builder.addCase(getAvailableOrders.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Accept Order
    builder.addCase(acceptOrder.fulfilled, (state, action) => {
      const order = action.payload.order;
      state.availableOrders = state.availableOrders.filter(o => o._id !== order._id);
      state.activeDeliveries.push(order);
    });

    // Get Active Deliveries
    builder.addCase(getActiveDeliveries.fulfilled, (state, action) => {
      state.activeDeliveries = action.payload.deliveries;
    });

    // Get Earnings
    builder.addCase(getEarnings.fulfilled, (state, action) => {
      state.earnings = action.payload.earnings;
    });
  },
});

export const {
  setOnlineStatus,
  setCurrentLocation,
  clearError,
  removeAvailableOrder,
  addActiveDelivery,
  updateActiveDelivery,
  removeActiveDelivery,
} = deliverySlice.actions;

// Selectors
export const selectDelivery = (state) => state.delivery;
export const selectIsOnline = (state) => state.delivery.isOnline;
export const selectAvailableOrders = (state) => state.delivery.availableOrders;
export const selectActiveDeliveries = (state) => state.delivery.activeDeliveries;
export const selectEarnings = (state) => state.delivery.earnings;

export default deliverySlice.reducer;