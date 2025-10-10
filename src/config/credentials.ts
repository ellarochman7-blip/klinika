// Google AI Studio API Credentials Configuration
// 
// Credentials are now stored in localStorage
// Use the Settings modal in the app to configure your credentials
// Get your API key from: https://aistudio.google.com/app/apikey
//
// ⚠️ IMPORTANT: Paste your Google AI Studio API key in the Settings modal
// The key looks like: AIzaSy...

const STORAGE_KEYS = {
  API_KEY: 'google_ai_studio_api_key',
  PROJECT_ID: 'google_ai_model_name' // Optional: model name override
};

export interface StoredCredentials {
  apiKey: string | null;
  projectId: string | null;
}

// Get credentials from localStorage
export const getStoredCredentials = (): StoredCredentials => {
  return {
    apiKey: localStorage.getItem(STORAGE_KEYS.API_KEY),
    projectId: localStorage.getItem(STORAGE_KEYS.PROJECT_ID)
  };
};

// Save credentials to localStorage
export const saveCredentials = (apiKey: string, projectId: string): void => {
  localStorage.setItem(STORAGE_KEYS.API_KEY, apiKey);
  localStorage.setItem(STORAGE_KEYS.PROJECT_ID, projectId);
};

// Clear credentials from localStorage
export const clearCredentials = (): void => {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem(STORAGE_KEYS.PROJECT_ID);
};

// Dynamic config that reads from localStorage
export const getConfig = () => {
  const stored = getStoredCredentials();
  return {
    apiKey: stored.apiKey || '',
    modelName: stored.projectId || 'gemini-1.5-flash', // Default model
  };
};

// Validate configuration
export const validateConfig = (): boolean => {
  const stored = getStoredCredentials();
  
  if (!stored.apiKey) {
    console.error('Missing API key. Please configure your credentials in Settings.');
    return false;
  }
  // Model name is optional, has a default
  return true;
};

