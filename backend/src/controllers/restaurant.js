const Restaurant = require('../models/restaurant');
const Order = require('../models/order');
const { validationResult } = require('express-validator');

// Get all restaurants with location-based filtering
exports.getRestaurants = async (req, res) => {
  try {
    const { latitude, longitude, radius = 10, page = 1, limit = 10 } = req.query;

    let query = { isActive: true };
    
    // Location-based filtering
    if (latitude && longitude) {
      query['address.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          $maxDistance: parseFloat(radius) * 1000, // Convert km to meters
        },
      };
    }

    const restaurants = await Restaurant.find(query)
      .populate('ownerId', 'fullName email phone')
      .sort({ rating: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    console.error('Get restaurants error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get restaurant by ID
exports.getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;

    const restaurant = await Restaurant.findById(id)
      .populate('ownerId', 'fullName email phone');

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }

    res.json({ restaurant });
  } catch (error) {
    console.error('Get restaurant by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create new restaurant (restaurant owner only)
exports.createRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const restaurantData = {
      ...req.body,
      ownerId: req.user.userId,
    };

    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();

    res.status(201).json({
      message: 'Restaurant created successfully',
      restaurant,
    });
  } catch (error) {
    console.error('Create restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update restaurant (owner only)
exports.updateRestaurant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;

    const restaurant = await Restaurant.findOneAndUpdate(
      { _id: id, ownerId: req.user.userId },
      req.body,
      { new: true }
    );

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    res.json({
      message: 'Restaurant updated successfully',
      restaurant,
    });
  } catch (error) {
    console.error('Update restaurant error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Add menu item to restaurant
exports.addMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const menuItem = req.body;

    const restaurant = await Restaurant.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    restaurant.menu.push(menuItem);
    await restaurant.save();

    res.status(201).json({
      message: 'Menu item added successfully',
      menuItem: restaurant.menu[restaurant.menu.length - 1],
    });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update menu item
exports.updateMenuItem = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id, menuItemId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    const menuItem = restaurant.menu.id(menuItemId);
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    Object.assign(menuItem, req.body);
    await restaurant.save();

    res.json({
      message: 'Menu item updated successfully',
      menuItem,
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete menu item
exports.deleteMenuItem = async (req, res) => {
  try {
    const { id, menuItemId } = req.params;

    const restaurant = await Restaurant.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    restaurant.menu.pull(menuItemId);
    await restaurant.save();

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get restaurant orders (owner only)
exports.getRestaurantOrders = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, page = 1, limit = 10 } = req.query;

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    let query = { restaurantId: id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('customerId', 'fullName phone')
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
    console.error('Get restaurant orders error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update order status (restaurant owner only)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id, orderId } = req.params;
    const { status } = req.body;

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    const order = await Order.findOneAndUpdate(
      { _id: orderId, restaurantId: id },
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Emit real-time update
    const io = req.app.locals.io;
    io.to(`order_${orderId}`).emit('order_status_updated', {
      orderId,
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

// Get restaurant analytics
exports.getRestaurantAnalytics = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    // Verify restaurant ownership
    const restaurant = await Restaurant.findOne({
      _id: id,
      ownerId: req.user.userId,
    });

    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found or access denied' });
    }

    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const orders = await Order.find({
      restaurantId: id,
      ...dateFilter,
    });

    const analytics = {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, order) => sum + order.totalAmount, 0) / orders.length : 0,
      ordersByStatus: orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {}),
      popularItems: {}, // You can implement this based on order items
      averageRating: restaurant.rating,
      totalReviews: restaurant.totalReviews,
    };

    res.json({ analytics });
  } catch (error) {
    console.error('Get restaurant analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};