/**
 * App Configuration
 */

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mohamedtaha2600-almanara-ai-engine.hf.space/api';

export const getApiUrl = (path: string) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
