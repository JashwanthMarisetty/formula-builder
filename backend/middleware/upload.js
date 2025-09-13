const multer = require('multer');
const path = require('path');

// Configure storage for profile pictures
const storage = multer.diskStorage({
  // Set destination folder for uploaded files
  destination: function (req, file, cb) {
    cb(null, 'uploads/profile-pictures/');
  },
  // Set filename with timestamp to avoid conflicts
  filename: function (req, file, cb) {
    // Create unique filename: userId_timestamp.extension
    const uniqueName = req.user.id + '_' + Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

// File filter function to accept only images
const fileFilter = (req, file, cb) => {
  // Check if the file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Create multer upload middleware with configuration
const uploadProfilePicture = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB file size limit
    files: 1 // Only allow 1 file at a time
  },
  fileFilter: fileFilter
});

// Export the configured upload middleware
// .single('profilePicture') means we expect a single file with field name 'profilePicture'
module.exports = {
  uploadProfilePicture: uploadProfilePicture.single('profilePicture')
};
