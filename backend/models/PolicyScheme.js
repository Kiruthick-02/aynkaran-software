// backend/models/PolicyScheme.js
const mongoose = require('mongoose');

const PolicySchemeSchema = new mongoose.Schema({
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'InsuranceCompany', required: true },
  name: { type: String, required: true },
  premiumAmount: String, // String to handle formatting like ₹18,500
  adjustmentRate: String, // e.g. "2.5%"
  category: String, // LIFE, HEALTH, etc. (Matches Public Website Category)
  description: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('PolicyScheme', PolicySchemeSchema);