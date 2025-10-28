import React from 'react';
import { Star, Upload, Calendar, Clock, MapPin } from 'lucide-react';
import GoogleMap from '../GoogleMap';

const FormField = ({ field, isSelected, onUpdate }) => {
  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled
          />
        );
      
      case 'number':
        return (
          <input
            type="number"
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled
          />
        );
      
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            disabled
          />
        );
      
      case 'select':
        return (
          <select
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled
          >
            <option value="">Select an option</option>
            {field.options?.map((option, index) => (
              <option key={index} value={option}>{option}</option>
            ))}
          </select>
        );
      
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.id}
                  value={option}
                  className="text-purple-600 focus:ring-purple-500"
                  disabled
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <label key={index} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  className="text-purple-600 focus:ring-purple-500"
                  disabled
                />
                <span className="text-gray-700">{option}</span>
              </label>
            ))}
          </div>
        );
      
      case 'date':
        return (
          <div className="relative">
            <input
              type="date"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled
            />
            <Calendar className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        );
      
      case 'time':
        return (
          <div className="relative">
            <input
              type="time"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              disabled
            />
            <Clock className="absolute right-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
        );
      
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <input
              type="file"
              className="hidden"
              id={`file-${field.id}`}
              disabled
            />
            <label htmlFor={`file-${field.id}`} className="cursor-pointer">
              <p className="text-gray-500">Click to upload files</p>
            </label>
          </div>
        );
      
      case 'rating':
        return (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Star
                key={rating}
                className={`w-6 h-6 cursor-pointer transition-colors ${
                  rating <= 3 ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-400'
                }`}
              />
            ))}
          </div>
        );
      
      case 'address':
        return (
          <div className="space-y-4">
            {field.subfields?.map((subfield, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {subfield.label} {subfield.required && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  placeholder={`Enter ${subfield.label.toLowerCase()}`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled
                />
              </div>
            ))}
          </div>
        );
      
      case 'location':
        return (
          <div className="w-full">
            {/* Map Preview Container */}
            <div className="relative w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              {/* Grayed-out map preview */}
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 opacity-60"></div>
              
              {/* Map grid pattern */}
              <div className="absolute inset-0" style={{
                backgroundImage: `
                  linear-gradient(rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}></div>
              
              {/* Center icon and text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500">
                <MapPin className="w-8 h-8 mb-2 text-gray-600" />
                <p className="text-sm font-medium">Map will appear here</p>
                <p className="text-xs text-gray-400 mt-1">{field.placeholder}</p>
              </div>
              
              {/* Settings indicator */}
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              </div>
            </div>
            
            {/* Location settings preview */}
            <div className="mt-3 text-xs text-gray-500 space-y-1">
              {field.locationSettings?.autoFetchLocation && (
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Auto-fetch user location</span>
                </div>
              )}
              {field.locationSettings?.allowManualPin && (
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <span>Manual pin drop allowed</span>
                </div>
              )}
            </div>
          </div>
        );
      
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            disabled
          />
        );
    }
  };

  return (
    <div className={`p-4 border rounded-lg transition-all ${
      isSelected 
        ? 'border-purple-500 bg-purple-50' 
        : 'border-gray-200 hover:border-gray-300'
    }`}>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {field.description && (
          <p className="text-sm text-gray-500 mb-2">{field.description}</p>
        )}
      </div>
      {renderField()}
    </div>
  );
};

export default FormField;