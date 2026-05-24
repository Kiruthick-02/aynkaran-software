import React, { createContext, useContext, useState, useEffect } from 'react';
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

  // Load state from back-end server REST API on startup
  const loadStateFromServer = async () => {
    try {
      const [custData, candData, polData, remData] = await Promise.all([
        apiService.getCustomers(),
        apiService.getCandidates(),
        apiService.getPolicies(),
        apiService.getReminders()
      ]);

      setCustomers(custData);
      setCandidates(candData);
      setPolicies(polData);
      setReminders(remData);
      setIsOnline(true);
      console.log('Successfully connected and loaded database from Express API endpoints');
    } catch (err) {
      console.warn('Express back-end API unreachable, operating on local ERP cached storage.', err);
      setIsOnline(false);
    } finally {
      setIsServerLoaded(true);
    }
  };

  useEffect(() => {
    loadStateFromServer();
  }, []);

  // Synchronize changes to LocalStorage on updates (and push notifications back to backend API)
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

  // Bulk Synchronizer to push state changes to the Server API
  const pushStateToServer = async () => {
    if (!isServerLoaded) return;
    try {
      await apiService.syncDatabase({
        customers,
        candidates,
        policies,
        reminders
      });
      setIsOnline(true);
    } catch (error) {
      console.warn('Incremental data sync failure (Server offline):', error);
      setIsOnline(false);
    }
  };

  // Run a debounced synchronized push when state changes
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      pushStateToServer();
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [customers, candidates, policies, reminders, isServerLoaded]);

  // Authentication handlers
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
    // Optimistic UI updates
    const newCust = {
      ...cust,
      id: cust.id || `cust-${Date.now().toString().substring(7)}`,
      createdAt: cust.createdAt || new Date().toISOString()
    };
    
    setCustomers(prev => [newCust, ...prev]);
    
    // Server fallback
    try {
      await apiService.createCustomer(newCust);
    } catch (err) {
      console.warn('Failed optimistically syncing client to server:', err);
    }
    return newCust;
  };

  const updateCustomer = async (id, updatedFields) => {
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    try {
      await apiService.updateCustomer(id, updatedFields);
    } catch (err) {
      console.warn('Failed server update for customer profile:', err);
    }
  };

  const deleteCustomer = async (id) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    try {
      await apiService.deleteCustomer(id);
    } catch (err) {
      console.warn('Failed server delete for customer profile:', err);
    }
  };

  // --- ACTIONS: AGENT RECRUITMENT PIPELINE ---
  const addCandidate = async (cand) => {
    const newCand = {
      ...cand,
      id: cand.id || `cand-${Date.now().toString().substring(7)}`,
      pendingStageSince: cand.pendingStageSince || new Date().toISOString().split('T')[0]
    };
    setCandidates(prev => [newCand, ...prev]);
    try {
      await apiService.createCandidate(newCand);
    } catch (err) {
      console.warn('Failed optimistic candidate server creation:', err);
    }
    return newCand;
  };

  const updateCandidate = async (id, updatedFields) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));
    try {
      await apiService.updateCandidate(id, updatedFields);
    } catch (err) {
      console.warn('Failed server update for candidate profile:', err);
    }
  };

  const deleteCandidate = async (id) => {
    setCandidates(prev => prev.filter(c => c.id !== id));
    try {
      await apiService.deleteCandidate(id);
    } catch (err) {
      console.warn('Failed server delete for candidate:', err);
    }
  };

  // --- ACTIONS: POLICY SALES SYSTEM ---
  const addPolicy = async (policy) => {
    const newPolicy = {
      ...policy,
      id: policy.id || `pol-${Date.now().toString().substring(7)}`,
      pendingStageSince: policy.pendingStageSince || new Date().toISOString().split('T')[0]
    };
    setPolicies(prev => [newPolicy, ...prev]);
    try {
      await apiService.createPolicy(newPolicy);
    } catch (err) {
      console.warn('Failed optimistic policy server creation:', err);
    }
    return newPolicy;
  };

  const updatePolicy = async (id, updatedFields) => {
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, ...updatedFields } : p));
    try {
      await apiService.updatePolicy(id, updatedFields);
    } catch (err) {
      console.warn('Failed server update for policy lead:', err);
    }
  };

  const deletePolicy = async (id) => {
    setPolicies(prev => prev.filter(p => p.id !== id));
    try {
      await apiService.deletePolicy(id);
    } catch (err) {
      console.warn('Failed server delete for policy lead:', err);
    }
  };

  // --- ACTIONS: ALERTS & REMINDERS ---
  const addReminder = async (rem) => {
    const newRem = {
      ...rem,
      id: rem.id || `rem-${Date.now().toString().substring(7)}`,
      createdAt: rem.createdAt || new Date().toISOString()
    };
    setReminders(prev => [newRem, ...prev]);
    try {
      await apiService.createReminder(newRem);
    } catch (err) {
      console.warn('Failed optimistic reminder server entry:', err);
    }
  };

  const updateReminder = async (id, updatedFields) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, ...updatedFields } : r));
    try {
      await apiService.updateReminder(id, updatedFields);
    } catch (err) {
      console.warn('Failed server update for reminder task:', err);
    }
  };

  const toggleReminder = (id) => {
    const target = reminders.find(r => r.id === id);
    if (target) {
      updateReminder(id, { completed: !target.completed });
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
      toggleReminder
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
