// backend/models/Company.js
const mongoose = require('mongoose');

const CompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  irdaReg: { type: String, required: true, unique: true },
  type: { type: String, enum: ['Life Insurance', 'Health Insurance', 'General Insurance'], required: true },
  address: String,
  contact: String,
  status: { type: String, enum: ['Active', 'Temporarily Stopped'], default: 'Active' },
  stopStartDate: Date,
  stopEndDate: Date,
  stopReason: String,
  policies: [{
    name: { type: String, required: true },
    premium: String,
    rate: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Company', CompanySchema);