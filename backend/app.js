const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

require('dotenv').config({ override: true });

const app = express();

const DB_URI = process.env.DB_URI;

// DB Models
const FlashsaleSetup = require('./models/FlashsaleSetup');

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded());

// parse application/json
app.use(bodyParser.json());

// Enable requests from allowedOrigins (localhost frontend client in this case)

const allowedOrigins = ['http://localhost:5173'];

app.use((req, res, next) => {

  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();

});

// MongoDB Connection
mongoose.connect(process.env.DB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const getSaleItem = async (raw=true, itemQuery) => {
  try {
    const setupQuery = raw ? {} : itemQuery;
    const saleSetup = await FlashsaleSetup.findOne(setupQuery);
    return saleSetup;
  } catch (err) {
    console.log('error', err);
    res.status(500).json({error: "Database connection failed"});
  }
};

const getStatus = (item) => {
  if (!item) {
    return "item cannot be found";
  }
  const now = new Date();
  const saleTime = new Date(item.opening);
  if (now.getTime() < (saleTime.getTime() - item.preOpen)) return "upcoming";
  if (now.getTime() > (saleTime.getTime() + item.stoppedAt)) return "ended";
  return "active";
};

// Get flashsale setup api
app.get('/flashsale-setup', async (req, res) => {
  try {
    const saleSetup = await getSaleItem();
    const { opening, preOpen, stoppedAt, stock } = saleSetup;
    res.status(200).json({ status: getStatus(saleSetup), opening, preOpen, stoppedAt, stock });
  } catch (err) {
    res.status(500).json({error: "Database connection failed"});
  }
});

app.post("/purchase", async (req, res) => {
  const { user } = req.body;

  try {
    const saleSetup = await getSaleItem();
    const status = getStatus(saleSetup);
    if (status !== "active") {
      return res.status(400).json({ status: "inactive", message: "Flash Sale is not active" });
    }
    // Connect to DB and retrieve if user has purchased the item
    if (saleSetup.buyers.includes(user)) {
      return res.status(400).json({ status: "exists", message: "User already purchased" });
    }
    if (saleSetup.stock <= 0) {
      return res.status(400).json({ status: "soldout", message: "Sold out" });
    }

    // Update the stock data -> set stock -= 1 and add new item to buyers array column
    await FlashsaleSetup.updateOne({ _id: saleSetup._id }, {
      $inc: { stock: -1 },
      $push: { buyers: user }
    });
  
    return res.json({ message: "Purchase successful" });

  } catch (err) {
    res.status(500).json({error: "Internal Error. Cannot process purchase."});
  }

});

app.get("/check/:username", (req, res) => {
  const user = req.params.user;
  const checkUserPurchase = getSaleItem({username: user});
  res.json({ purchased: checkUserPurchase.length > 0 });
});

// GET requests to the root URL
app.get('/', (req, res) => {
  res.status(200).send('Server is running!');
});

module.exports = app;
