import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

const QRRedirect = () => {
  const { token } = useParams();

  useEffect(() => {
    // Redirect to backend QR handler
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const baseUrl = backendUrl.replace('/api', ''); // Remove /api suffix
    
    // Redirect to backend /q/:token route
    window.location.href = `${baseUrl}/q/${token}`;
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Redirecting...
        </h3>
        <p className="text-gray-600">
          Please wait while we redirect you to the form.
        </p>
      </div>
    </div>
  );
};

export default QRRedirect;
