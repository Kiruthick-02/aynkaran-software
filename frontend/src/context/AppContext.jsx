import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aynakaran_auth') === 'true';
  });
  const [adminUser, setAdminUser] = useState(() => {
    return localStorage.getItem('aynakaran_user') || 'admin';
  });

  // Tab navigation selection state
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('ayn_active_tab') || 'dashboard';
  });

  // Core Entity States (Pre-populate with local storage or empty fallback arrays)
  const [customers, setCustomers] = useState(() => {
    const cached = localStorage.getItem('ayn_customers');
    return cached ? JSON.parse(cached) : [];
  });

  const [candidates, setCandidates] = useState(() => {
    const cached = localStorage.getItem('ayn_candidates');
    return cached ? JSON.parse(cached) : [];
  });

  const [policies, setPolicies] = useState(() => {
    const cached = localStorage.getItem('ayn_policies');
    return cached ? JSON.parse(cached) : [];
  });

  const [reminders, setReminders] = useState(() => {
    const cached = localStorage.getItem('ayn_reminders');
    return cached ? JSON.parse(cached) : [];
  });

  const [isServerLoaded, setIsServerLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  // Synchronize changes to LocalStorage on updates
  useEffect(() => {
    localStorage.setItem('ayn_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('ayn_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('ayn_candidates', JSON.stringify(candidates));
  }, [candidates]);

  useEffect(() => {
    localStorage.setItem('ayn_policies', JSON.stringify(policies));
  }, [policies]);

  useEffect(() => {
    localStorage.setItem('ayn_reminders', JSON.stringify(reminders));
  }, [reminders]);

  /**
   * Load entire harmonized database dataset from MongoDB Express server
   */
  const loadStateFromServer = useCallback(async () => {
    console.log('[System] Fetching latest CRM states from MongoDB database server...');
    try {
      const [custs, cands, pols, rems] = await Promise.all([
        apiService.getCustomers(),
        apiService.getCandidates(),
        apiService.getPolicies(),
        apiService.getReminders()
      ]);

      // Safely load caches
      const cachedCusts = JSON.parse(localStorage.getItem('ayn_customers') || '[]');
      const cachedCands = JSON.parse(localStorage.getItem('ayn_candidates') || '[]');
      const cachedPols = JSON.parse(localStorage.getItem('ayn_policies') || '[]');
      const cachedRems = JSON.parse(localStorage.getItem('ayn_reminders') || '[]');

      let resolvedCusts = Array.isArray(custs) ? custs : [];
      let resolvedCands = Array.isArray(cands) ? cands : [];
      let resolvedPols = Array.isArray(pols) ? pols : [];
      let resolvedRems = Array.isArray(rems) ? rems : [];

      // If server is active but has completely empty data structures while client holds offline cache, push payload to serve as database truth
      if (
        (resolvedCusts.length === 0 && cachedCusts.length > 0) ||
        (resolvedPols.length === 0 && cachedPols.length > 0) ||
        (resolvedCands.length === 0 && cachedCands.length > 0)
      ) {
        console.log('[System Sync] Server database appears default or unpopulated. Synchronizing local cache records into database backend...');
        const payload = {
          customers: resolvedCusts.length > 0 ? resolvedCusts : cachedCusts,
          candidates: resolvedCands.length > 0 ? resolvedCands : cachedCands,
          policies: resolvedPols.length > 0 ? resolvedPols : cachedPols,
          reminders: resolvedRems.length > 0 ? resolvedRems : cachedRems,
        };
        try {
          await apiService.syncDatabase(payload);
          resolvedCusts = payload.customers;
          resolvedCands = payload.candidates;
          resolvedPols = payload.policies;
          resolvedRems = payload.reminders;
        } catch (syncErr) {
          console.error('[System Sync] Bulk push to empty database failed:', syncErr);
        }
      }

      resolvedCusts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setCustomers(resolvedCusts);

      resolvedCands.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setCandidates(resolvedCands);

      resolvedPols.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setPolicies(resolvedPols);

      resolvedRems.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
      setReminders(resolvedRems);

      setIsOnline(true);
      setIsServerLoaded(true);
      console.log('[System] State synchronized successfully with backend database.');
    } catch (error) {
      console.warn('[Sync Error] Failed to stream from back-end REST API, utilizing local cache:', error);
      setIsOnline(false);
      // Soft-load local cache as loaded
      setIsServerLoaded(true);
    }
  }, []);

  // Sync state from server once on load
  useEffect(() => {
    loadStateFromServer();
  }, [loadStateFromServer]);

  // Authentication handlers (Standard login logic)
  const login = (username, password) => {
    const trimmedUser = username.trim();
    if (trimmedUser === 'admin' && password === 'admin@aynakaran') {
      setIsAuthenticated(true);
      setAdminUser(trimmedUser);
      localStorage.setItem('aynakaran_auth', 'true');
      localStorage.setItem('aynakaran_user', trimmedUser);
      return { success: true };
    }
    return { success: false, error: 'Invalid Administrator token or passcode credentials.' };
  };

  const logout = () => {
    setIsAuthenticated(false);
    setAdminUser('admin');
    localStorage.removeItem('aynakaran_auth');
    localStorage.removeItem('aynakaran_user');
  };

  // --- ACTIONS: CUSTOMER CRM SYSTEM ---
  const addCustomer = async (cust) => {
    const custId = cust.id || `cust-${Date.now().toString().substring(7)}`;
    const newCust = {
      ...cust,
      id: custId,
      createdAt: cust.createdAt || new Date().toISOString()
    };

    // Optimistic frontend update
    setCustomers(prev => [newCust, ...prev]);

    try {
      const created = await apiService.createCustomer(newCust);
      if (created && created.success !== false) {
        setIsOnline(true);
        // Sync back standard verified entity
        setCustomers(prev => prev.map(c => c.id === custId ? { ...newCust, ...created.data } : c));
        return { ...newCust, ...created.data };
      }
    } catch (err) {
      console.error('[API Create Customer Error]', err);
    }
    return newCust;
  };

  const updateCustomer = async (id, updatedFields) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));

    try {
      await apiService.updateCustomer(id, updatedFields);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Customer Error]', err);
    }
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    try {
      await apiService.deleteCustomer(id);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Delete Customer Error]', err);
    }
  };

  // --- ACTIONS: AGENT RECRUITMENT PIPELINE ---
  const addCandidate = async (cand) => {
    const candId = cand.id || `cand-${Date.now().toString().substring(7)}`;
    const newCand = {
      ...cand,
      id: candId,
      pendingStageSince: cand.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: cand.createdAt || new Date().toISOString()
    };

    setCandidates(prev => [newCand, ...prev]);

    try {
      const created = await apiService.createCandidate(newCand);
      if (created) {
        setIsOnline(true);
        setCandidates(prev => prev.map(c => c.id === candId ? { ...newCand, ...created.data } : c));
        return { ...newCand, ...created.data };
      }
    } catch (err) {
      console.error('[API Create Candidate Error]', err);
    }
    return newCand;
  };

  const updateCandidate = async (id, updatedFields) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));

    try {
      await apiService.updateCandidate(id, updatedFields);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Candidate Error]', err);
    }
  };

  const deleteCandidate = async (id) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    try {
      await apiService.deleteCandidate(id);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Delete Candidate Error]', err);
    }
  };

  // --- ACTIONS: POLICY SALES SYSTEM ---
  const addPolicy = async (policy) => {
    const polId = policy.id || `pol-${Date.now().toString().substring(7)}`;
    const newPolicy = {
      ...policy,
      id: polId,
      pendingStageSince: policy.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: policy.createdAt || new Date().toISOString()
    };

    setPolicies(prev => [newPolicy, ...prev]);

    try {
      const created = await apiService.createPolicy(newPolicy);
      if (created) {
        setIsOnline(true);
        setPolicies(prev => prev.map(p => p.id === polId ? { ...newPolicy, ...created.data } : p));
        return { ...newPolicy, ...created.data };
      }
    } catch (err) {
      console.error('[API Create Policy Error]', err);
    }
    return newPolicy;
  };

  const updatePolicy = async (id, updatedFields) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    try {
      await apiService.updatePolicy(id, updatedFields);
      setIsOnline(true);
      loadStateFromServer();
    } catch (err) {
      console.error('[API Update Policy Error]', err);
    }
  };

  const deletePolicy = async (id) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    try {
      await apiService.deletePolicy(id);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Delete Policy Error]', err);
    }
  };

  // --- ACTIONS: ALERTS & REMINDERS ---
  const addReminder = async (rem) => {
    const remId = rem.id || `rem-${Date.now().toString().substring(7)}`;
    const newRem = {
      ...rem,
      id: remId,
      createdAt: rem.createdAt || new Date().toISOString()
    };

    setReminders(prev => [newRem, ...prev]);

    try {
      await apiService.createReminder(newRem);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Create Reminder Error]', err);
    }
  };

  const updateReminder = async (id, updatedFields) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    try {
      await apiService.updateReminder(id, updatedFields);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Reminder Error]', err);
    }
  };

  const deleteReminder = async (id) => {
    setReminders(prev => prev.filter(r => r.id !== id));
    try {
      await apiService.deleteReminder(id);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Delete Reminder Error]', err);
    }
  };

  const toggleReminder = (id) => {
    const target = reminders.find(r => r.id === id);
    if (target) {
      updateReminder(id, { completed: !target.completed });
    }
  };

  const triggerAutomatedReminders = async () => {
    try {
      const res = await apiService.triggerCronScan();
      if (res && res.reminders) {
        setReminders(res.reminders);
      }
      setIsOnline(true);
      return res;
    } catch (err) {
      console.error('[API Trigger Automated Reminders Error]', err);
    }
  };

  return (
    <AppContext.Provider value={{
      isAuthenticated,
      adminUser,
      activeTab,
      setActiveTab,
      customers,
      setCustomers,
      candidates,
      setCandidates,
      policies,
      setPolicies,
      reminders,
      setReminders,
      isOnline,
      isServerLoaded,
      loadStateFromServer,
      login,
      logout,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addCandidate,
      updateCandidate,
      deleteCandidate,
      addPolicy,
      updatePolicy,
      deletePolicy,
      addReminder,
      updateReminder,
      deleteReminder,
      toggleReminder,
      triggerAutomatedReminders
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
