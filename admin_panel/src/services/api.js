import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
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
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (userData) => api.put('/auth/profile', userData),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/admin/stats'),
  getRecentOrders: () => api.get('/admin/orders/recent'),
  getRevenueData: () => api.get('/admin/revenue'),
  getOrderStatusData: () => api.get('/admin/orders/status'),
  getTopRestaurants: () => api.get('/admin/restaurants/top'),
};

// Restaurant API
export const restaurantAPI = {
  getRestaurants: (params) => api.get('/admin/restaurants', { params }),
  getRestaurantById: (id) => api.get(`/admin/restaurants/${id}`),
  createRestaurant: (data) => api.post('/admin/restaurants', data),
  updateRestaurant: (id, data) => api.put(`/admin/restaurants/${id}`, data),
  deleteRestaurant: (id) => api.delete(`/admin/restaurants/${id}`),
  approveRestaurant: (id) => api.put(`/admin/restaurants/${id}/approve`),
  rejectRestaurant: (id) => api.put(`/admin/restaurants/${id}/reject`),
};

// Order API
export const orderAPI = {
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrderById: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.put(`/admin/orders/${id}/status`, { status }),
  assignDeliveryPartner: (id, partnerId) => api.put(`/admin/orders/${id}/assign`, { partnerId }),
};

// User API
export const userAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  suspendUser: (id) => api.put(`/admin/users/${id}/suspend`),
  unsuspendUser: (id) => api.put(`/admin/users/${id}/unsuspend`),
};

// Delivery Partner API
export const deliveryPartnerAPI = {
  getDeliveryPartners: (params) => api.get('/admin/delivery-partners', { params }),
  getDeliveryPartnerById: (id) => api.get(`/admin/delivery-partners/${id}`),
  approveDeliveryPartner: (id) => api.put(`/admin/delivery-partners/${id}/approve`),
  rejectDeliveryPartner: (id) => api.put(`/admin/delivery-partners/${id}/reject`),
  suspendDeliveryPartner: (id) => api.put(`/admin/delivery-partners/${id}/suspend`),
  unsuspendDeliveryPartner: (id) => api.put(`/admin/delivery-partners/${id}/unsuspend`),
};

// Analytics API
export const analyticsAPI = {
  getRevenueAnalytics: (params) => api.get('/admin/analytics/revenue', { params }),
  getOrderAnalytics: (params) => api.get('/admin/analytics/orders', { params }),
  getCustomerAnalytics: (params) => api.get('/admin/analytics/customers', { params }),
  getRestaurantAnalytics: (params) => api.get('/admin/analytics/restaurants', { params }),
  getDeliveryAnalytics: (params) => api.get('/admin/analytics/delivery', { params }),
};

export default api;