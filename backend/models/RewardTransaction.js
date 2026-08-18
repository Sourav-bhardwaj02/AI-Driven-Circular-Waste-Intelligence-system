const mongoose = require('mongoose');

const rewardTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: ['daily_pickup', 'proper_disposal', 'weekly_report', 'route_optimization', 'bill_payment', 'mobile_recharge', 'water_bill', 'electricity_bill'],
    required: true
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'referenceModel'
  },
  referenceModel: {
    type: String,
    enum: ['WasteCollection', 'Complaint', 'Route']
  }
}, {
  timestamps: true
});

rewardTransactionSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('RewardTransaction', rewardTransactionSchema);
