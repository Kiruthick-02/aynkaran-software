// Central API configuration for production and development
let baseUrl = import.meta.env.VITE_API_URL || '';

// Fallback to relative paths on active container instances (Google development/preview containers, localhost)
if (typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (!host || host.includes('run.app') || host.includes('localhost') || host.includes('127.0.0.1')) {
    baseUrl = '';
  }
}

if (baseUrl) {
  // If a domain was supplied without http/https protocol, automatically prepend https://
  if (!baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
    baseUrl = `https://${baseUrl}`;
  }
  // Remove any trailing slash to prevent double slashes in constructed URLs
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }
}

const API_URL = baseUrl;
export default API_URL;
