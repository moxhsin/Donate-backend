const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const port = 4000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Import routes
const authRoutes = require('./routes/authRoutes');
const campaignRoutes = require('./routes/campaignRoutes');

// Use routes
app.use('/api', authRoutes); // Ensure authRoutes is correctly imported and used
app.use('/api/campaigns', campaignRoutes); // Ensure campaignRoutes is correctly imported and used

// Connect to MongoDB
mongoose.connect('mongodb+srv://zayn88799:zayn88799@cluster0.yuanu6a.mongodb.net/donate?retryWrites=true&w=majority&appName=Cluster0', {
  // zayn88799
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
