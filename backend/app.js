// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const Redis = require("ioredis");
require("dotenv").config({ override: true });

const app = express();
const PORT = process.env.PORT || 3020;

// DB Models
const FlashsaleSetup = require("./models/FlashsaleSetup");

// Redis client
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

// Lua script for guarded purchase
const luaScript = `
  local stockKey = KEYS[1]
  local buyersKey = KEYS[2]
  local user = ARGV[1]

  -- Check if user already bought
  if redis.call("SISMEMBER", buyersKey, user) == 1 then
    return 1
  end

  -- Check stock
  local stock = tonumber(redis.call("GET", stockKey))
  if not stock or stock <= 0 then
    return 2
  end

  -- Deduct stock & record buyer
  redis.call("DECR", stockKey)
  redis.call("SADD", buyersKey, user)

  return 0
`;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

// Enable requests from allowedOrigins
const allowedOrigins = ["http://localhost:5173"];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.status(200).end();
  next();
});

// MongoDB Connection
mongoose
  .connect(process.env.DB_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Helper: fetch flashsale setup
const getSaleItem = async (itemQuery = {}) => {
  try {
    return await FlashsaleSetup.findOne(itemQuery);
  } catch (err) {
    console.error("DB error", err);
    return null;
  }
};

const getStatus = (item) => {
  if (!item) return "notfound";
  const now = Date.now();
  const saleTime = new Date(item.opening).getTime();
  if (now < saleTime - item.preOpen) return "upcoming";
  if (now > saleTime + item.stoppedAt) return "ended";
  return "active";
};

// Flashsale setup API
// Use only for the test purpose, should be post endpoint -> active after flash sale setup form submitted
app.get("/flashsale-setup", async (req, res) => {
  try {
    const saleSetup = await getSaleItem();
    if (!saleSetup) return res.status(404).json({ error: "No flashsale setup" });

    const { opening, preOpen, stoppedAt, stock } = saleSetup;

    // also sync initial stock to Redis
    await redis.set("flashsale:stock", stock);
    await redis.del("flashsale:buyers");

    res.status(200).json({
      status: getStatus(saleSetup),
      opening,
      preOpen,
      stoppedAt,
      stock,
    });
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
});

// Purchase endpoint guarded with Redis
app.post("/purchase", async (req, res) => {
  const { user } = req.body;

  if (!user) {
    return res.status(400).json({ status: "notfound", message: "No user" });
  }

  try {
    const saleSetup = await getSaleItem();

    if (!saleSetup) {
      return res.status(404).json({ status: "notfound", message: "No sale setup" });
    }

    const status = getStatus(saleSetup);
    
    //  Comment this condition if you run the stress test
    if (status !== "active") {
      return res.status(400).json({ status: "inactive", message: "Flash sale not active" });
    }

    const result = await redis.eval(luaScript, 2, "flashsale:stock", "flashsale:buyers", user);

    if (result === 1) {
      return res.status(403).json({ status: "exists", message: "User already purchased" });
    } else if (result === 2) {
      return res.status(409).json({ status: "soldout", message: "Sold out" });
    }

    // Persist to Mongo
    await FlashsaleSetup.updateOne(
      { _id: saleSetup._id },
      { $inc: { stock: -1 }, $push: { buyers: user } }
    );

    return res.json({ status: "Successful", message: "Purchase successful" });
  } catch (err) {
    console.error("purchase error", err);
    return res.status(500).json({ error: "Internal Error" });
  }
});

// Check user purchase
app.get("/check/:username", async (req, res) => {
  const username = req.params.username;
  try {
    const isBuyer = await redis.sismember("flashsale:buyers", username);
    res.json({ purchased: isBuyer === 1 });
  } catch (err) {
    res.status(500).json({ error: "Redis check failed" });
  }
});

// Root
app.get("/", (req, res) => {
  res.status(200).send("Server is running!");
});

module.exports = app;