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

// Update campaign
router.put('/update/:id', async (req, res) => {
  const { title, country, zipCode, description, recipient, goal } = req.body;

  try {
    // Find the existing campaign
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Check if the new goal is less than the amount raised
    if (goal < campaign.amountRaised) {
      return res.status(400).json({ message: 'Goal cannot be less than amount raised' });
    }

    // Update only allowed fields
    campaign.title = title;
    campaign.country = country;
    campaign.zipCode = zipCode;
    campaign.description = description;
    campaign.recipient = recipient;
    campaign.goal = goal;

    // Save updated campaign to the database
    await campaign.save();

    res.json({ message: 'Campaign updated successfully', campaign });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ message: 'Server error' });
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

// Get campaigns based on recipient type
router.get('/filtered', async (req, res) => {
  const { recipientType } = req.query; // Get the recipient type from the query parameters

  try {
    // Validate recipientType
    if (!recipientType || !['Medical', 'Education'].includes(recipientType)) {
      return res.status(400).json({ message: 'Invalid recipient type. Must be "Medical" or "Education".' });
    }

    // Find campaigns with the specified recipient type and status (Approved or Pending)
    const campaigns = await Campaign.find({
      recipient: recipientType,
      status: { $in: ['Approved', 'Pending'] } // Only Approved and Pending statuses
    });

    res.json(campaigns);
  } catch (error) {
    console.error('Error fetching filtered campaigns:', error);
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
router.post('/donate/:id', async (req, res) => {
  try {
    const { amount, donorName, tip } = req.body;
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
    campaign.donations.push({ donorName, amount , tip });

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

router.post('/updates/:id', async (req, res) => {
  try {
    const { images, update } = req.body;
    const createdOn = new Date(); // Set the current date as createdOn

    // Find the campaign by ID
    const campaign = await Campaign.findById(req.params.id);

    // Check if the campaign exists
    if (!campaign) {
      return res.status(404).json({ message: 'Campaign not found' });
    }

    // Validate the comment payload
    if (!update) {
      return res.status(400).json({ message: 'Update is are required.' });
    }

    // Create the comment object
    const newUpdate = { images, createdOn, update };

    // Push the new comment into the campaign's comments array
    campaign.updates.push(newUpdate);

    // Save the updated campaign
    await campaign.save();

    res.json({ message: 'Update added successfully', updtes: campaign.comments });
  } catch (error) {
    console.error('Error adding update:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
