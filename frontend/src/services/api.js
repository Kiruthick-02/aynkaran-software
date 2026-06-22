/**
 * API Service Client for Aynkaran Consultants Backend App Server
 * Automatically communicates with standard Express /api endpoint schema.
 */

import API_URL from '../config/api';

const API_BASE = API_URL ? `${API_URL}/api` : '/api';


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
  getCustomers: (role, username, supervise) => {
    let q = (role && username) ? `?role=${encodeURIComponent(role)}&username=${encodeURIComponent(username)}` : '';
    if (supervise) {
      q += q ? '&supervise=true' : '?supervise=true';
    }
    return request(`/customers${q}`);
  },
  createCustomer: (customer) => request('/customers', {
    method: 'POST',
    body: JSON.stringify(customer)
  }),
  updateCustomer: (id, customer) => request(`/customers/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(customer)
  }),
  deleteCustomer: (id, role, username, otp) => {
    let q = '';
    if (role && username) {
      q = `?role=${encodeURIComponent(role)}&username=${encodeURIComponent(username)}`;
      if (otp) q += `&otp=${encodeURIComponent(otp)}`;
    }
    return request(`/customers/${encodeURIComponent(id)}${q}`, {
      method: 'DELETE'
    });
  },

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
  getPolicies: (role, username, supervise) => {
    let q = (role && username) ? `?role=${encodeURIComponent(role)}&username=${encodeURIComponent(username)}` : '';
    if (supervise) {
      q += q ? '&supervise=true' : '?supervise=true';
    }
    return request(`/policies${q}`);
  },
  createPolicy: (policy) => request('/policies', {
    method: 'POST',
    body: JSON.stringify(policy)
  }),
  updatePolicy: (id, policy) => request(`/policies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(policy)
  }),
  deletePolicy: (id, role, username, otp) => {
    let q = '';
    if (role && username) {
      q = `?role=${encodeURIComponent(role)}&username=${encodeURIComponent(username)}`;
      if (otp) q += `&otp=${encodeURIComponent(otp)}`;
    }
    return request(`/policies/${encodeURIComponent(id)}${q}`, {
      method: 'DELETE'
    });
  },

  // --- TRIGGER REMINDERS CONSOLE ---
  getReminders: (role, username) => {
    const q = (role && username) ? `?role=${encodeURIComponent(role)}&username=${encodeURIComponent(username)}` : '';
    return request(`/reminders${q}`);
  },
  triggerCronScan: () => request('/reminders/trigger-cron', {
    method: 'POST'
  }),
  createReminder: (reminder) => request('/reminders', {
    method: 'POST',
    body: JSON.stringify(reminder)
  }),
  updateReminder: (id, reminder) => request(`/reminders/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(reminder)
  }),
  deleteReminder: (id) => request(`/reminders/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  }),

  // --- BATCH HARMONIZED REALTIME SYNC ---
  syncDatabase: (data) => request('/sync', {
    method: 'POST',
    body: JSON.stringify(data)
  }),

  // --- AUTH & STAFF MANAGEMENT SYSTEMS ---
  loginUser: (username, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  }),
  logoutUser: (username) => request('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ username })
  }),
  registerStaff: (username, password, displayName, requesterRole) => request('/auth/register-staff', {
    method: 'POST',
    body: JSON.stringify({ username, password, displayName, requesterRole })
  }),
  getStaffList: () => request('/auth/staff-list'),
  deleteStaff: (username) => request(`/auth/delete-staff/${encodeURIComponent(username)}`, {
    method: 'DELETE'
  }),
  getStaffLogs: () => request('/auth/staff-logs'),
  clearStaffLogs: () => request('/auth/staff-logs', {
    method: 'DELETE'
  }),
  requestDeleteOTP: (username, targetId, targetType, targetName) => request('/auth/request-otp', {
    method: 'POST',
    body: JSON.stringify({ username, targetId, targetType, targetName })
  }),

  // --- MULTIPART SECURE BINARY DOCUMENT UPLOADER ---
  uploadDocument: async (file, category, targetId, targetType) => {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('targetId', targetId);
    formData.append('targetType', targetType);
    formData.append('file', file);

    const response = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => 'Upload Error');
      throw new Error(`Upload Error [${response.status}]: ${errText}`);
    }

    return response.json();
  }
};
