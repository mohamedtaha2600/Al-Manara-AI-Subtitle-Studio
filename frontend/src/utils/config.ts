/**
 * App Configuration
 */

export const API_BASE_URL_CLOUD = 'https://mohamedtaha2600-almanara-ai-engine.hf.space/api';
export const API_BASE_URL_LOCAL = 'http://localhost:8000/api';

/**
 * Get API URL based on environment or override
 */
export const getApiUrl = (path: string, sourceOverride?: 'local' | 'cloud') => {
  // Use sourceOverride if provided, else detect based on hostname
  // We avoid importing useProjectStore here to prevent circular dependencies
  let engineSource = sourceOverride;
  
  if (!engineSource && typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    engineSource = isLocal ? 'local' : 'cloud';
  }

  const baseUrl = engineSource === 'cloud' 
    ? API_BASE_URL_CLOUD 
    : API_BASE_URL_LOCAL;

  if (!path) return baseUrl;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${baseUrl}/${cleanPath}`;
};

// Default API Base URL (Safe for import-time evaluation)
// We use a simple detection here to avoid circular dependency with the store
export const API_BASE_URL = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? API_BASE_URL_LOCAL 
    : API_BASE_URL_CLOUD;
