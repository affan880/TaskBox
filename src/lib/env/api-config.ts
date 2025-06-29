/**
 * API Configuration
 * 
 * This file contains configuration constants for all APIs used in the application.
 * Update the BASE_URL depending on your environment (development, staging, production).
 */

// Environment-specific feature flags for API endpoints
const DEVELOPMENT_FEATURES = {
  EMAIL_ANALYSIS: true,
  EMAIL_SUMMARIZATION: true,
  EMAIL_GENERATION: true,
  INTENT_DETECTION: true,
};

const PRODUCTION_FEATURES = {
  EMAIL_ANALYSIS: true, // Backend is deployed and working
  EMAIL_SUMMARIZATION: true, // Backend is deployed and working
  EMAIL_GENERATION: true, // Backend is deployed and working
  INTENT_DETECTION: true, // Backend is deployed and working
};

// Feature flags for API endpoints
export const API_FEATURES = __DEV__ ? DEVELOPMENT_FEATURES : PRODUCTION_FEATURES;

// Base URL for all API endpoints
export const API_CONFIG = {
  // Development environment - use production URL if local server is not available
  dev: {
    BASE_URL: process.env.BASE_URL || 'https://taskbox-backend-production.up.railway.app', // Use production as fallback
  },
  
  // Staging environment
  staging: {
    BASE_URL: process.env.BASE_URL || 'https://taskbox-backend-production.up.railway.app', // Replace with your staging API URL
  },
  
  // Production environment
  prod: {
    BASE_URL: process.env.BASE_URL || 'https://taskbox-backend-production.up.railway.app', // Production Railway URL
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
console.log('🔧 API Config - Environment:', ENVIRONMENT);
console.log('🔧 API Config - process.env.BASE_URL:', process.env.BASE_URL);
console.log('🔧 API Config - Configured URL:', BASE_URL);
console.log('🔧 API Config - Features enabled:', API_FEATURES);

// Helper function to check if an API feature is enabled
export const isFeatureEnabled = (feature: keyof typeof API_FEATURES): boolean => {
  return API_FEATURES[feature];
}; 
