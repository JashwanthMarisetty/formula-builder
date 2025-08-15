import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from '../contexts/FormContext';
import Navbar from '../components/Navbar';
import { 
  FileText, 
  MoreVertical, 
  Share, 
  Archive, 
  Trash2, 
  Eye, 
  Edit,
  RotateCcw,
  X,
  BarChart3,
  Search,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  Users,
  TrendingUp,
  Copy,
  ExternalLink,
  Check
} from 'lucide-react';

const MyForms = () => {
  const { 
    forms, 
    moveFormToTrash, 
    moveFormToArchive, 
    restoreForm, 
    deleteForm 
  } = useForm();
  
  const [activeTab, setActiveTab] = useState('inbox');
  const [showMenu, setShowMenu] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('updatedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedForms, setSelectedForms] = useState(new Set());
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [responseFilter, setResponseFilter] = useState('all');
  const [showConfirmModal, setShowConfirmModal] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(null);

  const filteredForms = forms.filter(form => {
    // Filter by tab
    let tabMatch = false;
    switch (activeTab) {
      case 'inbox':
        tabMatch = form.location === 'inbox';
        break;
      case 'archive':
        tabMatch = form.location === 'archive';
        break;
      case 'trash':
        tabMatch = form.location === 'trash';
        break;
      default:
        tabMatch = form.location === 'inbox';
    }

    // Filter by search term
    const searchMatch = !searchTerm || 
      form.name.toLowerCase().includes(searchTerm.toLowerCase());

    // Filter by status
    const statusMatch = statusFilter === 'all' || form.status === statusFilter;

    // Filter by date
    let dateMatch = true;
    if (dateFilter !== 'all') {
      const formDate = new Date(form.updatedAt);
      const now = new Date();
      const daysDiff = Math.floor((now - formDate) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case 'today':
          dateMatch = daysDiff === 0;
          break;
        case 'week':
          dateMatch = daysDiff <= 7;
          break;
        case 'month':
          dateMatch = daysDiff <= 30;
          break;
      }
    }

    // Filter by response count
    let responseMatch = true;
    if (responseFilter !== 'all') {
      const responseCount = form.responses?.length || 0;
      switch (responseFilter) {
        case 'none':
          responseMatch = responseCount === 0;
          break;
        case 'low':
          responseMatch = responseCount > 0 && responseCount <= 10;
          break;
        case 'medium':
          responseMatch = responseCount > 10 && responseCount <= 50;
          break;
        case 'high':
          responseMatch = responseCount > 50;
          break;
      }
    }

    return tabMatch && searchMatch && statusMatch && dateMatch && responseMatch;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      case 'responses':
        aValue = a.responses?.length || 0;
        bValue = b.responses?.length || 0;
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt);
        bValue = new Date(b.createdAt);
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      case 'updatedAt':
      default:
        aValue = new Date(a.updatedAt);
        bValue = new Date(b.updatedAt);
        break;
    }

    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const handleMenuAction = (action, formId) => {
    setShowMenu(null);
    if (action === 'share') {
      // Handle share action
      const formUrl = `${window.location.origin}/form/${formId}`;
      navigator.clipboard.writeText(formUrl);
      // You could show a toast notification here
    } else {
      setShowConfirmModal({ action, formId });
    }
  };

  const confirmAction = () => {
    const { action, formId } = showConfirmModal;
    
    switch (action) {
      case 'trash':
        moveFormToTrash(formId);
        setShowSuccessModal({ type: 'trash', message: 'Form moved to trash successfully!' });
        break;
      case 'archive':
        moveFormToArchive(formId);
        setShowSuccessModal({ type: 'archive', message: 'Form archived successfully!' });
        break;
      case 'restore':
        restoreForm(formId);
        setShowSuccessModal({ type: 'restore', message: 'Form restored successfully!' });
        break;
      case 'delete':
        deleteForm(formId);
        setShowSuccessModal({ type: 'delete', message: 'Form deleted permanently!' });
        break;
    }
    
    setShowConfirmModal(null);
    setTimeout(() => setShowSuccessModal(null), 3000);
  };

  const handleSelectForm = (formId) => {
    const newSelected = new Set(selectedForms);
    if (newSelected.has(formId)) {
      newSelected.delete(formId);
    } else {
      newSelected.add(formId);
    }
    setSelectedForms(newSelected);
    setShowBulkActions(newSelected.size > 0);
  };

  const handleSelectAll = () => {
    if (selectedForms.size === filteredForms.length) {
      setSelectedForms(new Set());
      setShowBulkActions(false);
    } else {
      setSelectedForms(new Set(filteredForms.map(f => f.id)));
      setShowBulkActions(true);
    }
  };

  const handleBulkAction = (action) => {
    if (selectedForms.size === 0) return;
    
    const actionText = action === 'trash' ? 'move to trash' : 
                      action === 'archive' ? 'archive' : 
                      action === 'restore' ? 'restore' : 
                      'delete permanently';
    
    const confirmMessage = `Are you sure you want to ${actionText} ${selectedForms.size} form${selectedForms.size > 1 ? 's' : ''}?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }
    
    selectedForms.forEach(formId => {
      switch (action) {
        case 'trash':
          moveFormToTrash(formId);
          break;
        case 'archive':
          moveFormToArchive(formId);
          break;
        case 'restore':
          restoreForm(formId);
          break;
        case 'delete':
          deleteForm(formId);
          break;
      }
    });
    
    setSelectedForms(new Set());
    setShowBulkActions(false);
    
    // Show success message
    const successMessage = `${selectedForms.size} form${selectedForms.size > 1 ? 's' : ''} ${actionText === 'move to trash' ? 'moved to trash' : actionText === 'archive' ? 'archived' : actionText === 'restore' ? 'restored' : 'deleted'} successfully!`;
    setShowSuccessModal({ type: action, message: successMessage });
    setTimeout(() => setShowSuccessModal(null), 3000);
  };

  const getConfirmMessage = () => {
    if (!showConfirmModal) return '';
    
    switch (showConfirmModal.action) {
      case 'trash':
        return 'Do you want to move this form to trash?';
      case 'archive':
        return 'Do you want to move this form to archive?';
      case 'restore':
        return 'Do you want to restore this form to inbox?';
      case 'delete':
        return 'Do you want to permanently delete the form?';
      default:
        return '';
    }
  };

  const tabs = [
    { id: 'inbox', name: 'Inbox', count: forms.filter(f => f.location === 'inbox').length },
    { id: 'archive', name: 'Archive', count: forms.filter(f => f.location === 'archive').length },
    { id: 'trash', name: 'Trash', count: forms.filter(f => f.location === 'trash').length }
  ];

  const getFormStats = (form) => {
    const responses = form.responses?.length || 0;
    const views = form.views || Math.floor(Math.random() * 100) + 20;
    const conversionRate = views > 0 ? ((responses / views) * 100).toFixed(1) : 0;
    return { responses, views, conversionRate };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Forms</h1>
          <p className="text-gray-600">Manage all your forms in one place</p>
        </div>

        {/* Enhanced Search and Sort Controls */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search forms by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="createdAt">Date Created</option>
                <option value="name">Name</option>
                <option value="responses">Responses</option>
                <option value="status">Status</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
              <button
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="w-4 h-4" />
                <span>Filters</span>
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Updated</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Response Count</label>
                  <select
                    value={responseFilter}
                    onChange={(e) => setResponseFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">All Forms</option>
                    <option value="none">No Responses</option>
                    <option value="low">1-10 Responses</option>
                    <option value="medium">11-50 Responses</option>
                    <option value="high">50+ Responses</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setStatusFilter('all');
                      setDateFilter('all');
                      setResponseFilter('all');
                    }}
                    className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Bulk Actions */}
        {showBulkActions && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-purple-800 font-medium">
                {selectedForms.size} form{selectedForms.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                {activeTab === 'inbox' && (
                  <>
                    <button
                      onClick={() => handleBulkAction('archive')}
                      className="flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
                    >
                      <Archive className="w-4 h-4" />
                      <span>Archive</span>
                    </button>
                    <button
                      onClick={() => handleBulkAction('trash')}
                      className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Move to Trash</span>
                    </button>
                  </>
                )}
                {(activeTab === 'archive' || activeTab === 'trash') && (
                  <button
                    onClick={() => handleBulkAction('restore')}
                    className="flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>Restore</span>
                  </button>
                )}
                {activeTab === 'trash' && (
                  <button
                    onClick={() => handleBulkAction('delete')}
                    className="flex items-center space-x-1 px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Delete Permanently</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedForms(new Set());
                    setShowBulkActions(false);
                  }}
                  className="px-3 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <div className="text-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                showSuccessModal.type === 'delete' ? 'bg-red-100' : 'bg-green-100'
              }`}>
                <Check className={`w-6 h-6 ${
                  showSuccessModal.type === 'delete' ? 'text-red-600' : 'text-green-600'
                }`} />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Success!</h3>
              <p className="text-gray-600">{showSuccessModal.message}</p>
            </div>
          </div>
        </div>
      )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedForms(new Set());
                    setShowBulkActions(false);
                  }}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Forms Grid */}
          <div className="p-6">
            {filteredForms.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || showAdvancedFilters ? 'No forms found' : `No forms in ${activeTab}`}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || showAdvancedFilters
                    ? 'Try adjusting your search terms or filters'
                    : activeTab === 'inbox' 
                      ? 'Create your first form to get started'
                      : `No forms have been moved to ${activeTab} yet`
                  }
                </p>
                {activeTab === 'inbox' && !searchTerm && !showAdvancedFilters && (
                  <Link
                    to="/form-builder"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create Form
                  </Link>
                )}
              </div>
            ) : (
              <>
                {/* Select All */}
                {filteredForms.length > 0 && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800"
                    >
                      {selectedForms.size === filteredForms.length ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                      <span>Select All ({filteredForms.length})</span>
                    </button>
                    <div className="text-sm text-gray-500">
                      Showing {filteredForms.length} of {forms.filter(f => f.location === activeTab).length} forms
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredForms.map((form) => {
                    const stats = getFormStats(form);
                    return (
                      <div
                        key={form.id}
                        className={`border rounded-lg p-6 hover:shadow-lg transition-all duration-200 relative group ${
                          selectedForms.has(form.id) ? 'border-purple-500 bg-purple-50 shadow-md' : 'border-gray-200 hover:border-purple-300'
                        }`}
                      >
                        {/* Selection Checkbox */}
                        <div className="absolute top-4 left-4">
                          <button
                            onClick={() => handleSelectForm(form.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {selectedForms.has(form.id) ? (
                              <CheckSquare className="w-4 h-4 text-purple-600" />
                            ) : (
                              <Square className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>

                        {/* Menu Button */}
                        <div className="absolute top-4 right-4">
                          <button
                            onClick={() => setShowMenu(showMenu === form.id ? null : form.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
                          >
                            <MoreVertical className="w-4 h-4 text-gray-500" />
                          </button>
                          
                          {showMenu === form.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                              {activeTab === 'inbox' && (
                                <>
                                  <button
                                    onClick={() => handleMenuAction('share', form.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <Share className="w-4 h-4 mr-2" />
                                    Copy Share Link
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('archive', form.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                  >
                                    <Archive className="w-4 h-4 mr-2" />
                                    Archive
                                  </button>
                                  <button
                                    onClick={() => handleMenuAction('trash', form.id)}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Move to Trash
                                  </button>
                                </>
                              )}
                              
                              {(activeTab === 'archive' || activeTab === 'trash') && (
                                <button
                                  onClick={() => handleMenuAction('restore', form.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                                >
                                  <RotateCcw className="w-4 h-4 mr-2" />
                                  Restore to Inbox
                                </button>
                              )}
                              
                              {activeTab === 'trash' && (
                                <button
                                  onClick={() => handleMenuAction('delete', form.id)}
                                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Delete Permanently
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mb-4 mt-6">
                          <h3 className="font-semibold text-gray-900 text-lg mb-2 pr-8 group-hover:text-purple-600 transition-colors">
                            {form.name}
                          </h3>
                        </div>

                        {/* Enhanced Stats */}
                        <div className="grid grid-cols-3 gap-3 mb-4">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-center mb-1">
                              <Users className="w-4 h-4 text-blue-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">{stats.responses}</p>
                            <p className="text-xs text-gray-500">Responses</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-center mb-1">
                              <Eye className="w-4 h-4 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">{stats.views}</p>
                            <p className="text-xs text-gray-500">Views</p>
                          </div>
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <div className="flex items-center justify-center mb-1">
                              <TrendingUp className="w-4 h-4 text-purple-600" />
                            </div>
                            <p className="text-sm font-medium text-gray-900">{stats.conversionRate}%</p>
                            <p className="text-xs text-gray-500">Rate</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(form.updatedAt).toLocaleDateString()}</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            form.status === 'published' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {form.status}
                          </span>
                        </div>

                        {activeTab === 'inbox' && (
                          <div className="grid grid-cols-2 gap-2">
                            <Link
                              to={`/form-builder/${form.id}`}
                              className="flex items-center justify-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-200 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </Link>
                            <Link
                              to={`/form-preview/${form.id}`}
                              className="flex items-center justify-center space-x-1 bg-purple-600 text-white px-3 py-2 rounded text-sm hover:bg-purple-700 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                              <span>Preview</span>
                            </Link>
                            <Link
                              to={`/form-responses/${form.id}`}
                              className="flex items-center justify-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                            >
                              <BarChart3 className="w-4 h-4" />
                              <span>Responses</span>
                            </Link>
                            <button
                              onClick={() => handleMenuAction('share', form.id)}
                              className="flex items-center justify-center space-x-1 bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Share</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirm Action
            </h3>
            <p className="text-gray-600 mb-6">
              {getConfirmMessage()}
            </p>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowConfirmModal(null)}
                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`flex-1 px-4 py-2 rounded-lg transition-colors text-white ${
                  showConfirmModal.action === 'restore' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click outside to close menu */}
      {showMenu && (
        <div
          className="fixed inset-0 z-5"
          onClick={() => setShowMenu(null)}
        />
      )}
    </div>
  );
};

export default MyForms;