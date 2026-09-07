//frontend/src/services/companyApi.js

import API_URL from '../config/api';

const base = `${API_URL}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${base}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || res.statusText || 'Request failed');
  }
  return res.json();
}

export const companyApi = {
  getAll: () => request('/companies'),

  create: (data) =>
    request('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // Multipart (logo + background)
  createWithFiles: (formData) =>
    fetch(`${base}/companies`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    }),

  update: (id, data) =>
    request(`/companies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  updateWithFiles: (id, formData) =>
    fetch(`${base}/companies/${id}`, {
      method: 'PUT',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || res.statusText);
      }
      return res.json();
    }),

  addScheme: (companyId, scheme) =>
    request(`/companies/${companyId}/policies`, {
      method: 'POST',
      body: JSON.stringify(scheme),
    }),

  updateScheme: (companyId, schemeId, data) =>
    request(`/companies/${companyId}/policies/${schemeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteScheme: (companyId, schemeId) =>
    request(`/companies/${companyId}/policies/${schemeId}`, {
      method: 'DELETE',
    }),

  getInsuranceTypes: () => request('/insurance-types'),
addInsuranceType: (name) =>
  request('/insurance-types', {
    method: 'POST',
    body: JSON.stringify({ name }),
  }),
};