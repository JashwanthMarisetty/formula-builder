const mongoose = require("mongoose");

// Let's start with the most basic form structure
const formSchema = new mongoose.Schema({
  // Basic form information
  title: {
    type: String,
    required: [true, 'Form title is required'],
    trim: true,
    maxlength: [200, 'Form title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Form description cannot exceed 1000 characters']
  },
  
  // Who created this form?
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Form must be created by a user']
  }
  
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
