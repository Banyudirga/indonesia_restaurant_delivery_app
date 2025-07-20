const Order = require('../models/order');
const Restaurant = require('../models/restaurant');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Create new order
exports.createOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      restaurantId,
      items,
      deliveryAddress,
      paymentMethod,
      specialInstructions,
      promoCode,
    } = req.body;

    // Get restaurant details
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || !restaurant.isActive) {
      return res.status(404).json({ error: 'Restaurant not found or inactive' });
    }

    // Get customer details
    const customer = await User.findById(req.user.userId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Calculate order totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = restaurant.menu.id(item.menuItemId);
      if (!menuItem || !menuItem.isAvailable) {
        return res.status(400).json({ 
          error: `Menu item ${item.menuItemId} not found or unavailable` 
        });
      }

      let itemPrice = menuItem.basePrice;
      
      // Add spice level price adjustment
      const spiceLevel = menuItem.spiceLevels.find(level => level.level === item.spiceLevel);
      if (spiceLevel) {
        itemPrice += spiceLevel.priceAdjustment;
      }

      // Calculate toppings price
      const orderToppings = [];
      if (item.toppings && item.toppings.length > 0) {
        for (const topping of item.toppings) {
          const availableTopping = menuItem.availableToppings.id(topping.toppingId);
          if (availableTopping && availableTopping.isAvailable) {
            orderToppings.push({
              toppingId: topping.toppingId,
              name: availableTopping.name,
              quantity: topping.quantity,
              unitPrice: availableTopping.price,
            });
            itemPrice += availableTopping.price * topping.quantity;
          }
        }
      }

      const orderItem = {
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        unitPrice: itemPrice,
        spiceLevel: item.spiceLevel,
        toppings: orderToppings,
        specialInstructions: item.specialInstructions,
      };

      orderItems.push(orderItem);
      subtotal += itemPrice * item.quantity;
    }

    // Check minimum order amount
    if (subtotal < restaurant.minimumOrder) {
      return res.status(400).json({
        error: `Minimum order amount is Rp ${restaurant.minimumOrder.toLocaleString()}`,
      });
    }

    // Calculate delivery fee
    const deliveryFee = restaurant.deliveryFee;
    const tax = subtotal * 0.1; // 10% tax
    let discount = 0;

    // Apply promo code if provided
    if (promoCode) {
      // Implement promo code logic here
      // For now, just a simple 10% discount
      if (promoCode === 'SEBLAK10') {
        discount = subtotal * 0.1;
      }
    }

    const totalAmount = subtotal + deliveryFee + tax - discount;

    // Calculate estimated delivery time
    const estimatedDeliveryTime = new Date();
    estimatedDeliveryTime.setMinutes(
      estimatedDeliveryTime.getMinutes() + restaurant.averagePreparationTime + 30
    );

    // Create order
    const order = new Order({
      customerId: req.user.userId,
      restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      discount,
      totalAmount,
      deliveryAddress,
      customerInfo: {
        name: customer.fullName,
        phone: customer.phone,
      },
      paymentMethod,
      specialInstructions,
      promoCode,
      estimatedDeliveryTime,
    });

    await order.save();

    // Emit real-time notification to restaurant
    const io = req.app.locals.io;
    io.to(`restaurant_${restaurantId}`).emit('new_order', {
      orderId: order._id,
      orderNumber: order.orderNumber,
      customerName: customer.fullName,
      totalAmount,
      items: orderItems.length,
    });

    res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get customer orders
