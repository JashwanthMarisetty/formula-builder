const mongoose = require("mongoose");

// Response Schema - Stores individual form submissions
const responseSchema = new mongoose.Schema(
  {
    // Reference to the form this response belongs to
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Form",
      required: true,
      index: true, // Index for fast lookups by form
    },

    // When the response was submitted
    submittedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },

    // The actual form data submitted by the user
    // This is a flexible object that stores field_id: value pairs
    data: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    // IP address of the person who submitted the form
    submitterIP: {
      type: String,
      default: "",
    },

    // Email of the person who submitted (optional)
    respondentEmail: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt automatically
  }
);

// INDEXES for fast queries
// 1. Main index: Get responses for a form, sorted by newest first
responseSchema.index({ formId: 1, submittedAt: -1 });

// 2. Optional: Find responses by email (useful for "my submissions" feature)
responseSchema.index({ formId: 1, respondentEmail: 1 });

const Response = mongoose.model("Response", responseSchema);

module.exports = Response;

