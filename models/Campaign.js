// models/campaign.js

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: String,
  country: String,
  zipCode: String,
  description: String,
  recipient: String,
  goal: Number,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  amountRaised: { type: Number, default: 0 },
  topDonor: String,
  donations: [{
    donorName: String,
    amount: Number
  }],
  remainingAmount: Number,
  createdUsername: String,
  createdUserEmail: String,
  createdOn: Date
});

module.exports = mongoose.model('Campaign', campaignSchema);
