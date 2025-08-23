import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from '../contexts/FormContext';
import { useAuth } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';
import APITest from '../components/APITest';
import { Plus, BarChart3, FileText, Users, Calendar, TrendingUp, Eye, MessageSquare, ArrowRight, Settings, X } from 'lucide-react';

// Move CustomizeModal outside of Dashboard component for better performance
const CustomizeModal = ({ visibleWidgets, setVisibleWidgets, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">Customize Dashboard</h2>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-6">
        <p className="text-gray-600 mb-4">Choose which widgets to display on your dashboard:</p>
        <div className="space-y-3">
          {Object.entries(visibleWidgets).map(([key, visible]) => (
            <label key={key} className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={visible}
                onChange={() => setVisibleWidgets(prev => ({
                  ...prev,
                  [key]: !prev[key]
                }))}
                className="text-purple-600 focus:ring-purple-500"
              />
              <span className="text-gray-900 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
            </label>
          ))}
        </div>
      </div>
      <div className="p-6 border-t border-gray-200">
        <button
          onClick={onClose}
          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const { forms, createForm, isLoading, error } = useForm();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [visibleWidgets, setVisibleWidgets] = useState({
    stats: true,
    quickActions: true,
    recentActivity: true,
    recentForms: true,
    analytics: true,
    performanceChart: true
  });

  const handleCreateForm = async () => {
    try {
      const newForm = await createForm({ name: 'Untitled Form' });
      if (newForm && newForm.id) {
        navigate(`/form-builder/${newForm.id}`);
      } else {
        console.error('Form creation failed: no form returned or no ID');
      }
    } catch (error) {
      console.error('Failed to create form:', error);
    }
  };

  // Calculate real statistics from form data
  const stats = useMemo(() => {
    const inboxForms = forms.filter(form => form.location === 'inbox');
    const totalResponses = forms.reduce((sum, form) => sum + (form.responses?.length || 0), 0);
    const totalViews = forms.reduce((sum, form) => sum + (form.views || 0), 0);
    const conversionRate = totalViews > 0 ? ((totalResponses / totalViews) * 100).toFixed(1) : 0;
    
    // Calculate weekly growth (mock calculation - in production you'd store historical data)
    const thisWeek = new Date();
    thisWeek.setDate(thisWeek.getDate() - 7);
    
    const recentForms = forms.filter(form => new Date(form.createdAt) >= thisWeek);
    const recentResponses = forms.reduce((sum, form) => {
      if (!form.responses) return sum;
      return sum + form.responses.filter(response => 
        new Date(response.submittedAt) >= thisWeek
      ).length;
    }, 0);
    
    return {
      totalForms: inboxForms.length,
      totalResponses,
      totalViews,
      conversionRate,
      weeklyForms: recentForms.length,
      weeklyResponses: recentResponses,
      weeklyViews: Math.floor(totalViews * 0.12), // Estimated weekly views
      inboxForms
    };
  }, [forms]);

  // Generate recent activity from real form data
  const recentActivity = useMemo(() => {
    const activities = [];
    
    // Add form creation activities
    forms.slice(0, 3).forEach(form => {
      const daysAgo = Math.floor((new Date() - new Date(form.createdAt)) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
      
      activities.push({
        id: `create-${form.id}`,
        type: 'create',
        message: `Created form "${form.name}"`,
        time: timeText,
        icon: Plus,
        color: 'text-blue-600'
      });
    });
    
    // Add recent responses
    forms.forEach(form => {
      if (form.responses && form.responses.length > 0) {
        form.responses.slice(-2).forEach(response => {
          const daysAgo = Math.floor((new Date() - new Date(response.submittedAt)) / (1000 * 60 * 60 * 24));
          const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
          
          activities.push({
            id: `response-${response.id}`,
            type: 'response',
            message: `New response received on "${form.name}"`,
            time: timeText,
            icon: MessageSquare,
            color: 'text-green-600'
          });
        });
      }
    });
    
    // Add form view activities for forms with views
    forms.filter(form => form.views > 0).slice(0, 2).forEach(form => {
      const daysAgo = Math.floor((new Date() - new Date(form.updatedAt)) / (1000 * 60 * 60 * 24));
      const timeText = daysAgo === 0 ? 'Today' : daysAgo === 1 ? '1 day ago' : `${daysAgo} days ago`;
      
      activities.push({
        id: `view-${form.id}`,
        type: 'view',
        message: `Form "${form.name}" was viewed ${form.views} times`,
        time: timeText,
        icon: Eye,
        color: 'text-purple-600'
      });
    });
    
    // Sort by most recent and limit to 5
    return activities
      .sort((a, b) => {
        // Simple sorting by type priority for now
        const priority = { response: 3, create: 2, view: 1 };
        return priority[b.type] - priority[a.type];
      })
      .slice(0, 5);
  }, [forms]);

  // Generate analytics from real form data
  const analyticsData = useMemo(() => {
    // Calculate weekly responses (mock distribution for now)
    const totalResponses = stats.totalResponses;
    const weeklyResponses = Array.from({ length: 7 }, (_, i) => {
      return Math.floor(totalResponses * (0.1 + Math.random() * 0.05));
    });
    
    // Calculate monthly trend (mock data based on total responses)
    const monthlyTrend = Array.from({ length: 12 }, (_, i) => {
      const base = Math.floor(totalResponses / 4); // Quarterly average
      return Math.max(1, base + Math.floor(Math.random() * base * 0.5));
    });
    
    // Get top performing forms from real data
    const topForms = forms
      .filter(form => form.responses && form.responses.length > 0)
      .map(form => ({
        name: form.name,
        responses: form.responses.length,
        views: form.views || 0,
        conversionRate: form.views > 0 ? ((form.responses.length / form.views) * 100).toFixed(1) : 0
      }))
      .sort((a, b) => b.responses - a.responses)
      .slice(0, 4);
    
    // Add some default forms if no real data exists
    if (topForms.length === 0) {
      topForms.push(
        { name: 'No forms yet', responses: 0, views: 0, conversionRate: 0 }
      );
    }
    
    // Device breakdown (mock data for now - would need client-side analytics)
    const deviceBreakdown = [
      { device: 'Desktop', percentage: 45, count: Math.floor(stats.totalResponses * 0.45) },
      { device: 'Mobile', percentage: 35, count: Math.floor(stats.totalResponses * 0.35) },
      { device: 'Tablet', percentage: 20, count: Math.floor(stats.totalResponses * 0.20) }
    ];
    
    return {
      weeklyResponses,
      monthlyTrend,
      topForms,
      deviceBreakdown
    };
  }, [forms, stats]);

  const toggleWidget = (widgetKey) => {
    setVisibleWidgets(prev => ({
      ...prev,
      [widgetKey]: !prev[widgetKey]
    }));
  };

  const CustomizeModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Customize Dashboard</h2>
          <button
            onClick={() => setShowCustomizeModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6">
          <p className="text-gray-600 mb-4">Choose which widgets to display on your dashboard:</p>
          <div className="space-y-3">
            {Object.entries(visibleWidgets).map(([key, visible]) => (
              <label key={key} className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={visible}
                  onChange={() => toggleWidget(key)}
                  className="text-purple-600 focus:ring-purple-500"
                />
                <span className="text-gray-900 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
              </label>
            ))}
          </div>
        </div>
        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => setShowCustomizeModal(false)}
            className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );

  // Show loading state
  if (isLoading && forms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <X className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Welcome back, {user?.name}! 👋
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">
              Here's what's happening with your forms today.
            </p>
          </div>
          <button
            onClick={() => setShowCustomizeModal(true)}
            className="flex items-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span className="hidden sm:inline">Customize</span>
          </button>
        </div>

        {/* Stats Cards */}
        {visibleWidgets.stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Forms</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalForms}</p>
                  <p className="text-xs text-green-600 mt-1">+{stats.weeklyForms} this week</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Responses</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                  <p className="text-xs text-green-600 mt-1">+{stats.weeklyResponses} this week</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Total Views</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.totalViews}</p>
                  <p className="text-xs text-blue-600 mt-1">+{stats.weeklyViews} this week</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.conversionRate}%</p>
                  <p className="text-xs text-green-600 mt-1">+2.3% this week</p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-6 sm:h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Analytics Widget */}
        {visibleWidgets.analytics && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Analytics Overview</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Responses Chart */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Weekly Responses</h3>
                <div className="flex items-end space-x-2 h-32">
                  {analyticsData.weeklyResponses.map((value, index) => (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div 
                        className="w-full bg-purple-600 rounded-t transition-all duration-300 hover:bg-purple-700"
                        style={{ height: `${(value / Math.max(...analyticsData.weeklyResponses)) * 100}%` }}
                        title={`${value} responses`}
                      ></div>
                      <span className="text-xs text-gray-500 mt-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Performing Forms */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Top Performing Forms</h3>
                <div className="space-y-3">
                  {analyticsData.topForms.slice(0, 4).map((form, index) => (
                    <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex-1">
                        <span className="text-sm text-gray-900 font-medium">{form.name}</span>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                          <span>{form.responses} responses</span>
                          <span>•</span>
                          <span>{form.conversionRate}% rate</span>
                        </div>
                      </div>
                      <div className="w-12 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{ width: `${form.conversionRate}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Performance Chart */}
        {visibleWidgets.performanceChart && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 mb-6 sm:mb-8">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">Monthly Performance Trend</h2>
            <div className="h-64">
              <div className="flex items-end justify-between h-full space-x-1">
                {analyticsData.monthlyTrend.map((value, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div 
                      className="w-full bg-gradient-to-t from-purple-600 to-purple-400 rounded-t transition-all duration-300 hover:from-purple-700 hover:to-purple-500"
                      style={{ height: `${(value / Math.max(...analyticsData.monthlyTrend)) * 100}%` }}
                      title={`${value} responses in ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}`}
                    ></div>
                    <span className="text-xs text-gray-500 mt-2">
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
          {visibleWidgets.quickActions && (
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={handleCreateForm}
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-purple-300 transition-all text-left group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center mr-3 transition-colors">
                      <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Create Form</p>
                      <p className="text-xs sm:text-sm text-gray-600">Start building a new form</p>
                    </div>
                  </button>
                  
                  <Link
                    to="/my-forms"
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-300 transition-all text-left group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center mr-3 transition-colors">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">View Analytics</p>
                      <p className="text-xs sm:text-sm text-gray-600">Check your form performance</p>
                    </div>
                  </Link>

                  <Link
                    to="/activity-logs"
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-green-300 transition-all text-left group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center mr-3 transition-colors">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Activity Logs</p>
                      <p className="text-xs sm:text-sm text-gray-600">View recent activities</p>
                    </div>
                  </Link>

                  <button
                    onClick={() => setShowCustomizeModal(true)}
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-orange-300 transition-all text-left group"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center mr-3 transition-colors">
                      <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm sm:text-base">Customize Dashboard</p>
                      <p className="text-xs sm:text-sm text-gray-600">Personalize your workspace</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {visibleWidgets.recentActivity && (
            <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm">No recent activity</p>
                    <p className="text-gray-400 text-xs mt-1">Create a form to get started!</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => {
                    const IconComponent = activity.icon;
                    return (
                      <div key={activity.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                        <div className={`w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ${activity.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-900 leading-relaxed">{activity.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              {recentActivity.length > 0 && (
                <Link
                  to="/activity-logs"
                  className="mt-4 text-xs sm:text-sm text-purple-600 hover:text-purple-700 inline-flex items-center font-medium"
                >
                  View All Activity
                  <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Recent Forms */}
        {visibleWidgets.recentForms && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Recent Forms</h2>
              <Link
                to="/my-forms"
                className="text-purple-600 hover:text-purple-700 text-xs sm:text-sm font-medium"
              >
                View All Forms
              </Link>
            </div>
            
            {stats.inboxForms.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No forms created yet</p>
                <button
                  onClick={handleCreateForm}
                  className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Your First Form
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {stats.inboxForms.slice(0, 6).map((form) => (
                  <div key={form.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all group">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base group-hover:text-purple-600 transition-colors">{form.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        form.status === 'published' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {form.status}
                      </span>
                    </div>
                    <div className="mb-3"></div>
                    <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 mb-3">
                      <span>{form.responses?.length || 0} responses</span>
                      <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        to={`/form-builder/${form.id}`}
                        className="flex-1 bg-gray-100 text-gray-700 px-2 sm:px-3 py-2 rounded text-xs sm:text-sm text-center hover:bg-gray-200 transition-colors"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/form-preview/${form.id}`}
                        className="flex-1 bg-purple-600 text-white px-2 sm:px-3 py-2 rounded text-xs sm:text-sm text-center hover:bg-purple-700 transition-colors"
                      >
                        Preview
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {showCustomizeModal && (
        <CustomizeModal 
          visibleWidgets={visibleWidgets}
          setVisibleWidgets={setVisibleWidgets}
          onClose={() => setShowCustomizeModal(false)}
        />
      )}
    </div>
  );
};

export default Dashboard;