import React, { useState } from 'react';
import { formAPI } from '../services/api';

const APITest = () => {
  const [testResults, setTestResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createdFormId, setCreatedFormId] = useState(null);

  const addTestResult = (test, success, data = null, error = null) => {
    const result = {
      id: Date.now(),
      test,
      success,
      data,
      error: error?.message || error,
      timestamp: new Date().toLocaleTimeString()
    };
    setTestResults(prev => [result, ...prev]);
    return result;
  };

  const clearResults = () => {
    setTestResults([]);
    setCreatedFormId(null);
  };

  // Test 1: Create a new form
  const testCreateForm = async () => {
    try {
      setIsLoading(true);
      const formData = {
        title: `Test Form ${Date.now()}`,
        fields: [
          {
            id: 'field-1',
            type: 'text',
            label: 'Full Name',
            placeholder: 'Enter your full name',
            required: true
          },
          {
            id: 'field-2', 
            type: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true
          }
        ]
      };

      const result = await formAPI.createForm(formData);
      
      if (result.success) {
        setCreatedFormId(result.data._id);
        addTestResult('CREATE Form', true, result.data);
      } else {
        addTestResult('CREATE Form', false, null, result.message);
      }
    } catch (error) {
      addTestResult('CREATE Form', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 2: Get all forms
  const testGetAllForms = async () => {
    try {
      setIsLoading(true);
      const result = await formAPI.getAllForms({
        page: 1,
        limit: 5,
        sortBy: 'updatedAt',
        sortOrder: 'desc'
      });
      
      if (result.success) {
        addTestResult('GET All Forms', true, {
          formsCount: result.data.forms.length,
          totalCount: result.data.pagination.totalCount,
          pagination: result.data.pagination
        });
      } else {
        addTestResult('GET All Forms', false, null, result.message);
      }
    } catch (error) {
      addTestResult('GET All Forms', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 3: Get form by ID (uses the created form)
  const testGetFormById = async () => {
    if (!createdFormId) {
      addTestResult('GET Form by ID', false, null, 'No form created yet. Run CREATE test first.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await formAPI.getFormById(createdFormId);
      
      if (result.success) {
        addTestResult('GET Form by ID', true, {
          formId: result.data._id,
          title: result.data.title,
          fieldsCount: result.data.fields.length,
          status: result.data.status
        });
      } else {
        addTestResult('GET Form by ID', false, null, result.message);
      }
    } catch (error) {
      addTestResult('GET Form by ID', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 4: Update form
  const testUpdateForm = async () => {
    if (!createdFormId) {
      addTestResult('UPDATE Form', false, null, 'No form created yet. Run CREATE test first.');
      return;
    }

    try {
      setIsLoading(true);
      const updateData = {
        title: `Updated Test Form ${Date.now()}`,
        status: 'published',
        fields: [
          {
            id: 'field-1',
            type: 'text', 
            label: 'Full Name (Updated)',
            placeholder: 'Enter your full name here',
            required: true
          },
          {
            id: 'field-2',
            type: 'email',
            label: 'Email Address',
            placeholder: 'Enter your email',
            required: true
          },
          {
            id: 'field-3',
            type: 'textarea',
            label: 'Message',
            placeholder: 'Enter your message',
            required: false
          }
        ]
      };

      const result = await formAPI.updateForm(createdFormId, updateData);
      
      if (result.success) {
        addTestResult('UPDATE Form', true, {
          formId: result.data._id,
          title: result.data.title,
          status: result.data.status,
          fieldsCount: result.data.fields.length
        });
      } else {
        addTestResult('UPDATE Form', false, null, result.message);
      }
    } catch (error) {
      addTestResult('UPDATE Form', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // Test 5: Delete form
  const testDeleteForm = async () => {
    if (!createdFormId) {
      addTestResult('DELETE Form', false, null, 'No form created yet. Run CREATE test first.');
      return;
    }

    try {
      setIsLoading(true);
      const result = await formAPI.deleteForm(createdFormId);
      
      if (result.success) {
        addTestResult('DELETE Form', true, { message: result.message });
        setCreatedFormId(null);
      } else {
        addTestResult('DELETE Form', false, null, result.message);
      }
    } catch (error) {
      addTestResult('DELETE Form', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Form API Integration Test</h2>
      
      {/* Test Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-wrap gap-3">
          <button
            onClick={testCreateForm}
            disabled={isLoading}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            1. Test CREATE Form
          </button>
          
          <button
            onClick={testGetAllForms}
            disabled={isLoading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            2. Test GET All Forms
          </button>
          
          <button
            onClick={testGetFormById}
            disabled={isLoading || !createdFormId}
            className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 disabled:opacity-50"
          >
            3. Test GET Form by ID
          </button>
          
          <button
            onClick={testUpdateForm}
            disabled={isLoading || !createdFormId}
            className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:opacity-50"
          >
            4. Test UPDATE Form
          </button>
          
          <button
            onClick={testDeleteForm}
            disabled={isLoading || !createdFormId}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
          >
            5. Test DELETE Form
          </button>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={clearResults}
            disabled={isLoading}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
          >
            Clear Results
          </button>
          
          {createdFormId && (
            <div className="flex items-center text-sm text-gray-600">
              <span className="font-medium">Test Form ID:</span>
              <span className="ml-2 font-mono bg-gray-100 px-2 py-1 rounded">{createdFormId}</span>
            </div>
          )}
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-blue-800">Running API test...</span>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-700">Test Results:</h3>
        
        {testResults.length === 0 ? (
          <p className="text-gray-500 italic">No tests run yet. Click the buttons above to test the API integration.</p>
        ) : (
          testResults.map((result) => (
            <div
              key={result.id}
              className={`p-4 rounded border-l-4 ${
                result.success 
                  ? 'bg-green-50 border-green-500 text-green-800' 
                  : 'bg-red-50 border-red-500 text-red-800'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="font-semibold">{result.test}</span>
                <span className="text-sm opacity-75">{result.timestamp}</span>
              </div>
              
              <div className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                Status: {result.success ? '✅ SUCCESS' : '❌ FAILED'}
              </div>
              
              {result.data && (
                <div className="mt-2">
                  <strong>Data:</strong>
                  <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.error && (
                <div className="mt-2">
                  <strong>Error:</strong>
                  <pre className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto">
                    {JSON.stringify(result.error, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
      
      {/* Instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded border">
        <h4 className="font-semibold text-gray-700 mb-2">Testing Instructions:</h4>
        <ol className="text-sm text-gray-600 space-y-1">
          <li>1. First, run "Test CREATE Form" to create a new form in the database</li>
          <li>2. Then run "Test GET All Forms" to verify you can retrieve forms</li>
          <li>3. Run "Test GET Form by ID" to get the specific form you created</li>
          <li>4. Run "Test UPDATE Form" to modify the form</li>
          <li>5. Finally, run "Test DELETE Form" to clean up</li>
        </ol>
        <p className="text-xs text-gray-500 mt-2">
          Note: Make sure you're logged in with a valid token for the tests to work.
        </p>
      </div>
    </div>
  );
};

export default APITest;
