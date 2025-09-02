import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "../contexts/FormContext";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import { Plus, FileText, Users, Eye } from "lucide-react";

const Dashboard = () => {
  const { forms, createForm, isLoadingForms } = useForm();
  const { user, isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleCreateForm = async () => {
    try {
      const newForm = await createForm({ name: "Untitled Form" });
      if (newForm && newForm.id) {
        navigate(`/form-builder/${newForm.id}`);
      } else {
        console.error("Form creation failed: no form returned or no ID");
      }
    } catch (error) {
      console.error("Failed to create form:", error);
    }
  };

  // Calculate simplified statistics from form data
  const stats = useMemo(() => {
    const inboxForms = forms.filter((form) => form.location === "inbox");
    const totalResponses = forms.reduce(
      (sum, form) => sum + (form.responses?.length || 0),
      0
    );
    const totalViews = forms.reduce((sum, form) => sum + (form.views || 0), 0);

    return {
      totalForms: inboxForms.length,
      totalResponses,
      totalViews,
      inboxForms,
    };
  }, [forms]);

  // Show loading state while authentication or forms are loading
  if (isLoading || (isLoadingForms && forms.length === 0)) {
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

  // Show message if not authenticated (shouldn't happen due to ProtectedRoute)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <p className="text-gray-600">
                Please log in to view your dashboard.
              </p>
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
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.name}! 👋
          </h1>
          <p className="text-gray-600 mt-2 text-sm sm:text-base">
            Here's what's happening with your forms today.
          </p>
        </div>

        {/* Stats Cards - Only 3 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Forms
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.totalForms}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 sm:w-6 sm:h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Responses
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.totalResponses}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Users className="w-4 h-4 sm:w-6 sm:h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">
                  Total Views
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {stats.totalViews}
                </p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Eye className="w-4 h-4 sm:w-6 sm:h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Recent Forms */}
        <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              Recent Forms
            </h2>
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
                <div
                  key={form.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md hover:border-purple-300 transition-all group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-gray-900 truncate text-sm sm:text-base group-hover:text-purple-600 transition-colors">
                      {form.name || form.title || 'Untitled Form'}
                    </h3>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        form.status === "published"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {form.status}
                    </span>
                  </div>
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
      </div>
    </div>
  );
};

export default Dashboard;
