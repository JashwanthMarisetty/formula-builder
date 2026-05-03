const axios = require("axios");
const crypto = require("crypto");

/**
 * AI Form Generator — Groq API (Llama 3.3 70B)
 *
 * Converts natural language descriptions into complete form structures
 * matching the Form model schema (pages → fields).
 *
 * Why Groq:
 *  - 14,400 free requests/day (vs Gemini's 1,500)
 *  - ~1-2 second response time (fastest inference available)
 *  - OpenAI-compatible API
 *  - No credit card required
 *
 * Setup: Add GROQ_API_KEY to your .env file
 * Get key: https://console.groq.com (free, instant)
 */

const ALLOWED_TYPES = [
  "text", "email", "number", "textarea", "select",
  "radio", "checkbox", "date", "time", "file",
  "phone", "rating", "address", "location",
];

const GROQ_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

/**
 * Build the system + user prompt for Groq (Llama 3.3 70B)
 * Using chat format for better instruction-following and JSON reliability
 */
function buildPrompt(userDescription) {
  return {
    system: `You are a form builder AI. Your ONLY job is to output valid JSON form structures.
NEVER output markdown, code fences, explanations, or any text outside the JSON.
Use ONLY these field types: ${ALLOWED_TYPES.join(", ")}.
For "select", "radio", "checkbox" fields always include an "options" array of strings.
For all other types do NOT include "options".
Mark important fields as "required": true.
Split into logical pages if the form has 6+ fields, otherwise use one page.
Give each page a meaningful name like "Personal Info" or "Preferences".
Keep field labels clear and professional.`,
    user: `Generate a JSON form for: "${userDescription}"

Return ONLY this JSON structure, nothing else:
{
  "title": "Form Title",
  "pages": [
    {
      "name": "Page Name",
      "fields": [
        {
          "type": "text",
          "label": "Field Label",
          "required": true,
          "placeholder": "Optional placeholder"
        }
      ]
    }
  ]
}`
  };
}

/**
 * Call Groq API (OpenAI-compatible)
 * Model: llama-3.3-70b-versatile — fast, capable, excellent at JSON
 */
async function callGroq(prompt) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY not configured");
  }

  try {
    const response = await axios.post(
      GROQ_API_URL,
      {
        model: GROQ_MODEL,
        messages: [
          { role: "system", content: prompt.system },
          { role: "user",   content: prompt.user },
        ],
        temperature: 0.4,       // Lower = more deterministic JSON
        max_tokens: 2048,
        response_format: { type: "json_object" }, // Force pure JSON output
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 15000,
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error("Empty response from Groq");
    }
    return text;
  } catch (err) {
    if (err.response?.status === 401) {
      throw new Error("GROQ_API_KEY is invalid or expired");
    }
    if (err.response?.status === 429) {
      throw new Error("Groq rate limit reached. Please wait a moment and try again.");
    }
    if (err.response?.status === 503 || err.code === "ECONNABORTED") {
      throw new Error("Groq service is temporarily unavailable. Please try again.");
    }
    throw err;
  }
}

/**
 * Parse and clean JSON from Gemini response
 * Gemini sometimes wraps JSON in markdown code fences
 */
function parseAIResponse(rawText) {
  // Remove markdown code fences if present
  let cleaned = rawText.trim();
  cleaned = cleaned.replace(/^```json\s*/i, "").replace(/^```\s*/i, "");
  cleaned = cleaned.replace(/\s*```$/i, "");
  cleaned = cleaned.trim();

  return JSON.parse(cleaned);
}

/**
 * Generate unique IDs for pages and fields
 */
function generateId() {
  return crypto.randomBytes(8).toString("hex");
}

/**
 * Validate and sanitize the AI-generated form structure
 * Ensures it matches our Form model schema
 */
function validateAndSanitize(formData) {
  const errors = [];

  // Validate title
  if (!formData.title || typeof formData.title !== "string") {
    errors.push("Missing or invalid title");
  }

  // Validate pages
  if (!Array.isArray(formData.pages) || formData.pages.length === 0) {
    errors.push("Missing or empty pages array");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid AI response: ${errors.join(", ")}`);
  }

  // Sanitize pages and fields
  const sanitizedPages = formData.pages.map((page, pageIndex) => {
    const pageId = generateId();
    const pageName = page.name || `Page ${pageIndex + 1}`;

    const sanitizedFields = (page.fields || [])
      .filter((field) => {
        // Only allow valid field types
        if (!ALLOWED_TYPES.includes(field.type)) {
          console.warn(`AI generated invalid type "${field.type}", skipping`);
          return false;
        }
        if (!field.label || typeof field.label !== "string") {
          return false;
        }
        return true;
      })
      .map((field) => {
        const sanitized = {
          id: generateId(),
          type: field.type,
          label: field.label.trim(),
          placeholder: field.placeholder || "",
          required: field.required === true,
        };

        // Only include options for fields that need them
        if (["select", "radio", "checkbox"].includes(field.type)) {
          sanitized.options = Array.isArray(field.options)
            ? field.options.filter((o) => typeof o === "string" && o.trim())
            : [];
        }

        return sanitized;
      });

    return {
      id: pageId,
      name: pageName,
      fields: sanitizedFields,
    };
  });

  // Remove empty pages
  const validPages = sanitizedPages.filter((p) => p.fields.length > 0);

  if (validPages.length === 0) {
    throw new Error("AI generated no valid fields");
  }

  return {
    title: formData.title.trim().substring(0, 200),
    pages: validPages,
  };
}

/**
 * Main function: Generate a form from a natural language description
 * @param {string} description - User's form description
 * @returns {Object} - Validated form structure { title, pages }
 */
async function generateForm(description) {
  // 1) Build prompt (system + user messages for chat format)
  const prompt = buildPrompt(description);

  // 2) Call Groq API
  const rawResponse = await callGroq(prompt);

  // 3) Parse JSON from AI response
  const parsed = parseAIResponse(rawResponse);

  // 4) Validate and sanitize (treat AI output as untrusted input)
  const form = validateAndSanitize(parsed);

  return form;
}

module.exports = { generateForm };
