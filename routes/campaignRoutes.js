const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign'); // Adjust the path if needed
const User = require('../models/User');

// Create a new campaign
router.post('/create', async (req, res) => {
  try {
    const { title, country, zipCode, description, recipient, goal, createdUsername, createdUserEmail, image } = req.body;
    const email = createdUserEmail;
    const user = await User.findOne({ email });
    const status = user && user.isAdmin ? 'Approved' : 'Pending';
    const newCampaign = new Campaign({
      title,
      country,
      zipCode,
      description,
      recipient,
      goal,
      status: status,
      amountRaised: 0,
      remainingAmount: goal,
      createdUsername,
      createdUserEmail,
      createdOn: new Date().toISOString(),
      image
    });
    await newCampaign.save();
    res.status(201).json({ message: 'Campaign submitted for review.' });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get pending campaigns
router.get('/pending', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'Pending' });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Approve a campaign
router.put('/approve/:id', async (req, res) => {
  try {
    await Campaign.findByIdAndUpdate(req.params.id, { status: 'Approved' });
    res.json({ message: 'Campaign approved.' });
  } catch (error) {
    console.error('Error approving campaign:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Reject a campaign
router.put('/reject/:id', async (req, res) => {
  try {
    await Campaign.findByIdAndUpdate(req.params.id, { status: 'Rejected' });
    res.json({ message: 'Campaign rejected.' });
  } catch (error) {
    console.error('Error rejecting campaign:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get all campaigns (approved and pending)
router.get('/all', async (req, res) => {
  try {
    const campaigns = await Campaign.find({ status: 'Approved' });
    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching all campaigns:', error);
    res.status(500).json({ message: 'Server error.' });
  }
});

// Get campaign by ID
router.get('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }
    res.json(campaign);
  } catch (error) {
    console.error('Error fetching campaign:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Donate to a campaign
// Donate to a campaign
router.post('/donate/:id', async (req, res) => {
  try {
    const { amount, donorName } = req.body;
    console.log('Received donation request:', { amount, donorName });
    const campaign = await Campaign.findById(req.params.id);

    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    if (amount <= 0 || !donorName) {
      return res.status(400).json({ message: 'Invalid donation amount or donor name.' });
    }

    if (amount > campaign.remainingAmount) {
      return res.status(400).json({
        message: `Cannot donate more than the remaining goal amount of ${campaign.remainingAmount}.`
      });
    }
    campaign.remainingAmount = Number(campaign.remainingAmount) - Number(amount);
    campaign.amountRaised = Number(campaign.amountRaised) + Number(amount);
    campaign.donations.push({ donorName, amount });

    if (campaign.amountRaised >= campaign.goal) {
      campaign.status = 'Completed'; // Mark campaign as Completed
    }

    const topDonation = Math.max(...campaign.donations.map(d => d.amount));
    const topDonor = campaign.donations.find(d => d.amount === topDonation)?.donorName || '';

    campaign.topDonor = topDonor;

    await campaign.save();

    res.json({ message: 'Donation successful', campaign, totalDonors: campaign.donations.length });
  } catch (error) {
    console.error('Error donating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/comment/:id', async (req, res) => {
  try {
    const { name, comment } = req.body;
    const createdOn = new Date(); // Set the current date as createdOn
    console.log('Received comment request:', { name, comment });

    // Find the campaign by ID
    const campaign = await Campaign.findById(req.params.id);

    // Check if the campaign exists
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Validate the comment payload
    if (!name || !comment) {
      return res.status(400).json({ message: 'Name and comment are required.' });
    }

    // Create the comment object
    const newComment = { name, createdOn, comment };

    // Push the new comment into the campaign's comments array
    campaign.comments.push(newComment);

    // Save the updated campaign
    await campaign.save();

    res.json({ message: 'Comment added successfully', comments: campaign.comments });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/comments/:id', async (req, res) => {
  try {
    // Find the campaign by ID
    const campaign = await Campaign.findById(req.params.id);
    // Check if the campaign exists
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Return the comments associated with the campaign
    res.json({ message: 'Comments retrieved successfully', comments: campaign.comments });
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
