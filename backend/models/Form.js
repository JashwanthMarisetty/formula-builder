const mongoose = require("mongoose");

// Let's start with the most basic form structure
const formSchema = new mongoose.Schema(
  {
    // Basic form information
    title: {
      type: String,
      required: [true, "Form title is required"],
      trim: true,
      minlength: [1, "Form title cannot be empty"],
      maxlength: [200, "Form title cannot exceed 200 characters"],
      validate: {
        validator: function(v) {
          return v && v.trim().length > 0;
        },
        message: "Form title cannot be empty or just whitespace"
      }
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Form must be created by a user"],
    },

    // Multi-page structure for forms
    pages: [
      {
        id: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
          default: 'Page 1'
        },
        fields: [
          {
            id: {
              type: String,
              required: true,
            },
            type: {
              type: String,
              enum: [
                "text",
                "email",
                "number",
                "textarea",
                "select",
                "radio",
                "checkbox",
                "date",
                "time",
                "file",
                "phone",
                "rating",
                "address",
              ],
              required: true,
            },
            label: {
              type: String,
              required: true,
              trim: true,
            },
            placeholder: {
              type: String,
              default: "",
            },
            required: {
              type: Boolean,
              default: false,
            },
            options: [
              {
                type: String,
              },
            ],
          },
        ]
      }
    ],

    // Legacy fields array for backwards compatibility
    fields: [
      {
        id: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          enum: [
            "text",
            "email",
            "number",
            "textarea",
            "select",
            "radio",
            "checkbox",
            "date",
            "time",
            "file",
            "phone",
            "rating",
            "address",
          ],
          required: true,
        },
        label: {
          type: String,
          required: true,
          trim: true,
        },
        placeholder: {
          type: String,
          default: "",
        },
        required: {
          type: Boolean,
          default: false,
        },
        options: [
          {
            type: String,
          },
        ],
      },
    ],

    // Array of form responses/submissions
    responses: [
      {
        id: {
          type: String,
          required: true,
        },
        submittedAt: {
          type: Date,
          default: Date.now,
          required: true,
        },
        data: {
          type: mongoose.Schema.Types.Mixed,
          required: true,
        },
        submitterIP: {
          type: String,
          default: "",
        },
        respondentEmail: {
          type: String,
          default: "",
        },
      },
    ],

    // Email confirmation settings
    collectRespondentEmail: {
      type: Boolean,
      default: true,
    },

    // Analytics fields
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Location for organizing forms (inbox, trash, archive)
    location: {
      type: String,
      enum: ['inbox', 'trash', 'archive'],
      default: 'inbox',
      required: true,
    },
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

// Create indexes for optimal query performance
// 1. Most critical index: Filter by user and sort by update time
formSchema.index({ createdBy: 1, updatedAt: -1 });

// 2. Title search: Text search for form titles (replaces slow $regex queries)
formSchema.index({ title: 'text' });

// 3. Location filtering
formSchema.index({ createdBy: 1, location: 1, updatedAt: -1 });

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
