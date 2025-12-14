const QRCode = require('../models/QRCode');
const Form = require('../models/Form');
const crypto = require('crypto');

/**
 * Generate a unique random token for QR code
 * @returns {string} 8-character alphanumeric token
 */
function generateToken() {
  // Generate random bytes and convert to base64, then make URL-safe
  return crypto
    .randomBytes(6)
    .toString('base64')
    .replace(/\+/g, '0')
    .replace(/\//g, '1')
    .substring(0, 8);
}

/**
 * Generate QR Code for a form
 * POST /api/forms/:id/qr
 */
const generateQRCode = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if form exists
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // 2. Check if user owns the form
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only generate QR codes for your own forms.'
      });
    }

    // 3. Check if QR code already exists for this form
    let qrCode = await QRCode.findOne({ formId: id });


    if (qrCode) {
      // QR code already exists, return existing data
      return res.status(200).json({
        success: true,
        message: 'QR code already exists',
        data: {
          token: qrCode.token,
          shortUrl: `/q/${qrCode.token}`,
          scanCount: qrCode.scanCount,
          createdAt: qrCode.createdAt
        }
      });
    }

    // 4. Generate unique token
    let token = generateToken();
    
    // Ensure token is unique (rare case of collision)
    while (await QRCode.findOne({ token })) {
      token = generateToken();
    }

    // 5. Create new QR code record
    qrCode = new QRCode({
      formId: id,
      token: token,
      scanCount: 0
    });

    await qrCode.save();

    // 6. Return success response
    res.status(201).json({
      success: true,
      message: 'QR code generated successfully',
      data: {
        token: qrCode.token,
        shortUrl: `/q/${qrCode.token}`,
        scanCount: qrCode.scanCount,
        createdAt: qrCode.createdAt
      }
    });

  } catch (error) {
    console.error('Error generating QR code:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get QR Code data for a form
 * GET /api/forms/:id/qr
 */
const getQRData = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Check if form exists
    const form = await Form.findById(id);
    if (!form) {
      return res.status(404).json({
        success: false,
        message: 'Form not found'
      });
    }

    // 2. Check if user owns the form
    if (form.createdBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // 3. Find QR code
    const qrCode = await QRCode.findOne({ formId: id });

    if (!qrCode) {
      return res.status(404).json({
        success: false,
        message: 'QR code not found. Please generate one first.'
      });
    }

    // 4. Return QR data
    res.status(200).json({
      success: true,
      data: {
        token: qrCode.token,
        shortUrl: `/q/${qrCode.token}`,
        scanCount: qrCode.scanCount,
        createdAt: qrCode.createdAt,
        updatedAt: qrCode.updatedAt
      }
    });

  } catch (error) {
    console.error('Error getting QR data:', error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid form ID format'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Handle QR Code redirect (public endpoint)
 * GET /q/:token
 */
const handleQRRedirect = async (req, res) => {
  try {
    const { token } = req.params;

    // 1. Find QR code by token
    const qrCode = await QRCode.findOne({ token });

    if (!qrCode) {
      // Token not found
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Invalid QR Code</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Invalid QR Code</h1>
          <p>This QR code is not valid or has been deleted.</p>
        </body>
        </html>
      `);
    }

    // 2. Check if form still exists
    const form = await Form.findById(qrCode.formId);

    if (!form) {
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Form Not Found</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            h1 { color: #e74c3c; }
          </style>
        </head>
        <body>
          <h1>Form Not Found</h1>
          <p>The form associated with this QR code no longer exists.</p>
        </body>
        </html>
      `);
    }

    // 3. Increment scan count (fire and forget, don't block redirect)
    QRCode.findByIdAndUpdate(qrCode._id, {
      $inc: { scanCount: 1 }
    }).catch(err => console.error('Error updating scan count:', err));

    // 4. Redirect to frontend form page
    const frontendUrl = process.env.CORS_ORIGIN || 'http://localhost:5173';
    const formUrl = `${frontendUrl}/form/${qrCode.formId}`;
    res.redirect(formUrl);

  } catch (error) {
    console.error('Error handling QR redirect:', error);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          h1 { color: #e74c3c; }
        </style>
      </head>
      <body>
        <h1>Something went wrong</h1>
        <p>Please try again later.</p>
      </body>
      </html>
    `);
  }
};

module.exports = {
  generateQRCode,
  getQRData,
  handleQRRedirect
};
