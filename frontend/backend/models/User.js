const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'citizen', 'collector'],
    required: true
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    address: String
  },
  rewardPoints: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: [0, 0]
    }
  },
  assignedRoute: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Route'
  }
}, {
  timestamps: true
});

userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema);
