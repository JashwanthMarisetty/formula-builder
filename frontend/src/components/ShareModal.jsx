import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  ExternalLink, 
  Check,
  Share2,
  QrCode,
  Download,
  Eye
} from 'lucide-react';

import { FaFacebook, FaLinkedin, FaWhatsapp } from "react-icons/fa";
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react';
import { formAPI } from '../services/api';


const ShareModal = ({ form, onClose }) => {
  const [activeTab, setActiveTab] = useState('link');
  const [copied, setCopied] = useState(false);
  const [visibility, setVisibility] = useState('public');
  
  // QR Code state
  const [qrData, setQrData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [showCanvas, setShowCanvas] = useState(true); // Toggle between canvas and SVG

  const formUrl = `${window.location.origin}/form/${form.id || form._id}`;

  // Load existing QR data when tab is opened
  useEffect(() => {
    if (activeTab === 'qrcode' && !qrData && !isGenerating) {
      loadExistingQRData();
    }
  }, [activeTab]);

  const loadExistingQRData = async () => {
    try {
      const response = await formAPI.getQRData(form.id || form._id);
      if (response.success) {
        setQrData(response.data);
      }
    } catch (error) {
      // QR doesn't exist yet, that's okay
      console.log('No existing QR code found');
    }
  };

  const handleGenerateQR = async () => {
    setIsGenerating(true);
    setQrError(null);
    
    try {
      const response = await formAPI.generateQRCode(form.id || form._id);
      
      if (response.success) {
        setQrData(response.data);
      } else {
        setQrError(response.message || 'Failed to generate QR code');
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
      setQrError(error.response?.data?.message || 'Failed to generate QR code. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPNG = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `form-qr-${form.id || form._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    });
  };

  const handleDownloadSVG = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const blob = new Blob([svgData], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-qr-${form.id || form._id}.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

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

  // Get the short URL for QR code
  const qrUrl = qrData ? `${window.location.origin}${qrData.shortUrl}` : formUrl;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
          <button
            onClick={() => setActiveTab("qrcode")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "qrcode"
                ? "text-purple-600 border-b-2 border-purple-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <div className="flex items-center justify-center space-x-1">
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </div>
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

          {activeTab === "qrcode" && (
            <div className="space-y-6">
              <p className="text-gray-600 text-sm">
                Generate a QR code for easy sharing. People can scan it with their phone camera to open your form.
              </p>

              {!qrData ? (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <QrCode className="w-10 h-10 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No QR Code Yet
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Click the button below to generate a QR code for this form
                  </p>
                  <button
                    onClick={handleGenerateQR}
                    disabled={isGenerating}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-400 disabled:cursor-not-allowed flex items-center space-x-2 mx-auto"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <QrCode className="w-5 h-5" />
                        <span>Generate QR Code</span>
                      </>
                    )}
                  </button>
                  {qrError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{qrError}</p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* QR Code Display */}
                  <div className="bg-white border-2 border-gray-200 rounded-lg p-6 flex flex-col items-center">
                    <div className="bg-white p-4 rounded-lg">
                      {showCanvas ? (
                        <QRCodeCanvas
                          id="qr-code-canvas"
                          value={qrUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      ) : (
                        <QRCodeSVG
                          id="qr-code-svg"
                          value={qrUrl}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />
                      )}
                    </div>
                    
                    {/* Short URL Display */}
                    <div className="mt-4 text-center">
                      <p className="text-xs text-gray-500 mb-1">Short URL</p>
                      <code className="text-sm bg-gray-100 px-3 py-1 rounded text-purple-600 font-mono">
                        {qrData.shortUrl}
                      </code>
                    </div>

                    {/* Scan Count */}
                    {qrData.scanCount !== undefined && (
                      <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
                        <Eye className="w-4 h-4" />
                        <span>Scanned {qrData.scanCount} times</span>
                      </div>
                    )}
                  </div>

                  {/* Download Buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleDownloadPNG}
                      className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download PNG</span>
                    </button>
                    <button
                      onClick={handleDownloadSVG}
                      className="flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download SVG</span>
                    </button>
                  </div>

                  {/* Regenerate Button */}
                  <button
                    onClick={handleGenerateQR}
                    disabled={isGenerating}
                    className="w-full text-purple-600 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors text-sm disabled:text-purple-400"
                  >
                    {isGenerating ? 'Regenerating...' : 'Regenerate QR Code'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
