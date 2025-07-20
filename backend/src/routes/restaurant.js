const express = require('express');
const { body } = require('express-validator');
const restaurantController = require('../controllers/restaurants');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/validation');

const router = express.Router();

// Get all restaurants
router.get('/', restaurantController.getRestaurants);

// Get restaurant by ID
router.get('/:id', restaurantController.getRestaurantById);

// Create restaurant (restaurant owner only)
router.post('/', authMiddleware, requireRole('restaurant_owner'), [
  body('name').isLength({ min: 2 }),
  body('address.street').isLength({ min: 5 }),
  body('address.city').isLength({ min: 2 }),
  body('address.province').isLength({ min: 2 }),
  body('address.coordinates.latitude').isFloat(),
  body('address.coordinates.longitude').isFloat(),
  body('phone').isMobilePhone('id-ID'),
], restaurantController.createRestaurant);

// Update restaurant
router.put('/:id', authMiddleware, requireRole('restaurant_owner'), [
  body('name').optional().isLength({ min: 2 }),
  body('phone').optional().isMobilePhone('id-ID'),
], restaurantController.updateRestaurant);

// Add menu item
router.post('/:id/menu', authMiddleware, requireRole('restaurant_owner'), [
  body('name').isLength({ min: 2 }),
  body('basePrice').isFloat({ min: 0 }),
  body('category').isIn(['seblak_kerupuk', 'seblak_mie', 'seblak_ceker', 'seblak_sosis', 'seblak_seafood']),
], restaurantController.addMenuItem);

// Update menu item
router.put('/:id/menu/:menuItemId', authMiddleware, requireRole('restaurant_owner'), [
  body('name').optional().isLength({ min: 2 }),
  body('basePrice').optional().isFloat({ min: 0 }),
], restaurantController.updateMenuItem);

// Delete menu item
router.delete('/:id/menu/:menuItemId', authMiddleware, requireRole('restaurant_owner'), restaurantController.deleteMenuItem);

// Get restaurant orders
router.get('/:id/orders', authMiddleware, requireRole('restaurant_owner'), restaurantController.getRestaurantOrders);

// Update order status
router.put('/:id/orders/:orderId/status', authMiddleware, requireRole('restaurant_owner'), [
  body('status').isIn(['confirmed', 'preparing', 'ready_for_pickup']),
], restaurantController.updateOrderStatus);

// Get restaurant analytics
router.get('/:id/analytics', authMiddleware, requireRole('restaurant_owner'), restaurantController.getRestaurantAnalytics);

module.exports = router;