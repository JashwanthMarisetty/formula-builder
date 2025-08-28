import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useForm } from '../contexts/FormContext';
import { formAPI } from '../services/api';
import { filterResponsesByDate, getDateRangeDescription } from '../utils/dateFilters';
import Navbar from '../components/Navbar';
import { ArrowLeft, Download, Filter, Calendar, Search, BarChart3, PieChart, TrendingUp, Users, Loader2, Trash2, AlertTriangle } from 'lucide-react';

const FormResponses = () => {
  const { formId } = useParams();
  const { forms } = useForm();
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [fieldFilter, setFieldFilter] = useState('');
  const [fieldValue, setFieldValue] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showVisualization, setShowVisualization] = useState(false);
  const [selectedVisualization, setSelectedVisualization] = useState('overview');
  
  // New state for API responses
  const [responses, setResponses] = useState([]);
  const [isLoadingResponses, setIsLoadingResponses] = useState(false);
  const [responseError, setResponseError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalResponses, setTotalResponses] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const form = forms.find(f => f.id === formId);
  
  // Load responses from API
  useEffect(() => {
    const loadResponses = async () => {
      if (!formId || !form) return;
      
      setIsLoadingResponses(true);
      setResponseError(null);
      
      try {
        const result = await formAPI.getFormResponses(formId, {
          page: currentPage,
          limit: 50
        });
        
        if (result.success) {
          if (currentPage === 1) {
            setResponses(result.data.responses);
          } else {
            setResponses(prev => [...prev, ...result.data.responses]);
          }
          setTotalResponses(result.data.pagination.totalCount);
          setHasMore(result.data.pagination.hasNextPage);
        }
      } catch (error) {
        console.error('Error loading responses:', error);
        setResponseError(error.message);
        // Fallback to form context data
        setResponses(form?.responses || []);
      } finally {
        setIsLoadingResponses(false);
      }
    };
    
    loadResponses();
  }, [formId, form, currentPage]);

  // Get all fields for filtering
  const allFields = form?.pages?.flatMap(page => page.fields) || [];
  const filterableFields = allFields.filter(field => 
    ['text', 'email', 'phone', 'select', 'radio', 'checkbox', 'number', 'rating'].includes(field.type)
  );

  const handleExport = () => {
    // Create CSV content
    if (!form || responses.length === 0) return;

    const headers = ['Submission Date'];
    
    // Include fields from all pages
    form.pages.forEach(page => {
      page.fields.forEach(field => {
        if (field.type === 'address') {
          field.subfields?.forEach(subfield => {
            headers.push(`${field.label} - ${subfield.label}`);
          });
        } else {
          headers.push(field.label);
        }
      });
    });

    const csvContent = [
      headers.join(','),
      ...responses.map(response => {
        const row = [new Date(response.submittedAt).toLocaleString()];
        
        // Include data from all pages
        form.pages.forEach(page => {
          page.fields.forEach(field => {
            if (field.type === 'address') {
              field.subfields?.forEach(subfield => {
                row.push(response.data[`${field.id}_${subfield.name}`] || '');
              });
            } else {
              const value = response.data[field.id];
              if (Array.isArray(value)) {
                row.push(value.join('; '));
              } else {
                row.push(value || '');
              }
            }
          });
        });
        return row.map(cell => `"${cell}"`).join(',');
      })
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${form.name}-responses.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  let filteredResponses = responses.filter(response => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = Object.values(response.data).some(value => {
        if (Array.isArray(value)) {
          return value.some(v => v.toString().toLowerCase().includes(searchLower));
        }
        return value.toString().toLowerCase().includes(searchLower);
      });
      if (!matchesSearch) return false;
    }

    // Field-specific filter
    if (fieldFilter && fieldValue) {
      const fieldData = response.data[fieldFilter];
      if (Array.isArray(fieldData)) {
        return fieldData.some(v => v.toString().toLowerCase().includes(fieldValue.toLowerCase()));
      }
      return fieldData?.toString().toLowerCase().includes(fieldValue.toLowerCase());
    }

    return true;
  });

  // Apply date filter
  filteredResponses = filterResponsesByDate(filteredResponses, dateFilter);

  // Generate advanced visualization data
  const getAdvancedVisualizationData = () => {
    const visualizations = {
      overview: {
        totalResponses: filteredResponses.length,
        responseRate: form.views ? ((filteredResponses.length / form.views) * 100).toFixed(1) : 0,
        avgCompletionTime: '2m 34s', // Mock data
        topCountries: ['United States', 'Canada', 'United Kingdom'] // Mock data
      },
      fields: [],
      trends: {
        daily: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          responses: Math.floor(Math.random() * 20) + 5
        })),
        hourly: Array.from({ length: 24 }, (_, i) => ({
          hour: `${i.toString().padStart(2, '0')}:00`,
          responses: Math.floor(Math.random() * 5)
        }))
      }
    };
    
    allFields.forEach(field => {
      if (['select', 'radio', 'checkbox', 'rating'].includes(field.type)) {
        const data = {};
        
        filteredResponses.forEach(response => {
          const value = response.data[field.id];
          if (Array.isArray(value)) {
            value.forEach(v => {
              data[v] = (data[v] || 0) + 1;
            });
          } else if (value) {
            data[value] = (data[value] || 0) + 1;
          }
        });

        if (Object.keys(data).length > 0) {
          visualizations.fields.push({
            fieldId: field.id,
            fieldLabel: field.label,
            fieldType: field.type,
            data: data,
            total: Object.values(data).reduce((sum, count) => sum + count, 0)
          });
        }
      }
    });

    return visualizations;
  };

  const visualizationData = getAdvancedVisualizationData();

  // Handle delete response
  const [deletingResponseId, setDeletingResponseId] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleDeleteResponse = async (responseId) => {
    if (!responseId || !form) return;
    
    setDeletingResponseId(responseId);
    
    try {
      const result = await formAPI.deleteResponse(form.id, responseId);
      
      if (result.success) {
        // Remove the response from the local state
        setResponses(prev => prev.filter(response => response.id !== responseId));
        setTotalResponses(prev => prev - 1);
        setShowDeleteConfirm(null);
        
        // Show success message (optional)
        console.log('Response deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting response:', error);
      alert('Failed to delete response: ' + error.message);
    } finally {
      setDeletingResponseId(null);
    }
  };

  const OverviewVisualization = ({ data }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Total Responses</p>
            <p className="text-2xl font-bold">{data.totalResponses}</p>
          </div>
          <Users className="w-8 h-8 text-blue-200" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Response Rate</p>
            <p className="text-2xl font-bold">{data.responseRate}%</p>
          </div>
          <TrendingUp className="w-8 h-8 text-green-200" />
        </div>
      </div>
      
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Avg. Completion</p>
            <p className="text-2xl font-bold">{data.avgCompletionTime}</p>
          </div>
          <Calendar className="w-8 h-8 text-purple-200" />
        </div>
      </div>
    </div>
  );

  const FieldVisualization = ({ visualization }) => {
    const maxCount = Math.max(...Object.values(visualization.data));

    return (
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{visualization.fieldLabel}</h3>
          <span className="text-sm text-gray-500">{visualization.total} responses</span>
        </div>
        <div className="space-y-3">
          {Object.entries(visualization.data)
            .sort(([,a], [,b]) => b - a)
            .map(([option, count]) => (
            <div key={option} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 flex-1 mr-4">{option}</span>
              <div className="flex items-center space-x-3 flex-1">
                <div className="flex-1 bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  ></div>
                </div>
                <div className="text-right min-w-[60px]">
                  <span className="text-sm font-medium text-gray-900">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">
                    ({Math.round((count / visualization.total) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const TrendsVisualization = ({ data }) => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Daily Response Trend</h3>
        <div className="flex items-end space-x-2 h-40">
          {data.daily.map((day, index) => (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div 
                className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t transition-all duration-300 hover:from-blue-600 hover:to-blue-500"
                style={{ height: `${(day.responses / Math.max(...data.daily.map(d => d.responses))) * 100}%` }}
                title={`${day.responses} responses on ${day.date}`}
              ></div>
              <span className="text-xs text-gray-500 mt-2">{day.date}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="font-semibold text-gray-900 mb-4">Hourly Distribution</h3>
        <div className="grid grid-cols-6 gap-1">
          {data.hourly.map((hour, index) => (
            <div
              key={index}
              className={`h-6 rounded transition-all duration-200 ${
                hour.responses > 2 ? 'bg-green-500' :
                hour.responses > 1 ? 'bg-yellow-500' :
                hour.responses > 0 ? 'bg-orange-500' : 'bg-gray-200'
              }`}
              title={`${hour.hour}: ${hour.responses} responses`}
            ></div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>00:00</span>
          <span>12:00</span>
          <span>23:00</span>
        </div>
      </div>
    </div>
  );

  if (!form) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Form not found</h1>
            <Link to="/dashboard" className="text-purple-600 hover:text-purple-700">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            to="/my-forms"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to My Forms
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm">
          {/* Header */}
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{form.name} - Responses</h1>
                <p className="text-gray-600 mt-1">{filteredResponses.length} total responses</p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
                <button
                  onClick={() => setShowVisualization(!showVisualization)}
                  className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors px-4 py-2 border border-blue-300 rounded-lg"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Analytics</span>
                </button>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center justify-center space-x-2 text-gray-600 hover:text-purple-600 transition-colors px-4 py-2 border border-gray-300 rounded-lg"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                </button>
                <button
                  onClick={handleExport}
                  disabled={responses.length === 0}
                  className="flex items-center justify-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </button>
              </div>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Search Responses
                    </label>
                    <div className="relative">
                      <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Search in responses..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date Range
                    </label>
                    <select
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="all">All Time</option>
                      <option value="today">Today</option>
                      <option value="week">This Week</option>
                      <option value="month">This Month</option>
                      <option value="year">This Year</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by Field
                    </label>
                    <select
                      value={fieldFilter}
                      onChange={(e) => setFieldFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">Select field</option>
                      {filterableFields.map((field) => (
                        <option key={field.id} value={field.id}>
                          {field.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Value
                    </label>
                    <input
                      type="text"
                      value={fieldValue}
                      onChange={(e) => setFieldValue(e.target.value)}
                      placeholder="Enter value to filter"
                      disabled={!fieldFilter}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100"
                    />
                  </div>
                </div>
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setDateFilter('all');
                      setFieldFilter('');
                      setFieldValue('');
                    }}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {/* Advanced Visualization */}
            {showVisualization && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Response Analytics</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedVisualization('overview')}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedVisualization === 'overview'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Overview
                    </button>
                    <button
                      onClick={() => setSelectedVisualization('fields')}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedVisualization === 'fields'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Field Analysis
                    </button>
                    <button
                      onClick={() => setSelectedVisualization('trends')}
                      className={`px-3 py-1 rounded text-sm ${
                        selectedVisualization === 'trends'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      Trends
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-lg p-4">
                  {selectedVisualization === 'overview' && (
                    <OverviewVisualization data={visualizationData.overview} />
                  )}
                  
                  {selectedVisualization === 'fields' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {visualizationData.fields.length > 0 ? (
                        visualizationData.fields.map((visualization) => (
                          <FieldVisualization key={visualization.fieldId} visualization={visualization} />
                        ))
                      ) : (
                        <div className="col-span-full text-center py-8">
                          <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No visualizable fields found</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {selectedVisualization === 'trends' && (
                    <TrendsVisualization data={visualizationData.trends} />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Responses Table */}
          <div className="overflow-x-auto">
            {isLoadingResponses ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Loading responses...</h3>
                <p className="text-gray-600">Please wait while we fetch your form responses.</p>
              </div>
            ) : responseError ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="text-lg font-medium text-red-900 mb-2">Error loading responses</h3>
                <p className="text-red-600 mb-4">{responseError}</p>
                <button
                  onClick={() => {
                    setCurrentPage(1);
                    setResponseError(null);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {responses.length === 0 ? 'No responses yet' : 'No matching responses'}
                </h3>
                <p className="text-gray-600">
                  {responses.length === 0 
                    ? 'Responses will appear here once people start submitting your form.'
                    : 'Try adjusting your search or filter criteria.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Submission Date
                      </th>
                      {form.pages.map(page => 
                        page.fields.map((field) => (
                          <th key={field.id} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                            {field.label}
                          </th>
                        ))
                      )}
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredResponses.map((response) => (
                      <tr key={response.id} className="hover:bg-gray-50">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(response.submittedAt).toLocaleString()}
                        </td>
                        {form.pages.map(page => 
                          page.fields.map((field) => (
                            <td key={field.id} className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs">
                              <div className="truncate" title={
                                field.type === 'address' 
                                  ? field.subfields?.map(sf => response.data[`${field.id}_${sf.name}`]).filter(Boolean).join(', ') || '-'
                                  : Array.isArray(response.data[field.id]) 
                                    ? response.data[field.id].join(', ')
                                    : response.data[field.id] || '-'
                              }>
                                {field.type === 'address' 
                                  ? field.subfields?.map(sf => response.data[`${field.id}_${sf.name}`]).filter(Boolean).join(', ') || '-'
                                  : Array.isArray(response.data[field.id]) 
                                    ? response.data[field.id].join(', ')
                                    : response.data[field.id] || '-'
                                }
                              </div>
                            </td>
                          ))
                        )}
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => setShowDeleteConfirm(response.id)}
                            disabled={deletingResponseId === response.id}
                            className="text-red-600 hover:text-red-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Delete response"
                          >
                            {deletingResponseId === response.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Response</h3>
                </div>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this response? This action cannot be undone.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={deletingResponseId}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteResponse(showDeleteConfirm)}
                  disabled={deletingResponseId}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deletingResponseId === showDeleteConfirm ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FormResponses;
