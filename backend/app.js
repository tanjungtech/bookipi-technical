const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config({ override: true });

const app = express();

// Environment variables setup
const PORT = process.env.PORT || 8080;
const DB_URI = process.env.DB_URI;

// DB Models
const FlashsaleSetup = require('./models/FlashsaleSetup');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Get flashsale setup
app.get('/flashsale-setup', async (req, res) => {
  try {
    const saleSetup = await FlashsaleSetup.findOne({});
    res.status(200).json(saleSetup);
  } catch (err) {
    res.status(500).json(err);
  }
});

// GET requests to the root URL
app.get('/', (req, res) => {
  res.send('Server is running!');
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
});
