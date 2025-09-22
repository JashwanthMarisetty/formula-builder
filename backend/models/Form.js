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

    // Form status - controls whether form accepts responses
    status: {
      type: String,
      enum: {
        values: ["draft", "published", "closed"],
        message: "Status must be either draft, published, or closed",
      },
      default: "draft",
      required: true,
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
      },
    ],

    // Analytics fields
    views: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Conditional logic rules
    conditionalRules: [
      {
        id: {
          type: String,
          required: true,
        },
        triggerFieldId: {
          type: String,
          required: true,
        },
        targetFieldId: {
          type: String,
        },
        targetPageId: {
          type: String,
        },
        condition: {
          type: String,
          required: true,
          enum: [
            'is equal to',
            'is not equal to', 
            'contains',
            'does not contain',
            'starts with',
            'ends with',
            'is greater than',
            'is less than',
            'is greater than or equal to',
            'is less than or equal to',
            'is empty',
            'is not empty',
            'is selected',
            'is not selected',
            'has any value',
            'has specific value'
          ]
        },
        value: {
          type: String,
          default: ''
        },
        action: {
          type: {
            type: String,
            enum: ['show', 'hide', 'require', 'optional'],
            required: true
          }
        }
      }
    ],
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

// Create indexes for optimal query performance
// 1. Most critical index: Filter by user and sort by update time
formSchema.index({ createdBy: 1, updatedAt: -1 });

// 2. Status filtering: Filter by user, status and sort by update time  
formSchema.index({ createdBy: 1, status: 1, updatedAt: -1 });

// 3. Title search: Text search for form titles (replaces slow $regex queries)
formSchema.index({ title: 'text' });

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
