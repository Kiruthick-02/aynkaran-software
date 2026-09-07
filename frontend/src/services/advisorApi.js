import API_URL from '../config/api';

const API_BASE = API_URL ? `${API_URL}/api` : '/api';

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
    let errMessage = 'Unknown API Error';
    try {
      const errJson = await response.json();
      errMessage = errJson.error || errJson.message || JSON.stringify(errJson);
    } catch {
      errMessage = await response.text().catch(() => `HTTP ${response.status}`);
    }
    const error = new Error(errMessage);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export const advisorApi = {
  getDashboardStats: () => request('/advisors/dashboard-stats'),
  getHierarchyOptions: () => request('/advisors/hierarchy-options'),
  getAdvisors: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.status && params.status !== 'All') query.append('status', params.status);
    if (params.insuranceCompany && params.insuranceCompany !== 'All') query.append('insuranceCompany', params.insuranceCompany);
    if (params.abp && params.abp !== 'All') query.append('abp', params.abp);
    if (params.level1Manager && params.level1Manager !== 'All') query.append('level1Manager', params.level1Manager);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    const qs = query.toString();
    return request(`/advisors${qs ? `?${qs}` : ''}`);
  },
  getAdvisor: (id) => request(`/advisors/${encodeURIComponent(id)}`),
  createAdvisor: (data) => request('/advisors', { method: 'POST', body: JSON.stringify(data) }),
  updateAdvisor: (id, data) => request(`/advisors/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAdvisor: (id, password) => request(`/advisors/${encodeURIComponent(id)}`, { method: 'DELETE', body: JSON.stringify({ password }) }),
  changeAdvisorStatus: (id, status, reason, changedBy = 'admin') => request(`/advisors/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status, reason, changedBy })
  }),
  convertCandidateToAdvisor: (candidateId, conversionData) => request(`/advisors/convert/${encodeURIComponent(candidateId)}`, {
    method: 'POST',
    body: JSON.stringify(conversionData)
  }),
  getAdvisorPolicies: (id) => request(`/advisors/${encodeURIComponent(id)}/policies`),
  getAdvisorCustomers: (id) => request(`/advisors/${encodeURIComponent(id)}/customers`),
  getAdvisorPerformance: (id, month, year) => {
    let q = '';
    if (month || year) {
      const sp = new URLSearchParams();
      if (month) sp.append('month', month);
      if (year) sp.append('year', year);
      q = `?${sp.toString()}`;
    }
    return request(`/advisors/${encodeURIComponent(id)}/performance${q}`);
  },
  getAdvisorCommission: (id) => request(`/advisors/${encodeURIComponent(id)}/commission`),
  getAdvisorMilestones: (id) => request(`/advisors/${encodeURIComponent(id)}/milestones`),
  updateAdvisorMilestone: (id, stageNumber, data) => request(`/advisors/${encodeURIComponent(id)}/milestones`, {
    method: 'PUT',
    body: JSON.stringify({ stageNumber, ...data })
  }),
  verifyDocument: (documentId, targetId, targetType = 'advisor', verifiedBy = 'admin') => request(`/documents/${encodeURIComponent(documentId)}/verify`, {
    method: 'PATCH',
    body: JSON.stringify({ targetId, targetType, verifiedBy })
  }),
  rejectDocument: (documentId, targetId, targetType = 'advisor', reason, rejectedBy = 'admin') => request(`/documents/${encodeURIComponent(documentId)}/reject`, {
    method: 'PATCH',
    body: JSON.stringify({ targetId, targetType, reason, rejectedBy })
  }),
  requestOtp: (username = 'admin', actionType = 'SENSITIVE_OPERATION', targetDetails = '') => request('/advisors/otp/request', {
    method: 'POST',
    body: JSON.stringify({ username, actionType, targetDetails })
  }),
  verifyOtp: (username = 'admin', actionType = 'SENSITIVE_OPERATION', otp) => request('/advisors/otp/verify', {
    method: 'POST',
    body: JSON.stringify({ username, actionType, otp })
  }),
  bulkSendReminders: (payload) => request('/advisors/reminders/bulk-send', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),
  exportAdvisorData: (reportType = 'MASTER', format = 'CSV') => request('/advisors/export', {
    method: 'POST',
    body: JSON.stringify({ reportType, format })
  }),
  uploadAdvisorDocument: async (file, category, targetId, targetType) => {
    const formData = new FormData();
    formData.append('category', category);
    formData.append('targetId', targetId);
    formData.append('targetType', targetType || (targetId && String(targetId).startsWith('cand') ? 'candidate' : 'advisor'));
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/documents/upload`, { method: 'POST', body: formData });
    if (!response.ok) {
      let errMessage = 'Upload Error';
      try {
        const errJson = await response.json();
        errMessage = errJson.error || errJson.message || JSON.stringify(errJson);
      } catch {
        errMessage = await response.text().catch(() => `HTTP ${response.status}`);
      }
      throw new Error(errMessage);
    }
    return response.json();
  }
};

export default advisorApi;
