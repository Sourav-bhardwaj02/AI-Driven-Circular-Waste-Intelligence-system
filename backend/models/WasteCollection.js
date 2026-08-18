const mongoose = require('mongoose');

const wasteCollectionSchema = new mongoose.Schema({
  collectorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  area: {
    type: String,
    required: true
  },
  route: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed'],
    default: 'pending'
  },
  wasteTypes: [{
    type: {
      type: String,
      enum: ['dry', 'wet', 'hazardous'],
      required: true
    },
    amount: {
      type: Number,
      required: true
    }
  }],
  location: {
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
  completedAt: Date,
  notes: String,
  rewardPoints: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

wasteCollectionSchema.index({ location: '2dsphere' });
wasteCollectionSchema.index({ collectorId: 1, status: 1 });

module.exports = mongoose.model('WasteCollection', wasteCollectionSchema);
