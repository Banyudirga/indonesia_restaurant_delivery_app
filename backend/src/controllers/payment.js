const Order = require('../models/order');
const axios = require('axios');

// Process payment
exports.processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if customer owns this order
    if (order.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check if order is pending payment
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({ error: 'Order payment already processed' });
    }

    let paymentResult;

    switch (paymentMethod) {
      case 'qris':
        paymentResult = await processQRISPayment(order, paymentDetails);
        break;
      case 'gopay':
        paymentResult = await processGopayPayment(order, paymentDetails);
        break;
      case 'ovo':
        paymentResult = await processOVOPayment(order, paymentDetails);
        break;
      case 'dana':
        paymentResult = await processDANAPayment(order, paymentDetails);
        break;
      case 'bank_transfer':
        paymentResult = await processBankTransferPayment(order, paymentDetails);
        break;
      case 'cash':
        paymentResult = await processCashPayment(order, paymentDetails);
        break;
      default:
        return res.status(400).json({ error: 'Invalid payment method' });
    }

    if (paymentResult.success) {
      order.paymentStatus = 'completed';
      order.status = 'confirmed';
      await order.save();

      // Emit real-time update
      const io = req.app.locals.io;
      io.to(`order_${orderId}`).emit('payment_completed', {
        orderId,
        paymentMethod,
        timestamp: new Date(),
      });

      // Notify restaurant
      io.to(`restaurant_${order.restaurantId}`).emit('order_confirmed', {
        orderId,
        orderNumber: order.orderNumber,
        totalAmount: order.totalAmount,
      });

      res.json({
        message: 'Payment processed successfully',
        order,
        paymentResult,
      });
    } else {
      order.paymentStatus = 'failed';
      await order.save();

      res.status(400).json({
        error: 'Payment failed',
        details: paymentResult.error,
      });
    }
  } catch (error) {
    console.error('Process payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// QRIS Payment Processing
async function processQRISPayment(order, paymentDetails) {
  try {
    // In production, integrate with actual QRIS payment gateway
    // For now, simulate payment processing
    
    const paymentData = {
      amount: order.totalAmount,
      order_id: order.orderNumber,
      customer_name: order.customerInfo.name,
      customer_phone: order.customerInfo.phone,
      qr_code: paymentDetails.qrCode,
    };

    // Simulate API call to QRIS payment gateway
    // const response = await axios.post('https://api.qris-gateway.com/payment', paymentData);
    
    // For demo purposes, simulate successful payment
    return {
      success: true,
      transaction_id: `QRIS_${Date.now()}`,
      method: 'qris',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// GoPay Payment Processing
async function processGopayPayment(order, paymentDetails) {
  try {
    // In production, integrate with GoPay API
    const paymentData = {
      amount: order.totalAmount,
      order_id: order.orderNumber,
      customer_name: order.customerInfo.name,
      customer_phone: order.customerInfo.phone,
      gopay_account: paymentDetails.gopayAccount,
    };

    // Simulate successful payment
    return {
      success: true,
      transaction_id: `GOPAY_${Date.now()}`,
      method: 'gopay',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// OVO Payment Processing
async function processOVOPayment(order, paymentDetails) {
  try {
    // In production, integrate with OVO API
    const paymentData = {
      amount: order.totalAmount,
      order_id: order.orderNumber,
      customer_name: order.customerInfo.name,
      customer_phone: order.customerInfo.phone,
      ovo_account: paymentDetails.ovoAccount,
    };

    // Simulate successful payment
    return {
      success: true,
      transaction_id: `OVO_${Date.now()}`,
      method: 'ovo',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// DANA Payment Processing
async function processDANAPayment(order, paymentDetails) {
  try {
    // In production, integrate with DANA API
    const paymentData = {
      amount: order.totalAmount,
      order_id: order.orderNumber,
      customer_name: order.customerInfo.name,
      customer_phone: order.customerInfo.phone,
      dana_account: paymentDetails.danaAccount,
    };

    // Simulate successful payment
    return {
      success: true,
      transaction_id: `DANA_${Date.now()}`,
      method: 'dana',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Bank Transfer Payment Processing
async function processBankTransferPayment(order, paymentDetails) {
  try {
    // In production, integrate with bank transfer API
    const paymentData = {
      amount: order.totalAmount,
      order_id: order.orderNumber,
      customer_name: order.customerInfo.name,
      bank_code: paymentDetails.bankCode,
      account_number: paymentDetails.accountNumber,
    };

    // Simulate successful payment
    return {
      success: true,
      transaction_id: `BANK_${Date.now()}`,
      method: 'bank_transfer',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Cash Payment Processing
async function processCashPayment(order, paymentDetails) {
  try {
    // Cash payment is handled on delivery
    return {
      success: true,
      transaction_id: `CASH_${Date.now()}`,
      method: 'cash',
      note: 'Payment will be collected on delivery',
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Get payment methods
exports.getPaymentMethods = async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'qris',
        name: 'QRIS',
        description: 'Bayar dengan QR Code',
        icon: 'qris-icon.png',
        isActive: true,
      },
      {
        id: 'gopay',
        name: 'GoPay',
        description: 'Bayar dengan GoPay',
        icon: 'gopay-icon.png',
        isActive: true,
      },
      {
        id: 'ovo',
        name: 'OVO',
        description: 'Bayar dengan OVO',
        icon: 'ovo-icon.png',
        isActive: true,
      },
      {
        id: 'dana',
        name: 'DANA',
        description: 'Bayar dengan DANA',
        icon: 'dana-icon.png',
        isActive: true,
      },
      {
        id: 'bank_transfer',
        name: 'Transfer Bank',
        description: 'Transfer melalui ATM/Mobile Banking',
        icon: 'bank-icon.png',
        isActive: true,
      },
      {
        id: 'cash',
        name: 'Bayar Tunai',
        description: 'Bayar saat makanan diantar',
        icon: 'cash-icon.png',
        isActive: true,
      },
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Verify payment status
exports.verifyPayment = async (req, res) => {
  try {
    const { orderId, transactionId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if customer owns this order
    if (order.customerId.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // In production, verify payment status with payment gateway
    // For demo purposes, return order payment status
    res.json({
      orderId,
      transactionId,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      amount: order.totalAmount,
    });
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};