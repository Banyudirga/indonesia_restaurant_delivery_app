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

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, logout user
      AsyncStorage.removeItem('token');
      // Navigate to login screen
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
  sendOTP: (phone) => api.post('/auth/send-otp', { phone }),
  verifyOTP: (phone, otp) => api.post('/auth/verify-otp', { phone, otp }),
  updateFCMToken: (fcmToken) => api.put('/auth/fcm-token', { fcmToken }),
};

// Restaurant API
export const restaurantAPI = {
  getRestaurants: (params) => api.get('/restaurants', { params }),
  getRestaurantById: (id) => api.get(`/restaurants/${id}`),
  createRestaurant: (data) => api.post('/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/restaurants/${id}`, data),
  addMenuItem: (id, data) => api.post(`/restaurants/${id}/menu`, data),
  updateMenuItem: (id, menuItemId, data) => api.put(`/restaurants/${id}/menu/${menuItemId}`, data),
  deleteMenuItem: (id, menuItemId) => api.delete(`/restaurants/${id}/menu/${menuItemId}`),
};

// Order API
export const orderAPI = {
  createOrder: (orderData) => api.post('/orders', orderData),
  getCustomerOrders: (params) => api.get('/orders/customer', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/orders/${id}/status`, { status }),
  cancelOrder: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  rateOrder: (id, rating) => api.post(`/orders/${id}/rate`, rating),
};

// Payment API
export const paymentAPI = {
  processPayment: (paymentData) => api.post('/payments/process', paymentData),
  getPaymentMethods: () => api.get('/payments/methods'),
  verifyPayment: (orderId, transactionId) => api.get(`/payments/verify/${orderId}/${transactionId}`),
};

export default api;