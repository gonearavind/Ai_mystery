import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 3 minutes — allows adequate time for AI generation & fallbacks
});

/**
 * Extracts a human-readable, user-friendly error message from Axios errors
 * Conforms to the standard backend error response shape: { error: { code, message } }
 */
export const getErrorMessage = (error, fallback = 'An unexpected error occurred. Please try again.') => {
  if (error?.response?.data?.error?.message) {
    return error.response.data.error.message;
  }
  if (error?.response?.data?.message) {
    return error.response.data.message;
  }
  if (error?.message) {
    if (error.code === 'ECONNABORTED' || error.message.toLowerCase().includes('timeout')) {
      return 'Request timed out. The detective bureau took too long to respond.';
    }
    if (error.message.toLowerCase().includes('network error')) {
      return 'Unable to reach the server. Please check your internet connection and backend status.';
    }
    return error.message;
  }
  return fallback;
};

export default api;
