import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { formAPI } from "../services/api";
import { Sparkles, Loader2, Wand2, ArrowRight, FileText, Eye, X } from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Customer feedback form with name, email, rating, and suggestions",
  "Job application form with resume upload, experience, and cover letter",
  "Event registration form with name, email, phone, and meal preference",
  "Student survey with department, satisfaction rating, and comments",
  "Bug report form with title, severity, steps to reproduce, and screenshot upload",
];

const LOADING_STAGES = [
  { delay: 0,    text: "Sending your prompt to Gemini AI..." },
  { delay: 4000, text: "AI is designing your form structure..." },
  { delay: 8000, text: "This is taking a bit longer than usual — almost there..." },
  { delay: 13000, text: "Gemini is still working, please hold on..." },
];

const AIFormGenerator = () => {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 5) {
      setError("Please describe your form (at least 5 characters)");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);
    setLoadingText(LOADING_STAGES[0].text);

    // Stage-based loading messages
    const timers = LOADING_STAGES.slice(1).map(({ delay, text }) =>
      setTimeout(() => setLoadingText(text), delay)
    );

    try {
      const response = await formAPI.generateFormWithAI(prompt.trim());
      setResult(response.data);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Failed to generate form. Please try again.";
      setError(message);
    } finally {
      timers.forEach(clearTimeout);
      setLoading(false);
      setLoadingText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !loading) {
      e.preventDefault();
      handleGenerate();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl mb-4 shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            AI Form Generator
          </h1>
          <p className="text-gray-500 text-sm sm:text-base max-w-md mx-auto">
            Describe the form you need in plain English, and AI will build it
            for you instantly.
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Describe your form
          </label>
          <div className="relative">
            <textarea
              id="ai-prompt-input"
              value={prompt}
              onChange={(e) => {
                setPrompt(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Create a customer feedback form with name, email, star rating, and a comments section..."
              rows={4}
              maxLength={1000}
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all disabled:bg-gray-50 disabled:text-gray-500"
            />
            <span className="absolute bottom-3 right-3 text-xs text-gray-400">
              {prompt.length}/1000
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-3 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              <span className="mt-0.5">⚠️</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => setError("")}
                className="text-red-400 hover:text-red-600 transition-colors flex-shrink-0"
                aria-label="Dismiss error"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <button
            id="generate-form-btn"
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating your form...
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                Generate Form
              </>
            )}
          </button>

          {/* Loading stage feedback */}
          {loading && loadingText && (
            <p className="mt-3 text-center text-sm text-indigo-500 animate-pulse">
              {loadingText}
            </p>
          )}
        </div>

        {/* Example Prompts */}
        {!result && (
          <div className="mb-6">
            <p className="text-sm text-gray-500 mb-3">
              💡 Try one of these examples:
            </p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map((example, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setPrompt(example);
                    setError("");
                  }}
                  disabled={loading}
                  className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full hover:border-purple-300 hover:text-purple-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {example.length > 50
                    ? example.substring(0, 50) + "..."
                    : example}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Result Section */}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm border border-green-200 p-6 animate-in fade-in">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-green-600 text-lg">✓</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Form Generated!
              </h3>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 mb-4">
              <div className="flex items-center gap-3 mb-3">
                <FileText className="w-5 h-5 text-purple-600" />
                <span className="font-medium text-gray-900">
                  {result.form?.title || "Untitled Form"}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-gray-500">
                <span>
                  📄 {result.pagesGenerated}{" "}
                  {result.pagesGenerated === 1 ? "page" : "pages"}
                </span>
                <span>
                  📝 {result.fieldsGenerated}{" "}
                  {result.fieldsGenerated === 1 ? "field" : "fields"}
                </span>
              </div>
            </div>

            {/* Page & Field Breakdown */}
            <div className="space-y-3 mb-5">
              {result.form?.pages?.map((page, i) => (
                <div key={i} className="border border-gray-100 rounded-lg p-3">
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    {page.name}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {page.fields?.map((field, j) => (
                      <span
                        key={j}
                        className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full"
                      >
                        {field.label}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                id="edit-generated-form-btn"
                onClick={() =>
                  navigate(`/form-builder/${result.form?._id || result.form?.id}`)
                }
                className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-purple-700 transition-colors"
              >
                <Wand2 className="w-4 h-4" />
                Edit Form
              </button>
              <button
                id="preview-generated-form-btn"
                onClick={() =>
                  navigate(`/form-preview/${result.form?._id || result.form?.id}`)
                }
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-100 transition-colors"
              >
                <Eye className="w-4 h-4" />
                Preview Form
              </button>
              <button
                id="create-another-btn"
                onClick={() => {
                  setResult(null);
                  setPrompt("");
                  setError("");
                }}
                className="w-full sm:w-auto px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors text-sm"
              >
                + Create Another
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIFormGenerator;
