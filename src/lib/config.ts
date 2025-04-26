// API Configuration
export const API_URL = process.env.API_URL || 'http://192.168.1.50:3000/api';

// Email Generation API endpoints
export const EMAIL_GENERATION_API = {
  GENERATE: `${API_URL}/generate-email`
};

// Other configuration constants can be added here as needed 