const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const qrController = require('../Controllers/qrController');

const { generateQRCode, getQRData, handleQRRedirect } = qrController;

// Protected routes - require authentication
router.post('/forms/:id/qr', auth, generateQRCode);
router.get('/forms/:id/qr', auth, getQRData);

// Public route - no authentication required
router.get('/:token', handleQRRedirect);

module.exports = router;
