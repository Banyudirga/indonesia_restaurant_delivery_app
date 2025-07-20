import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  updateFCMToken: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
};

// Delivery API
export const deliveryAPI = {
  getAvailableOrders: (location) => api.get('/orders/delivery/available', { params: location }),
  acceptOrder: (orderId) => api.post(`/orders/${orderId}/accept`),
  updateOrderStatus: (orderId, status) => api.put(`/orders/${orderId}/status`, { status }),
  getActiveDeliveries: () => api.get('/delivery/active'),
  getCompletedDeliveries: (params) => api.get('/delivery/completed', { params }),
  getEarnings: (period) => api.get('/delivery/earnings', { params: { period } }),
  updateLocation: (location) => api.put('/delivery/location', location),
  setOnlineStatus: (isOnline) => api.put('/delivery/status', { isOnline }),
};

export default api;