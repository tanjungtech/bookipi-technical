const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlashsaleSetupSchema = new mongoose.Schema({
    opening: { type: String, required: true },
    preOpen: { type: Number, required: true, min: 0 },
    stoppedAt: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    buyers: [{ type: String, ref: 'Product', unique: true }]
}, { timestamps: true });

module.exports = mongoose.model('flashsaleSetup', FlashsaleSetupSchema);