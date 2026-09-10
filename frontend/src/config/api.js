//src/config/api.js
// Central API configuration for production and development
const configuredApiUrl = String(import.meta.env.VITE_API_URL || '').trim();
const deployedBackendUrl = 'https://aynkaran-backend.onrender.com';
let baseUrl = configuredApiUrl || (import.meta.env.PROD ? deployedBackendUrl : 'http://localhost:7860');

// Fallback to relative paths on active container instances (Google development/preview containers, localhost)
if (!configuredApiUrl && typeof window !== 'undefined') {
  const host = window.location.hostname;
  if (
    !host ||
    host.includes('run.app') ||
    host.includes('hf.space') ||
    host.includes('localhost') ||
    host.includes('127.0.0.1')
  ) {
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

export function resolveApiUrl(value) {
  if (!value) return value;

  const stringValue = String(value);
  if (/^(blob:|data:)/i.test(stringValue)) return stringValue;

  if (/^https?:\/\//i.test(stringValue)) {
    try {
      const url = new URL(stringValue);
      const isLocalApi =
        ['localhost', '127.0.0.1'].includes(url.hostname) &&
        ['5000', '7860'].includes(url.port);

      return isLocalApi ? `${url.pathname}${url.search}${url.hash}` : stringValue;
    } catch {
      return stringValue;
    }
  }

  return `${API_URL}${stringValue.startsWith('/') ? stringValue : `/${stringValue}`}`;
}

export default API_URL;
