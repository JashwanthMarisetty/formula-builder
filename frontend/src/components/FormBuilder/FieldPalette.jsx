import React, { useState } from 'react';
import { 
  Type, 
  List, 
  CheckSquare, 
  Circle, 
  Calendar, 
  Clock, 
  Mail, 
  Phone, 
  Hash,
  FileText,
  Upload,
  Star,
  MapPin,
  Search
} from 'lucide-react';

const FieldPalette = ({ onAddField }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const fieldTypes = [
    { type: 'text', name: 'Text Input', icon: Type, description: 'Single line text input' },
    { type: 'textarea', name: 'Textarea', icon: FileText, description: 'Multi-line text input' },
    { type: 'email', name: 'Email', icon: Mail, description: 'Email address input' },
    { type: 'phone', name: 'Phone', icon: Phone, description: 'Phone number input' },
    { type: 'number', name: 'Number', icon: Hash, description: 'Numeric input' },
    { type: 'select', name: 'Dropdown', icon: List, description: 'Dropdown selection' },
    { type: 'radio', name: 'Radio Buttons', icon: Circle, description: 'Single choice selection' },
    { type: 'checkbox', name: 'Checkboxes', icon: CheckSquare, description: 'Multiple choice selection' },
    { type: 'date', name: 'Date', icon: Calendar, description: 'Date picker' },
    { type: 'time', name: 'Time', icon: Clock, description: 'Time picker' },
    { type: 'file', name: 'File Upload', icon: Upload, description: 'File upload field' },
    { type: 'rating', name: 'Rating', icon: Star, description: 'Star rating field' },
    { type: 'address', name: 'Address', icon: MapPin, description: 'Full address input' }
  ];

  const filteredFields = [];

  for (let i = 0; i < fieldTypes.length; i++) {
    const field = fieldTypes[i];

    const nameLower = field.name ? field.name.toLowerCase() : "";
    const descLower = field.description ? field.description.toLowerCase() : "";
    const searchLower = searchTerm ? searchTerm.toLowerCase() : "";

    if (nameLower.includes(searchLower) || descLower.includes(searchLower)) {
      filteredFields.push(field);
    }
  }

  const handleAddField = (fieldType) => {
    const baseField = {
      type: fieldType.type,
      label: fieldType.name,
      placeholder: `Enter ${fieldType.name.toLowerCase()}`,
      required: false,
      validation: {},
      options: fieldType.type === 'select' || fieldType.type === 'radio' || fieldType.type === 'checkbox' 
        ? ['Option 1', 'Option 2', 'Option 3'] 
        : undefined
    };

    if (fieldType.type === 'address') {
      baseField.subfields = [
        { name: 'street', label: 'Street Address', required: true },
        { name: 'city', label: 'City', required: true },
        { name: 'state', label: 'State / Province', required: true },
        { name: 'zip', label: 'Postal / Zip Code', required: true }
      ];
    }

    onAddField(baseField);
  };

  return (
    <div className="w-full lg:w-80 bg-white border-r border-gray-200 p-4 lg:p-6 h-full overflow-y-auto">
      <div className="mb-6">
        <h2 className="text-base lg:text-lg font-semibold text-gray-900 mb-4">Field Palette</h2>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-2 lg:left-3 top-2 lg:top-3 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search fields..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 lg:pl-10 pr-3 lg:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm lg:text-base"
          />
        </div>
      </div>

      <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto">
        {filteredFields.map((field) => (
          <div
            key={field.type}
            onClick={() => handleAddField(field)}
            className="flex items-center p-2 lg:p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 transition-all duration-200 transform hover:scale-105 hover:shadow-md active:scale-95"
          >
            <div className="w-6 h-6 lg:w-8 lg:h-8 bg-gray-100 rounded-lg flex items-center justify-center mr-2 lg:mr-3">
              <field.icon className="w-4 h-4 text-gray-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900 text-xs lg:text-sm">{field.name}</p>
              <p className="text-xs text-gray-500 hidden lg:block">{field.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldPalette;