/**
 * API Service Client for Aynkaran Consultants Backend App Server
 * Automatically communicates with standard Express /api endpoint schema.
 */

const API_BASE = '/api';

/**
 * Helper to execute standard JSON requests
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errText = await response.text().catch(() => 'Unknown API Error');
    throw new Error(`API Error [${response.status}]: ${errText}`);
  }
  
  return response.json();
}

export const apiService = {
  // --- HEALTH / STATUS ---
  getHealth: () => request('/health'),

  // --- CUSTOMER PROFILE ERP ---
  getCustomers: () => request('/customers'),
  createCustomer: (customer) => request('/customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  }),
  updateCustomer: (id, customer) => request(`/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(customer)
  }),
  deleteCustomer: (id) => request(`/customers/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // --- AGENT RECRUITMENT PIPELINE CANDIDATES ---
  getCandidates: () => request('/candidates'),
  createCandidate: (candidate) => request('/candidates', {
    method: 'POST',
    body: JSON.stringify(candidate)
  }),
  updateCandidate: (id, candidate) => request(`/candidates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(candidate)
  }),
  deleteCandidate: (id) => request(`/candidates/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // --- POLICY SALES LIFECYCLE ---
  getPolicies: () => request('/policies'),
  createPolicy: (policy) => request('/policies', {
    method: 'POST',
    body: JSON.stringify(policy)
  }),
  updatePolicy: (id, policy) => request(`/policies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(policy)
  }),
  deletePolicy: (id) => request(`/policies/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // --- TRIGGER REMINDERS CONSOLE ---
  getReminders: () => request('/reminders'),
  createReminder: (reminder) => request('/reminders', {
    method: 'POST',
    body: JSON.stringify(reminder)
  }),
  updateReminder: (id, reminder) => request(`/reminders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(reminder)
  }),

  // --- BATCH HARMONIZED REALTIME SYNC ---
  syncDatabase: (data) => request('/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  })
};
