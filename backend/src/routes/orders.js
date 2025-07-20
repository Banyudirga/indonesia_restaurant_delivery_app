const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orders');
const authMiddleware = require('../middleware/auth');
const { requireRole } = require('../middleware/validation');

const router = express.Router();

// Create order
router.post('/', authMiddleware, requireRole('customer'), [
  body('restaurantId').isMongoId(),
  body('items').isArray({ min: 1 }),
  body('deliveryAddress.street').isLength({ min: 5 }),
  body('deliveryAddress.coordinates.latitude').isFloat(),
  body('deliveryAddress.coordinates.longitude').isFloat(),
  body('paymentMethod').isIn(['qris', 'gopay', 'ovo', 'dana', 'bank_transfer', 'cash']),
], orderController.createOrder);

// Get customer orders
router.get('/customer', authMiddleware, requireRole('customer'), orderController.getCustomerOrders);

// Get order by ID
router.get('/:id', authMiddleware, orderController.getOrderById);

// Update order status
router.put('/:id/status', authMiddleware, [
  body('status').isIn(['confirmed', 'preparing', 'ready_for_pickup', 'picked_up', 'on_the_way', 'delivered', 'cancelled']),
], orderController.updateOrderStatus);

// Cancel order
router.put('/:id/cancel', authMiddleware, requireRole('customer'), [
  body('reason').isLength({ min: 5 }),
], orderController.cancelOrder);

// Rate order
router.post('/:id/rate', authMiddleware, requireRole('customer'), [
  body('overall').isInt({ min: 1, max: 5 }),
  body('food').optional().isInt({ min: 1, max: 5 }),
  body('delivery').optional().isInt({ min: 1, max: 5 }),
], orderController.rateOrder);

// Get available orders (delivery partner)
router.get('/delivery/available', authMiddleware, requireRole('delivery_partner'), orderController.getAvailableOrders);

// Accept order (delivery partner)
router.post('/:id/accept', authMiddleware, requireRole('delivery_partner'), orderController.acceptOrder);

module.exports = router;