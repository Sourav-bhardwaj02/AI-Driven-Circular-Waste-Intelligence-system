const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  routeCode: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  areas: [{
    name: String,
    coordinates: {
      type: [Number],
      required: true
    },
    estimatedTime: Number,
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    }
  }],
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  status: {
    type: String,
    enum: ['unassigned', 'assigned', 'in_progress', 'completed'],
    default: 'unassigned'
  },
  scheduledStart: Date,
  scheduledEnd: Date,
  actualStart: Date,
  actualEnd: Date,
  totalDistance: Number,
  estimatedDuration: Number,
  aiOptimized: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

routeSchema.index({ collectorId: 1, status: 1 });

module.exports = mongoose.model('Route', routeSchema);