exports.getCustomerOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    let query = { customerId: req.user.userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('deliveryPartnerId', 'fullName phone')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get customer orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get order by ID
exports.getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id)
      .populate('customerId', 'fullName phone email')
      .populate('restaurantId', 'name address phone imageUrl')
      .populate('deliveryPartnerId', 'fullName phone');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user has access to this order
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (
      order.customerId._id.toString() !== userId &&
      (order.deliveryPartnerId && order.deliveryPartnerId._id.toString() !== userId) &&
      userRole !== 'admin'
    ) {
      // Check if user is the restaurant owner
      const restaurant = await Restaurant.findOne({
        _id: order.restaurantId._id,
        ownerId: userId,
      });

      if (!restaurant) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update order status
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check authorization based on user role
    const userId = req.user.userId;
    const userRole = req.user.role;

    if (userRole === 'restaurant_owner') {
      // Restaurant owner can update to preparing, ready_for_pickup
      const restaurant = await Restaurant.findOne({
        _id: order.restaurantId,
        ownerId: userId,
      });

      if (!restaurant) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const allowedStatuses = ['confirmed', 'preparing', 'ready_for_pickup'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status for restaurant owner' });
      }
    } else if (userRole === 'delivery_partner') {
      // Delivery partner can update to picked_up, on_the_way, delivered
      if (order.deliveryPartnerId && order.deliveryPartnerId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const allowedStatuses = ['picked_up', 'on_the_way', 'delivered'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ error: 'Invalid status for delivery partner' });
      }

      if (status === 'delivered') {
        order.actualDeliveryTime = new Date();
      }
    } else if (userRole === 'customer') {
      // Customer can only cancel orders
      if (order.customerId.toString() !== userId) {
        return res.status(403).json({ error: 'Access denied' });
      }

      if (status !== 'cancelled') {
        return res.status(400).json({ error: 'Customers can only cancel orders' });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
      }
    }

    order.status = status;
    await order.save();

    // Emit real-time update to all parties
    const io = req.app.locals.io;
    io.to(`order_${id}`).emit('order_status_updated', {
      orderId: id,
      status,
      timestamp: new Date(),
    });

    res.json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel order
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if customer owns this order
    if (order.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order can be cancelled
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({ error: 'Order cannot be cancelled at this stage' });
    }

    order.status = 'cancelled';
    order.cancellationReason = reason;
    await order.save();

    // Emit real-time update
    const io = req.app.locals.io;
    io.to(`order_${id}`).emit('order_cancelled', {
      orderId: id,
      reason,
      timestamp: new Date(),
    });

    // Notify restaurant
    io.to(`restaurant_${order.restaurantId}`).emit('order_cancelled', {
      orderId: id,
      orderNumber: order.orderNumber,
      reason,
    });

    res.json({
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Rate order
exports.rateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { food, delivery, overall, comment } = req.body;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if customer owns this order
    if (order.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({ error: 'Order must be delivered to rate' });
    }

    // Check if already rated
    if (order.rating.overall) {
      return res.status(400).json({ error: 'Order already rated' });
    }

    order.rating = {
      food: food || overall,
      delivery: delivery || overall,
      overall,
      comment,
    };

    await order.save();

    // Update restaurant rating
    const restaurant = await Restaurant.findById(order.restaurantId);
    if (restaurant) {
      const orders = await Order.find({
        restaurantId: order.restaurantId,
        'rating.overall': { $exists: true },
      });

      const totalRating = orders.reduce((sum, order) => sum + order.rating.overall, 0);
      restaurant.rating = totalRating / orders.length;
      restaurant.totalReviews = orders.length;
      await restaurant.save();
    }

    res.json({
      message: 'Order rated successfully',
      order,
    });
  } catch (error) {
    console.error('Rate order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get available orders for delivery partners
exports.getAvailableOrders = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10 } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Location coordinates required' });
    }

    const orders = await Order.find({
      status: 'ready_for_pickup',
      deliveryPartnerId: { $exists: false },
    })
      .populate('restaurantId', 'name address phone')
      .populate('customerId', 'fullName phone')
      .sort({ createdAt: 1 })
      .limit(20);

    // Filter orders by delivery partner's location
    const nearbyOrders = orders.filter(order => {
      const restaurant = order.restaurantId;
      if (!restaurant.address.coordinates) return false;

      const distance = calculateDistance(
        parseFloat(latitude),
        parseFloat(longitude),
        restaurant.address.coordinates.latitude,
        restaurant.address.coordinates.longitude
      );

      return distance <= parseFloat(radius);
    });

    res.json({ orders: nearbyOrders });
  } catch (error) {
    console.error('Get available orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Accept order by delivery partner
exports.acceptOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if order is available for pickup
    if (order.status !== 'ready_for_pickup' || order.deliveryPartnerId) {
      return res.status(400).json({ error: 'Order not available for pickup' });
    }

    // Check if delivery partner is active
    const deliveryPartner = await User.findById(req.user.userId);
    if (!deliveryPartner.deliveryPartnerInfo.isActive) {
      return res.status(400).json({ error: 'Delivery partner not active' });
    }

    order.deliveryPartnerId = req.user.userId;
    order.status = 'assigned';
    await order.save();

    // Emit real-time update
    const io = req.app.locals.io;
    io.to(`order_${id}`).emit('order_assigned', {
      orderId: id,
      deliveryPartner: {
        name: deliveryPartner.fullName,
        phone: deliveryPartner.phone,
      },
      timestamp: new Date(),
    });

    res.json({
      message: 'Order accepted successfully',
      order,
    });
  } catch (error) {
    console.error('Accept order error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in km
  return d;
}