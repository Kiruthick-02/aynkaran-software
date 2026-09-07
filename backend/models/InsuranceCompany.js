// backend/models/InsuranceCompany.js
const mongoose = require('mongoose');

const InsuranceCompanySchema = new mongoose.Schema({
  name: { type: String, required: true },
  registrationCode: { type: String, required: true, unique: true }, // IRDAI Reg
  type: { type: String, enum: ['Life Insurance', 'Health Insurance', 'General Insurance'], default: 'Life Insurance' },
  address: String,
  contact: String,
  status: { type: String, enum: ['Active', 'Temporarily Stopped'], default: 'Active' },
  // Listing Stop Logic (Module 4 in Desktop App)
  stopStartDate: Date,
  stopEndDate: Date,
  stopReason: String,
  websiteVisibility: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('InsuranceCompany', InsuranceCompanySchema);