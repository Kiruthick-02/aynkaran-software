// Central API configuration for production and development
let baseUrl = import.meta.env.VITE_API_URL || '';

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
