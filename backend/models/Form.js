const mongoose = require("mongoose");

// Let's start with the most basic form structure
const formSchema = new mongoose.Schema(
  {
    // Basic form information
    title: {
      type: String,
      required: [true, "Form title is required"],
      trim: true,
      maxlength: [200, "Form title cannot exceed 200 characters"],
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
  },
  {
    timestamps: true, // This automatically adds createdAt and updatedAt
  }
);

const Form = mongoose.model("Form", formSchema);

module.exports = Form;
