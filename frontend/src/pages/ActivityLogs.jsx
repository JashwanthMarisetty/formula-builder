import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  ArrowLeft, 
  Calendar, 
  Search,
  FileText,
  Edit,
  Eye,
  Trash2,
  Plus,
  Share
} from 'lucide-react';

const ActivityLogs = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState('all');

  // Mock activity data
  const activities = [
    {
      id: '1',
      type: 'create',
      message: 'Created new form "Contact Form"',
      timestamp: '2024-01-15T10:30:00Z',
      formId: 'form-1',
      formName: 'Contact Form',
      icon: Plus,
      color: 'text-green-600'
    },
    {
      id: '2',
      type: 'edit',
      message: 'Updated form "Survey Form" - Added new field',
      timestamp: '2024-01-15T09:15:00Z',
      formId: 'form-2',
      formName: 'Survey Form',
      icon: Edit,
      color: 'text-blue-600'
    },
    {
      id: '3',
      type: 'response',
      message: 'New response received on "Registration Form"',
      timestamp: '2024-01-14T16:45:00Z',
      formId: 'form-3',
      formName: 'Registration Form',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      id: '4',
      type: 'view',
      message: 'Form "Contact Form" was viewed 25 times',
      timestamp: '2024-01-14T14:20:00Z',
      formId: 'form-1',
      formName: 'Contact Form',
      icon: Eye,
      color: 'text-indigo-600'
    },
    {
      id: '5',
      type: 'share',
      message: 'Shared form "Survey Form" via link',
      timestamp: '2024-01-13T11:30:00Z',
      formId: 'form-2',
      formName: 'Survey Form',
      icon: Share,
      color: 'text-orange-600'
    },
    {
      id: '6',
      type: 'delete',
      message: 'Moved form "Old Form" to trash',
      timestamp: '2024-01-12T08:15:00Z',
      formId: 'form-4',
      formName: 'Old Form',
      icon: Trash2,
      color: 'text-red-600'
    }
  ];

  const activityTypes = [
    { value: 'all', label: 'All Activities' },
    { value: 'create', label: 'Form Created' },
    { value: 'edit', label: 'Form Edited' },
    { value: 'response', label: 'New Response' },
    { value: 'view', label: 'Form Viewed' },
    { value: 'share', label: 'Form Shared' },
    { value: 'delete', label: 'Form Deleted' }
  ];

  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'year', label: 'This Year' }
  ];

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.formName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    
    // For demo purposes, we'll just filter by type and search
    return matchesSearch && matchesType;
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return date.toLocaleDateString();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Activity Logs</h1>
                <p className="text-gray-600 mt-1">Track all activities across your forms</p>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                <span>{filteredActivities.length} activities</span>
              </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Activities
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search activities..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Activity Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {activityTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  {dateRanges.map((range) => (
                    <option key={range.value} value={range.value}>
                      {range.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Activity List */}
          <div className="p-6">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No activities found</h3>
                <p className="text-gray-600">
                  {searchTerm || filterType !== 'all' 
                    ? 'Try adjusting your filters to see more activities.'
                    : 'Activities will appear here as you work with your forms.'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredActivities.map((activity) => {
                  const IconComponent = activity.icon;
                  return (
                    <div
                      key={activity.id}
                      className={`flex items-start space-x-4 p-4 border border-gray-200 rounded-lg transition-all duration-200 ${
                        activity.formId && activity.type !== 'delete' 
                          ? 'hover:bg-gray-50 hover:border-purple-300 hover:shadow-md transform hover:scale-[1.02]' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium">{activity.message}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-sm text-gray-500">
                            {formatTimestamp(activity.timestamp)}
                          </span>
                          <span className="text-sm text-gray-500">•</span>
                          <span className={`text-sm ${
                            activity.formId && activity.type !== 'delete' 
                              ? 'text-purple-600' 
                              : 'text-gray-500'
                          }`}>
                            {activity.formName}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;