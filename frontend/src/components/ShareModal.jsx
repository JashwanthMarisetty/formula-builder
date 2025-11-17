import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  ExternalLink, 
  Check,
  Share2
} from 'lucide-react';

import { FaFacebook, FaLinkedin, FaWhatsapp } from "react-icons/fa";

const ShareModal = ({ form, onClose }) => {
  const [activeTab, setActiveTab] = useState('link');
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState('public');

  const formUrl = `${window.location.origin}/form/${form.id || form._id}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(formUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleOpenInNewTab = () => {
    window.open(formUrl, '_blank');
  };

  const handleShareApp = (platform) => {
    const text = `Check out this form: ${form.name}`;
    const url = formUrl;
    
    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(url)}`);
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`);
        break;
      case 'general':
        if (navigator.share) {
          navigator.share({
            title: form.name,
            text: text,
            url: url
          });
        }
        break;
    }
  };

  const visibilityOptions = [
    { value: 'public', label: 'Public Form', description: 'Anyone with the link can access' },
    { value: 'private', label: 'Private Form', description: 'Only you can access' },
    { value: 'organization', label: 'Organization Form', description: 'Only organization members can access' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Share Form</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("link")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "link"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Share with Link
          </button>
          <button
            onClick={() => setActiveTab("apps")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "apps"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Share Through Apps
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "link" && (
            <div className="space-y-6">
              {/* Visibility Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Form Visibility
                </label>
                <div className="space-y-2">
                  {visibilityOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex items-start space-x-3 cursor-pointer"
                    >
                      <input
                        type="radio"
                        name="visibility"
                        value={option.value}
                        checked={visibility === option.value}
                        onChange={(e) => setVisibility(e.target.value)}
                        className="mt-1 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900">
                          {option.label}
                        </div>
                        <div className="text-sm text-gray-500">
                          {option.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Form URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Form URL
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={formUrl}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      copied
                        ? "bg-green-100 text-green-700"
                        : "bg-green-600 text-white hover:bg-green-700"
                    }`}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  onClick={handleCopyLink}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </button>
                <button
                  onClick={handleOpenInNewTab}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === "apps" && (
            <div className="space-y-6">
              <p className="text-gray-600 text-sm">
                Share your form through social media and messaging apps
              </p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => handleShareApp("whatsapp")}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                    <FaWhatsapp className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">WhatsApp</span>
                </button>

                <button
                  onClick={() => handleShareApp("facebook")}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <FaFacebook className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">Facebook</span>
                </button>

                <button
                  onClick={() => handleShareApp("linkedin")}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center">
                    <FaLinkedin className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">LinkedIn</span>
                </button>

                <button
                  onClick={() => handleShareApp("general")}
                  className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-white" />
                  </div>
                  <span className="font-medium text-gray-900">More</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
