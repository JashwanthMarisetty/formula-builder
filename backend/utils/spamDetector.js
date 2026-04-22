const axios = require("axios");

/**
 * Spam & Toxicity Detector — HuggingFace Inference API
 *
 * Uses the unitary/toxic-bert model (pre-trained BERT model)
 * to detect toxicity, insults, obscenity, and hate speech
 * in form submissions.
 *
 * How it works:
 *   Text → HuggingFace API → toxic-bert model → Classification scores
 *
 * The model returns scores for these labels:
 *   - toxic, severe_toxic, obscene, threat, insult, identity_hate
 *
 * Setup: Add HUGGINGFACE_API_KEY to your .env file
 * Get key: https://huggingface.co/settings/tokens (free)
 */

const HF_MODEL = "unitary/toxic-bert";
const HF_API_URL = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

/**
 * Call HuggingFace Inference API with the toxic-bert model
 * @param {string} text - Text to analyze
 * @returns {Object|null} - Label scores or null on failure
 */
async function classifyText(text) {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await axios.post(
      HF_API_URL,
      { inputs: text },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 5000, // 5 second timeout — don't slow down submission
      }
    );

    // HuggingFace returns: [[{ label, score }, { label, score }, ...]]
    const results = response.data;

    if (!Array.isArray(results) || !Array.isArray(results[0])) {
      console.warn("Unexpected HuggingFace response format");
      return null;
    }

    // Convert array to { label: score } map
    const scores = {};
    for (const item of results[0]) {
      scores[item.label.toLowerCase()] = item.score;
    }

    return scores;
  } catch (err) {
    // Model might be loading (cold start) — HuggingFace returns 503
    if (err.response?.status === 503) {
      console.warn("HuggingFace model is loading (cold start), skipping spam check");
    } else {
      console.warn("HuggingFace API error (non-blocking):", err.message);
    }
    return null;
  }
}

/**
 * Analyze a form response for spam/toxicity
 * @param {Object} responseData - The submitted form data
 * @param {Array} formFields - The form field definitions
 * @returns {Object} { score, flagged, reasons, toxicity }
 */
async function analyzeResponse(responseData, formFields) {
  // Extract all text values from response
  const textValues = [];
  for (const field of formFields || []) {
    const value = responseData[field.id];
    if (typeof value === "string" && value.trim().length > 0) {
      textValues.push(value.trim());
    }
  }

  const allText = textValues.join(". ");

  // Skip analysis if too little text
  if (allText.length < 10) {
    return { score: 0, flagged: false, reasons: [], toxicity: null };
  }

  // Truncate to 512 chars (BERT models have token limits)
  const truncated = allText.substring(0, 512);

  // Call HuggingFace toxic-bert model
  const scores = await classifyText(truncated);

  // If API is not configured or failed, return clean
  if (!scores) {
    return { score: 0, flagged: false, reasons: [], toxicity: null };
  }

  // Determine final score and reasons
  const reasons = [];
  let maxScore = 0;

  const labelMap = {
    toxic: "Toxic content",
    severe_toxic: "Severely toxic content",
    obscene: "Obscene language",
    threat: "Threatening language",
    insult: "Insulting content",
    identity_hate: "Identity-based hate speech",
  };

  for (const [label, displayName] of Object.entries(labelMap)) {
    const labelScore = scores[label] || 0;
    if (labelScore > maxScore) maxScore = labelScore;
    if (labelScore > 0.5) {
      reasons.push(`${displayName} (${Math.round(labelScore * 100)}%)`);
    }
  }

  const flagged = maxScore >= 0.5;

  return {
    score: Number(maxScore.toFixed(3)),
    flagged,
    reasons,
    toxicity: scores,
  };
}

module.exports = { analyzeResponse };
