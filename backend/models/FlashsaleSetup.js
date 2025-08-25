const mongoose = require('mongoose');
const { Schema } = mongoose;

const FlashsaleSetupSchema = new mongoose.Schema({
    opening: { type: String, required: true },
    preOpen: { type: Number, required: true, min: 0 },
    stoppedAt: { type: Number, required: true, min: 0 },
    stock: { type: Number, required: true, min: 0 },
    product: [{ type: Schema.Types.ObjectId, ref: 'Product' }]
}, { timestamps: true });

module.exports = mongoose.model('flashsaleSetup', FlashsaleSetupSchema);