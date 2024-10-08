// models/campaign.js

const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
  title: String,
  country: String,
  zipCode: String,
  description: String,
  updates:[],
  recipient: { 
    type: String, 
    enum: ['Medical', 'Education'], // Dropdown options
    required: true // Optional: make this field required
  },
  goal: Number,
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Completed'], default: 'Pending' },
  amountRaised: { type: Number, default: 0 },
  topDonor: String,
  donations: [{
    donorName: String,
    amount: Number,
    tip: Number
  }],
  remainingAmount: Number,
  createdUsername: String,
  createdUserEmail: String,
  createdOn: { type: Date, default: Date.now }, // Optional: set default to now
  comments: [
    {
      name: String,
      createdOn: { type: Date, default: Date.now }, // Optional: set default to now
      comment: String
    }
  ],
  image: String
});

module.exports = mongoose.model('Campaign', campaignSchema);