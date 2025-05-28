import { BASE_URL } from '@/lib/env/api-config';

// API Configuration - Use consistent BASE_URL across all APIs
export const API_URL = BASE_URL;

// Email Generation API endpoints
export const EMAIL_GENERATION_API = {
  GENERATE: `${API_URL}/api/generate-email`
};

// Other configuration constants can be added here as needed 