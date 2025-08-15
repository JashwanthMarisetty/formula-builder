
const mongoose = require('mongoose');

/**
 * @description Schema for a single field within a form page.
 * This is a sub-document and does not have its own model.
 * The `_id: false` option is used because we rely on the UUID from the frontend.
 */
const FieldSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  }, // Corresponds to the frontend's uuid
  type: { 
    type: String, 
    required: [true, 'Field type is required.'] 
  },
  label: { 
    type: String, 
    default: '' 
  },
  placeholder: { 
    type: String, 
    default: '' 
  },
  required: { 
    type: Boolean, 
    default: false 
  },
  // For storing validation rules, e.g., { minLength: 5, maxLength: 100 }
  validation: { 
    type: mongoose.Schema.Types.Mixed, 
    default: {} 
  },
  // For fields like 'select', 'radio', 'checkbox'
  options: { 
    type: [String], 
    default: undefined 
  },
  // For complex fields like 'address' that have sub-fields
  subfields: { 
    type: mongoose.Schema.Types.Mixed, 
    default: undefined 
  }
}, { _id: false });


/**
 * @description Schema for a single page within a form.
 * A form can have multiple pages. This is a sub-document.
 */
const PageSchema = new mongoose.Schema({
  id: { 
    type: String, 
    required: true 
  }, // Corresponds to the frontend's uuid
  name: { 
    type: String, 
    required: [true, 'Page name is required.'] 
  },
  fields: [FieldSchema] // A page can have multiple fields 
}, { _id: false } // to prevent automatic _id generation for sub-documents . Explain this clearly 
// to the user that this is to match the frontend's uuid structure
);


/**
 * @description The main schema for a Form.
 * This is the top-level document that will be stored in its own collection.
 */
const FormSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Form name is required.'],
    trim: true 
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['private', 'public'],
    default: 'private'
  },
  // A form is composed of one or more pages
  pages: {
    type: [PageSchema], // Array of PageSchema sub-documents .
    // This allows for multiple pages in a form, each with its own fields. 
    // A new form defaults to having one empty page
    default: () => ([{ id: 'page-1', name: 'Page 1', fields: [] }])
  },
  // Link to the user who created/owns the form
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // This will store the actual submissions from users. 
  // For now, a mixed type array is flexible. It can be its own model later.
  responses: [{
    type: mongoose.Schema.Types.Mixed
  }],
}, {
  // Automatically add `createdAt` and `updatedAt` fields
  timestamps: true
});

const Form = mongoose.model('Form', FormSchema);

module.exports = Form;

