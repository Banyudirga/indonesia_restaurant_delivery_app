const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const winston = require('winston');
const path = require('path');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurants');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const healthRoutes = require('./routes/health');

// Import middleware
const authMiddleware = require('./middleware/auth');
const { errorHandler } = require('./middleware/validation');

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = socketIo(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : "*",
    methods: ["GET", "POST"]
  }
});

// Logger setup
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'seblak-delivery-api' },
  transports: [
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/error.log'), 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: path.join(__dirname, '../logs/combined.log') 
    }),
  ],
});

// Add console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL : true,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Database connection
const connectDatabase = async () => {
  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    await mongoose.connect(process.env.DATABASE_URL, options);
    logger.info('📊 Database connected successfully');
    
    // Database event listeners
    mongoose.connection.on('error', (err) => {
      logger.error('📊 Database connection error:', err);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('📊 Database disconnected');
    });
    
  } catch (error) {
    logger.error('📊 Database connection failed:', error);
    process.exit(1);
  }
};

// Connect to database
connectDatabase();

// Make Socket.io available globally
app.locals.io = io;
app.locals.logger = logger;

// Socket.io connection handling
io.on('connection', (socket) => {
  logger.info(`🔌 Socket connected: ${socket.id}`);
  
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
    logger.info(`👥 Socket ${socket.id} joined order ${orderId}`);
  });
  
  socket.on('join_restaurant', (restaurantId) => {
    socket.join(`restaurant_${restaurantId}`);
    logger.info(`👥 Socket ${socket.id} joined restaurant ${restaurantId}`);
  });
  
  socket.on('join_delivery', (deliveryPartnerId) => {
    socket.join(`delivery_${deliveryPartnerId}`);
    logger.info(`👥 Socket ${socket.id} joined delivery ${deliveryPartnerId}`);
  });
  
  socket.on('disconnect', () => {
    logger.info(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/health', healthRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Seblak Delivery API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('💀 Process terminated');
    mongoose.connection.close();
    process.exit(0);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Seblak Delivery API server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;