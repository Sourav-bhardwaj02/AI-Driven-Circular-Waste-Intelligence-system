const mongoose = require('mongoose');

const grievanceSchema = new mongoose.Schema({
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: ['Overflow', 'Illegal Dumping', 'Missed Pickup', 'Hazardous', 'Wet Waste', 'Other']
  },
  location: {
    type: String,
    required: true,
    trim: true
  },
  coordinates: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  image: {
    type: String,
    default: null
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  priority: {
    type: Number,
    default: 0,
    min: 0
  },
  votedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolvedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Index for geospatial queries
grievanceSchema.index({ coordinates: '2dsphere' });

// Index for status queries
grievanceSchema.index({ status: 1 });

// Index for priority queries
grievanceSchema.index({ priority: -1 });

// Index for citizen queries
grievanceSchema.index({ citizenId: 1 });

module.exports = mongoose.model('Grievance', grievanceSchema);
