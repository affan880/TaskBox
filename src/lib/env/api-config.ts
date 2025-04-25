/**
 * API Configuration
 * 
 * This file contains configuration constants for all APIs used in the application.
 * Update the BASE_URL depending on your environment (development, staging, production).
 */

// Base URL for all API endpoints
export const API_CONFIG = {
  // Development environment
  dev: {
    BASE_URL: process.env.BASE_URL, // Ngrok URL
  },
  
  // Staging environment
  staging: {
    BASE_URL: 'https://api-staging.yourdomain.com', // Replace with your staging API URL
  },
  
  // Production environment
  prod: {
    BASE_URL: 'https://api.yourdomain.com', // Replace with your production API URL
  }
};

// Set the current environment
// In a real app, you might want to use environment variables to determine this
const ENVIRONMENT = __DEV__ ? 'dev' : 'prod';

// Export the configuration for the current environment
export const CURRENT_API_CONFIG = API_CONFIG[ENVIRONMENT];

// Export the BASE_URL directly for convenience
export const BASE_URL = CURRENT_API_CONFIG.BASE_URL; 

// Debug logging
if (__DEV__) {
  console.log('🔧 API Config - Environment:', ENVIRONMENT);
  console.log('🔧 API Config - process.env.BASE_URL:', process.env.BASE_URL);
  console.log('🔧 API Config - Configured URL:', BASE_URL);
} 
