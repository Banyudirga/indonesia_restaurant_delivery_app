const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  phone: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  fullName: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'delivery_partner'],
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  profileImage: {
    type: String,
  },
  address: {
    street: String,
    city: String,
    province: String,
    postalCode: String,
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  // For delivery partners
  deliveryPartnerInfo: {
    vehicleType: {
      type: String,
      enum: ['motorcycle', 'bicycle', 'car'],
    },
    vehicleNumber: String,
    licenseNumber: String,
    isActive: {
      type: Boolean,
      default: false,
    },
    currentLocation: {
      latitude: Number,
      longitude: Number,
    },
  },
  // For restaurant owners
  restaurantOwnerInfo: {
    businessLicense: String,
    taxNumber: String,
  },
  fcmToken: String,
  lastLogin: Date,
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);