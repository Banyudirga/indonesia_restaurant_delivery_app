const mongoose = require('mongoose');

const toppingSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ['protein', 'vegetable', 'noodle', 'extra'],
    required: true,
  },
  isAvailable: {
    type: Boolean,
    default: true,
  },
});

const menuItemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  basePrice: {
    type: Number,
    required: true,
  },
  spiceLevels: [{
    level: {
      type: String,
      enum: ['mild', 'medium', 'spicy', 'extra_spicy'],
    },
    name: String,
    priceAdjustment: {
      type: Number,
      default: 0,
    },
  }],
  availableToppings: [toppingSchema],
  isAvailable: {
    type: Boolean,
    default: true,
  },
  imageUrl: {
    type: String,
  },
  category: {
    type: String,
    enum: ['seblak_kerupuk', 'seblak_mie', 'seblak_ceker', 'seblak_sosis', 'seblak_seafood'],
    required: true,
  },
  preparationTime: {
    type: Number, // in minutes
    default: 15,
  },
}, {
  timestamps: true,
});

const restaurantSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  address: {
    street: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    province: {
      type: String,
      required: true,
    },
    postalCode: {
      type: String,
      required: true,
    },
    coordinates: {
      latitude: {
        type: Number,
        required: true,
      },
      longitude: {
        type: Number,
        required: true,
      },
    },
  },
  phone: {
    type: String,
    required: true,
  },
  email: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  totalReviews: {
    type: Number,
    default: 0,
  },
  menu: [menuItemSchema],
  operatingHours: {
    monday: { open: String, close: String, isOpen: Boolean },
    tuesday: { open: String, close: String, isOpen: Boolean },
    wednesday: { open: String, close: String, isOpen: Boolean },
    thursday: { open: String, close: String, isOpen: Boolean },
    friday: { open: String, close: String, isOpen: Boolean },
    saturday: { open: String, close: String, isOpen: Boolean },
    sunday: { open: String, close: String, isOpen: Boolean },
  },
  deliveryRadius: {
    type: Number, // in kilometers
    default: 5,
  },
  minimumOrder: {
    type: Number,
    default: 15000, // 15k IDR
  },
  deliveryFee: {
    type: Number,
    default: 5000, // 5k IDR
  },
  imageUrl: {
    type: String,
  },
  bannerUrl: {
    type: String,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  businessLicense: {
    type: String,
  },
  averagePreparationTime: {
    type: Number,
    default: 20, // minutes
  },
}, {
  timestamps: true,
});

// Index for location-based queries
restaurantSchema.index({ 'address.coordinates': '2dsphere' });

module.exports = mongoose.model('Restaurant', restaurantSchema);