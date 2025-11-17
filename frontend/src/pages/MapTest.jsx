import React from 'react';
import GoogleMap from '../components/GoogleMap';

const MapTest = () => {
  const handleLocationSelect = (location) => {
    console.log('Selected location:', location);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Google Maps API Test</h1>
          <p className="text-gray-600 mb-4">
            This page helps troubleshoot Google Maps API issues. Check the browser console for detailed error messages.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-800 mb-2">API Key Information</h3>
            <p className="text-sm text-blue-700">
              <strong>API Key:</strong> {import.meta.env.VITE_GOOGLE_MAPS_API_KEY ? 
                import.meta.env.VITE_GOOGLE_MAPS_API_KEY.substring(0, 8) + '...' : 
                'Not configured'}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              <strong>Environment:</strong> {import.meta.env.MODE}
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-3">Interactive Map Test</h2>
              <GoogleMap
                onLocationSelect={handleLocationSelect}
                height="400px"
                zoom={10}
                showUseMyLocationButton={true}
                showCoordinates={true}
                isInteractive={true}
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-800 mb-2">Troubleshooting Steps:</h3>
              <ol className="list-decimal list-inside text-sm text-gray-700 space-y-1">
                <li>Open browser developer tools (F12)</li>
                <li>Check the Console tab for detailed error messages</li>
                <li>Look for Google Maps API related errors</li>
                <li>Verify your API key has the required permissions</li>
                <li>Ensure billing is enabled in Google Cloud Console</li>
                <li>Check API restrictions (HTTP referrers)</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapTest;
