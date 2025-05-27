// Authentication utility functions
import React from 'react';
import ReactDOM from 'react-dom';

// Session Expiration Modal Component
const SessionExpiredModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-slideInUp transform transition-all">
        <div className="flex items-center mb-4">
          <div className="bg-red-100 p-3 rounded-full mr-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-900">Session Expired</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-700 mb-4">
            Your session has expired due to inactivity. For your security, please log in again to continue.
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium transition-colors"
          >
            Log In Again
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * Shows a styled session expired modal
 */
export const showSessionExpiredModal = () => {
  // Create a div for the modal
  const modalRoot = document.createElement('div');
  modalRoot.id = 'session-expired-modal';
  document.body.appendChild(modalRoot);
  
  // Handle closing the modal and redirecting to login
  const handleClose = () => {
    // Clear auth data
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('userId');
    
    // Remove the modal from DOM
    ReactDOM.unmountComponentAtNode(modalRoot);
    document.body.removeChild(modalRoot);
    
    // Reload the page to redirect to login
    window.location.reload();
  };
  
  // Render the modal
  ReactDOM.render(<SessionExpiredModal onClose={handleClose} />, modalRoot);
};

/**
 * Handles token expiration or invalid token errors
 * @param {string} errorMessage - The error message from the API
 * @returns {boolean} - True if the error was handled (token expired), false otherwise
 */
export const handleTokenError = (errorMessage) => {
  if (errorMessage && (
    errorMessage.includes('Invalid token') || 
    errorMessage.includes('expired') || 
    errorMessage.includes('No token provided')
  )) {
    // Show styled modal instead of alert
    showSessionExpiredModal();
    return true;
  }
  return false;
};

/**
 * Checks if the current token is valid
 * @returns {Promise<boolean>} - True if token is valid, false otherwise
 */
export const validateToken = async () => {
  const token = localStorage.getItem('token');
  if (!token) return false;
  
  try {
    // Use the dedicated endpoint for token validation
    const res = await fetch('http://localhost:5000/api/auth/validate-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.status === 200) {
      const data = await res.json();
      return data.valid === true;
    }
    
    return false;
  } catch (err) {
    console.error('Error validating token:', err);
    return false;
  }
}; 