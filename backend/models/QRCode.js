const mongoose = require('mongoose');

// QR Code Schema
const qrCodeSchema = new mongoose.Schema({
  // Reference to the form
  formId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true,
    index: true
  },
  
  // Unique token for short URL
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Track how many times QR code was scanned
  scanCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Index for faster queries
qrCodeSchema.index({ formId: 1, token: 1 });

const QRCode = mongoose.model('QRCode', qrCodeSchema);

module.exports = QRCode;
