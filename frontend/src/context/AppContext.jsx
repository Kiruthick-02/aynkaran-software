<<<<<<< HEAD
// context/AppContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
=======
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
import { apiService } from '../services/api';

const AppContext = createContext();

export function AppProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('aynakaran_auth') === 'true';
  });
  const [adminUser, setAdminUser] = useState(() => {
    return localStorage.getItem('aynakaran_user') || 'admin';
  });
  const [userRole, setUserRole] = useState(() => {
<<<<<<< HEAD
    return (
      localStorage.getItem('aynakaran_role') ||
      (localStorage.getItem('aynakaran_user') === 'admin' ? 'SuperAdmin' : 'Staff')
    );
=======
    return localStorage.getItem('aynakaran_role') || (localStorage.getItem('aynakaran_user') === 'admin' ? 'SuperAdmin' : 'Staff');
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
  });

  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('ayn_active_tab') || 'dashboard';
  });

  const [customers, setCustomers] = useState(() => {
    const username = localStorage.getItem('aynakaran_user') || 'admin';
    const cached = localStorage.getItem(`ayn_customers_${username}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [candidates, setCandidates] = useState(() => {
    const username = localStorage.getItem('aynakaran_user') || 'admin';
    const cached = localStorage.getItem(`ayn_candidates_${username}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [policies, setPolicies] = useState(() => {
    const username = localStorage.getItem('aynakaran_user') || 'admin';
    const cached = localStorage.getItem(`ayn_policies_${username}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [reminders, setReminders] = useState(() => {
    const username = localStorage.getItem('aynakaran_user') || 'admin';
    const cached = localStorage.getItem(`ayn_reminders_${username}`);
    return cached ? JSON.parse(cached) : [];
  });

  const [isServerLoaded, setIsServerLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

<<<<<<< HEAD
=======
  // Synchronize changes to LocalStorage on updates (username-specific)
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
  useEffect(() => {
    if (!isServerLoaded) return;
    localStorage.setItem(`ayn_customers_${adminUser}`, JSON.stringify(customers));
  }, [customers, adminUser, isServerLoaded]);

  useEffect(() => {
    localStorage.setItem('ayn_active_tab', activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!isServerLoaded) return;
    localStorage.setItem(`ayn_candidates_${adminUser}`, JSON.stringify(candidates));
  }, [candidates, adminUser, isServerLoaded]);

  useEffect(() => {
    if (!isServerLoaded) return;
    localStorage.setItem(`ayn_policies_${adminUser}`, JSON.stringify(policies));
  }, [policies, adminUser, isServerLoaded]);

  useEffect(() => {
    if (!isServerLoaded) return;
    localStorage.setItem(`ayn_reminders_${adminUser}`, JSON.stringify(reminders));
  }, [reminders, adminUser, isServerLoaded]);

<<<<<<< HEAD
  const loadStateFromServer = useCallback(async () => {
    const isAuthenticatedFlag = localStorage.getItem('aynakaran_auth') === 'true';
    if (!isAuthenticatedFlag) return;

    try {
      const role =
        localStorage.getItem('aynakaran_role') ||
        (localStorage.getItem('aynakaran_user') === 'admin' ? 'SuperAdmin' : 'Staff');
=======
  /**
   * Load entire harmonized database dataset from MongoDB Express server
   */
  const loadStateFromServer = useCallback(async () => {
    const isAuthenticatedFlag = localStorage.getItem('aynakaran_auth') === 'true';
    if (!isAuthenticatedFlag) {
      return;
    }
    console.log('[System] Fetching latest CRM states from MongoDB database server...');
    try {
      const role = localStorage.getItem('aynakaran_role') || (localStorage.getItem('aynakaran_user') === 'admin' ? 'SuperAdmin' : 'Staff');
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      const username = localStorage.getItem('aynakaran_user') || 'admin';

      const [custs, cands, pols, rems] = await Promise.all([
        apiService.getCustomers(role, username),
        apiService.getCandidates(),
        apiService.getPolicies(role, username),
<<<<<<< HEAD
        apiService.getReminders(role, username),
      ]);

      const cachedCusts = JSON.parse(
        localStorage.getItem(`ayn_customers_${username}`) || '[]'
      );
      const cachedCands = JSON.parse(
        localStorage.getItem(`ayn_candidates_${username}`) || '[]'
      );
      const cachedPols = JSON.parse(
        localStorage.getItem(`ayn_policies_${username}`) || '[]'
      );
      const cachedRems = JSON.parse(
        localStorage.getItem(`ayn_reminders_${username}`) || '[]'
      );
=======
        apiService.getReminders(role, username)
      ]);

      // Safely load caches
      const cachedCusts = JSON.parse(localStorage.getItem(`ayn_customers_${username}`) || '[]');
      const cachedCands = JSON.parse(localStorage.getItem(`ayn_candidates_${username}`) || '[]');
      const cachedPols = JSON.parse(localStorage.getItem(`ayn_policies_${username}`) || '[]');
      const cachedRems = JSON.parse(localStorage.getItem(`ayn_reminders_${username}`) || '[]');
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

      let resolvedCusts = Array.isArray(custs) ? custs : [];
      let resolvedCands = Array.isArray(cands) ? cands : [];
      let resolvedPols = Array.isArray(pols) ? pols : [];
      let resolvedRems = Array.isArray(rems) ? rems : [];

<<<<<<< HEAD
=======
      // If server is active but has completely empty data structures while client holds offline cache, push payload to serve as database truth
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      if (
        (resolvedCusts.length === 0 && cachedCusts.length > 0) ||
        (resolvedPols.length === 0 && cachedPols.length > 0) ||
        (resolvedCands.length === 0 && cachedCands.length > 0)
      ) {
<<<<<<< HEAD
=======
        console.log('[System Sync] Server database appears default or unpopulated. Synchronizing local cache records into database backend...');
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
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
<<<<<<< HEAD
          console.error('[System Sync] Bulk push failed:', syncErr);
=======
          console.error('[System Sync] Bulk push to empty database failed:', syncErr);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
        }
      }

      if (role === 'Staff' && username) {
<<<<<<< HEAD
        resolvedCusts = resolvedCusts.filter((c) => c.createdBy === username);
        resolvedPols = resolvedPols.filter((p) => p.createdBy === username);
        resolvedRems = resolvedRems.filter((r) => {
          if (r.targetType === 'recruitment') return false;
          if (r.targetType === 'renewal') {
            return resolvedPols.some((p) => p.id === r.targetId);
          }
          return resolvedCusts.some((c) => c.id === r.targetId);
        });
      } else {
        resolvedPols = resolvedPols.filter(
          (p) => !p.createdBy || p.createdBy === 'admin'
        );
        resolvedCusts = resolvedCusts.filter(
          (c) => !c.createdBy || c.createdBy === 'admin'
        );
        resolvedRems = resolvedRems.filter((r) => {
          if (r.targetType === 'recruitment') return true;
          if (r.targetType === 'renewal') {
            const tgtPol = resolvedPols.find((p) => p.id === r.targetId);
            return tgtPol && (!tgtPol.createdBy || tgtPol.createdBy === 'admin');
          }
          const tgtCust = resolvedCusts.find((c) => c.id === r.targetId);
=======
        resolvedCusts = resolvedCusts.filter(c => c.createdBy === username);
        resolvedPols = resolvedPols.filter(p => p.createdBy === username);
        resolvedRems = resolvedRems.filter(r => {
          if (r.targetType === 'recruitment') return false;
          if (r.targetType === 'renewal') {
            return resolvedPols.some(p => p.id === r.targetId);
          }
          return resolvedCusts.some(c => c.id === r.targetId);
        });
      } else {
        // SuperAdmin restricts policies and customers to their own (not created by staff)
        resolvedPols = resolvedPols.filter(p => !p.createdBy || p.createdBy === 'admin');
        resolvedCusts = resolvedCusts.filter(c => !c.createdBy || c.createdBy === 'admin');

        // SuperAdmin restricts reminders to those created by 'admin' (their own) and recruitment (exclusive to Admin)
        resolvedRems = resolvedRems.filter(r => {
          if (r.targetType === 'recruitment') return true;
          if (r.targetType === 'renewal') {
            const tgtPol = resolvedPols.find(p => p.id === r.targetId);
            return tgtPol && (!tgtPol.createdBy || tgtPol.createdBy === 'admin');
          }
          const tgtCust = resolvedCusts.find(c => c.id === r.targetId);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          return tgtCust && (!tgtCust.createdBy || tgtCust.createdBy === 'admin');
        });
      }

<<<<<<< HEAD
      resolvedCusts.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      resolvedCands.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      resolvedPols.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );
      resolvedRems.sort(
        (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
      );

      setCustomers(resolvedCusts);
      setCandidates(resolvedCands);
      setPolicies(resolvedPols);
      setReminders(resolvedRems);
      setIsOnline(true);
      setIsServerLoaded(true);
    } catch (error) {
      console.warn('[Sync Error] Using local cache:', error);
      setIsOnline(false);
=======
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
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      setIsServerLoaded(true);
    }
  }, []);

<<<<<<< HEAD
  useEffect(() => {
    loadStateFromServer();
    const interval = setInterval(() => loadStateFromServer(), 6000);
    return () => clearInterval(interval);
  }, [loadStateFromServer]);

=======
  // Sync state from server once on load and run background interval every 6 seconds to update automatically
  useEffect(() => {
    loadStateFromServer();

    const interval = setInterval(() => {
      loadStateFromServer();
    }, 6000);

    return () => clearInterval(interval);
  }, [loadStateFromServer]);

  // Authentication handlers (Standard login logic)
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
  const login = async (username, password) => {
    try {
      const response = await apiService.loginUser(username, password);
      if (response && response.success) {
        const loggedUser = response.user;
        setIsServerLoaded(false);
        setIsAuthenticated(true);
        setAdminUser(loggedUser.username);
        setUserRole(loggedUser.role);
<<<<<<< HEAD
        localStorage.setItem('aynakaran_auth', 'true');
        localStorage.setItem('aynakaran_user', loggedUser.username);
        localStorage.setItem('aynakaran_role', loggedUser.role);
        setTimeout(() => loadStateFromServer(), 100);
        return { success: true };
      }
      return {
        success: false,
        error: response.error || 'Authentication error.',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Invalid Username or Password!',
      };
=======
        
        localStorage.setItem('aynakaran_auth', 'true');
        localStorage.setItem('aynakaran_user', loggedUser.username);
        localStorage.setItem('aynakaran_role', loggedUser.role);

        // Fetch user matching datasets
        setTimeout(() => {
          loadStateFromServer();
        }, 100);

        return { success: true };
      } else {
        return { success: false, error: response.error || 'Authentication error.' };
      }
    } catch (error) {
      console.error('[Login Error]', error);
      return { success: false, error: error.message || 'Invalid Username or Password!' };
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    }
  };

  const logout = async () => {
    setIsServerLoaded(false);
    try {
<<<<<<< HEAD
      if (adminUser) await apiService.logoutUser(adminUser);
=======
      if (adminUser) {
        await apiService.logoutUser(adminUser);
      }
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    } catch (e) {
      console.error('[API Logout Error]', e);
    }
    setIsAuthenticated(false);
    setAdminUser('admin');
    setUserRole('SuperAdmin');
    localStorage.removeItem('aynakaran_auth');
    localStorage.removeItem('aynakaran_user');
    localStorage.removeItem('aynakaran_role');
<<<<<<< HEAD
=======
    
    // Clear active in-memory state so it resets instantly
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    setCustomers([]);
    setCandidates([]);
    setPolicies([]);
    setReminders([]);
  };

  // --- CUSTOMERS ---
  const addCustomer = async (cust) => {
<<<<<<< HEAD
    const custId = cust.id || `cust-${Date.now()}`;
    const newCust = {
      ...cust,
      id: custId,
      renewalDate: cust.renewalDate || '',
      createdAt: cust.createdAt || new Date().toISOString(),
      createdBy: adminUser,
    };

    setCustomers((prev) => [newCust, ...prev]);
=======
    const custId = cust.id || `cust-${Date.now().toString().substring(7)}`;
    const newCust = {
      ...cust,
      id: custId,
      createdAt: cust.createdAt || new Date().toISOString(),
      createdBy: adminUser
    };

    // Optimistic frontend update
    setCustomers(prev => [newCust, ...prev]);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

    try {
      const created = await apiService.createCustomer(newCust);
      if (created && created.success !== false) {
        setIsOnline(true);
<<<<<<< HEAD
        const merged = { ...newCust, ...(created.data || created) };
        setCustomers((prev) =>
          prev.map((c) => (c.id === custId ? merged : c))
        );
        return merged;
=======
        // Sync back standard verified entity
        setCustomers(prev => prev.map(c => c.id === custId ? { ...newCust, ...created.data } : c));
        loadStateFromServer();
        return { ...newCust, ...created.data };
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      }
    } catch (err) {
      console.error('[API Create Customer Error]', err);
    }
    return newCust;
  };

<<<<<<< HEAD
  // Supports: updateCustomer(id, patch)  OR  updateCustomer(fullObject)
  const updateCustomer = async (idOrRow, updatedFields) => {
    let id;
    let payload;

    if (idOrRow && typeof idOrRow === 'object' && updatedFields === undefined) {
      id = idOrRow.id || idOrRow._id;
      payload = { ...idOrRow, updatedBy: adminUser };
    } else {
      id = idOrRow;
      payload = { ...updatedFields, updatedBy: adminUser };
    }

    if (!id) {
      console.error('[updateCustomer] missing id');
      return;
    }

    setCustomers((prev) =>
      prev.map((c) => ((c.id || c._id) === id ? { ...c, ...payload } : c))
    );
=======
  const updateCustomer = async (id, updatedFields) => {
    const payload = { ...updatedFields, updatedBy: adminUser };
    setCustomers(prev => prev.map(c => c.id === id ? { ...c, ...payload } : c));
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

    try {
      await apiService.updateCustomer(id, payload);
      setIsOnline(true);
<<<<<<< HEAD
=======
      loadStateFromServer();
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    } catch (err) {
      console.error('[API Update Customer Error]', err);
    }
  };

  const deleteCustomer = async (id, otp) => {
    try {
<<<<<<< HEAD
      const response = await apiService.deleteCustomer(
        id,
        userRole,
        adminUser,
        otp
      );
      if (response && response.success !== false) {
        const username = adminUser || 'admin';
        const cachedCusts = JSON.parse(
          localStorage.getItem(`ayn_customers_${username}`) || '[]'
        );
        localStorage.setItem(
          `ayn_customers_${username}`,
          JSON.stringify(cachedCusts.filter((c) => c.id !== id))
        );
        setCustomers((prev) => prev.filter((c) => c.id !== id));
        setIsOnline(true);
        await loadStateFromServer();
        return { success: true };
      }
      return {
        success: false,
        error: response.error || 'Failed to delete customer',
      };
    } catch (err) {
=======
      const response = await apiService.deleteCustomer(id, userRole, adminUser, otp);
      if (response && response.success !== false) {
        // Update local storage synchronously first to avoid race condition during server state reload
        const username = adminUser || 'admin';
        const cachedCusts = JSON.parse(localStorage.getItem(`ayn_customers_${username}`) || '[]');
        localStorage.setItem(`ayn_customers_${username}`, JSON.stringify(cachedCusts.filter(c => c.id !== id)));

        setCustomers(prev => prev.filter(c => c.id !== id));
        setIsOnline(true);
        await loadStateFromServer();
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete customer' };
      }
    } catch (err) {
      console.error('[API Delete Customer Error]', err);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      return { success: false, error: err.message || 'Deletion error' };
    }
  };

  // --- CANDIDATES / POLICIES / REMINDERS (unchanged) ---
  const addCandidate = async (cand) => {
<<<<<<< HEAD
    const candId = cand.id || `cand-${Date.now()}`;
    const newCand = {
      ...cand,
      id: candId,
      pendingStageSince:
        cand.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: cand.createdAt || new Date().toISOString(),
    };
    setCandidates((prev) => [newCand, ...prev]);
=======
    const candId = cand.id || `cand-${Date.now().toString().substring(7)}`;
    const newCand = {
      ...cand,
      id: candId,
      pendingStageSince: cand.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: cand.createdAt || new Date().toISOString()
    };

    setCandidates(prev => [newCand, ...prev]);

>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    try {
      const created = await apiService.createCandidate(newCand);
      if (created) {
        setIsOnline(true);
<<<<<<< HEAD
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candId ? { ...newCand, ...(created.data || created) } : c
          )
        );
        return { ...newCand, ...(created.data || created) };
=======
        setCandidates(prev => prev.map(c => c.id === candId ? { ...newCand, ...created.data } : c));
        loadStateFromServer();
        return { ...newCand, ...created.data };
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      }
    } catch (err) {
      console.error('[API Create Candidate Error]', err);
    }
    return newCand;
  };

  const updateCandidate = async (id, updatedFields) => {
<<<<<<< HEAD
    const username = adminUser || 'admin';
    setCandidates((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c));
      localStorage.setItem(`ayn_candidates_${username}`, JSON.stringify(updated));
      return updated;
    });
    try {
      await apiService.updateCandidate(id, updatedFields);
      setIsOnline(true);
=======
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, ...updatedFields } : c));

    try {
      await apiService.updateCandidate(id, updatedFields);
      setIsOnline(true);
      loadStateFromServer();
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    } catch (err) {
      console.error('[API Update Candidate Error]', err);
    }
  };

  const deleteCandidate = async (id) => {
<<<<<<< HEAD
    const username = adminUser || 'admin';
    const cachedCands = JSON.parse(
      localStorage.getItem(`ayn_candidates_${username}`) || '[]'
    );
    localStorage.setItem(
      `ayn_candidates_${username}`,
      JSON.stringify(cachedCands.filter((c) => c.id !== id))
    );
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    try {
      await apiService.deleteCandidate(id);
      setIsOnline(true);
=======
    // Update local storage synchronously first to avoid race condition during server state reload
    const username = adminUser || 'admin';
    const cachedCands = JSON.parse(localStorage.getItem(`ayn_candidates_${username}`) || '[]');
    localStorage.setItem(`ayn_candidates_${username}`, JSON.stringify(cachedCands.filter(c => c.id !== id)));

    setCandidates(prev => prev.filter(c => c.id !== id));
    try {
      await apiService.deleteCandidate(id);
      setIsOnline(true);
      await loadStateFromServer();
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    } catch (err) {
      console.error('[API Delete Candidate Error]', err);
    }
  };

  const addPolicy = async (policy) => {
<<<<<<< HEAD
    const polId = policy.id || `pol-${Date.now()}`;
    const newPolicy = {
      ...policy,
      id: polId,
      pendingStageSince:
        policy.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: policy.createdAt || new Date().toISOString(),
      createdBy: adminUser,
    };
    setPolicies((prev) => [newPolicy, ...prev]);
=======
    const polId = policy.id || `pol-${Date.now().toString().substring(7)}`;
    const newPolicy = {
      ...policy,
      id: polId,
      pendingStageSince: policy.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: policy.createdAt || new Date().toISOString(),
      createdBy: adminUser
    };

    setPolicies(prev => [newPolicy, ...prev]);

>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    try {
      const created = await apiService.createPolicy(newPolicy);
      if (created) {
        setIsOnline(true);
<<<<<<< HEAD
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === polId ? { ...newPolicy, ...(created.data || created) } : p
          )
        );
        return { ...newPolicy, ...(created.data || created) };
=======
        setPolicies(prev => prev.map(p => p.id === polId ? { ...newPolicy, ...created.data } : p));
        loadStateFromServer();
        return { ...newPolicy, ...created.data };
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      }
    } catch (err) {
      console.error('[API Create Policy Error]', err);
    }
    return newPolicy;
  };

  const updatePolicy = async (id, updatedFields) => {
    const payload = { ...updatedFields, updatedBy: adminUser };
<<<<<<< HEAD
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...payload } : p))
    );
    try {
      await apiService.updatePolicy(id, payload);
      setIsOnline(true);
=======
    setPolicies(prev => prev.map(p => p.id === id ? { ...p, ...payload } : p));
    try {
      await apiService.updatePolicy(id, payload);
      setIsOnline(true);
      loadStateFromServer();
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    } catch (err) {
      console.error('[API Update Policy Error]', err);
    }
  };

  const deletePolicy = async (id, otp) => {
    try {
<<<<<<< HEAD
      const response = await apiService.deletePolicy(
        id,
        userRole,
        adminUser,
        otp
      );
      if (response && response.success !== false) {
        const username = adminUser || 'admin';
        const cachedPols = JSON.parse(
          localStorage.getItem(`ayn_policies_${username}`) || '[]'
        );
        localStorage.setItem(
          `ayn_policies_${username}`,
          JSON.stringify(cachedPols.filter((p) => p.id !== id))
        );
        setPolicies((prev) => prev.filter((p) => p.id !== id));
        setIsOnline(true);
        return { success: true };
      }
      return {
        success: false,
        error: response.error || 'Failed to delete policy',
      };
    } catch (err) {
=======
      const response = await apiService.deletePolicy(id, userRole, adminUser, otp);
      if (response && response.success !== false) {
        // Update local storage synchronously first to avoid race condition during server state reload
        const username = adminUser || 'admin';
        const cachedPols = JSON.parse(localStorage.getItem(`ayn_policies_${username}`) || '[]');
        localStorage.setItem(`ayn_policies_${username}`, JSON.stringify(cachedPols.filter(p => p.id !== id)));

        setPolicies(prev => prev.filter(p => p.id !== id));
        setIsOnline(true);
        await loadStateFromServer();
        return { success: true };
      } else {
        return { success: false, error: response.error || 'Failed to delete policy' };
      }
    } catch (err) {
      console.error('[API Delete Policy Error]', err);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
      return { success: false, error: err.message || 'Deletion error' };
    }
  };

  const addReminder = async (rem) => {
<<<<<<< HEAD
    const remId = rem.id || `rem-${Date.now()}`;
    const newRem = {
      ...rem,
      id: remId,
      createdAt: rem.createdAt || new Date().toISOString(),
    };
    setReminders((prev) => [newRem, ...prev]);
=======
    const remId = rem.id || `rem-${Date.now().toString().substring(7)}`;
    const newRem = {
      ...rem,
      id: remId,
      createdAt: rem.createdAt || new Date().toISOString()
    };

    setReminders(prev => [newRem, ...prev]);

>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    try {
      await apiService.createReminder(newRem);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Create Reminder Error]', err);
    }
  };

  const updateReminder = async (id, updatedFields) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updatedFields } : r))
    );
    try {
      await apiService.updateReminder(id, updatedFields);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Reminder Error]', err);
    }
  };

  const deleteReminder = async (id) => {
<<<<<<< HEAD
    setReminders((prev) => prev.filter((r) => r.id !== id));
=======
    setReminders(prev => prev.filter(r => r.id !== id));
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    try {
      await apiService.deleteReminder(id);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Delete Reminder Error]', err);
    }
  };

  const toggleReminder = (id) => {
    const target = reminders.find((r) => r.id === id);
    if (target) updateReminder(id, { completed: !target.completed });
  };

  const triggerAutomatedReminders = async () => {
    try {
      const res = await apiService.triggerCronScan();
      if (res && res.reminders) {
        let resolved = res.reminders;
        if (userRole === 'Staff' && adminUser) {
          resolved = resolved.filter((r) => {
            if (r.targetType === 'recruitment') return false;
            if (r.targetType === 'renewal') {
              return policies.some((p) => p.id === r.targetId);
            }
            return customers.some((c) => c.id === r.targetId);
          });
        }
        setReminders(resolved);
      }
      setIsOnline(true);
      return res;
    } catch (err) {
      console.error('[API Trigger Automated Reminders Error]', err);
    }
  };

  const triggerAutomatedReminders = async () => {
    try {
      const res = await apiService.triggerCronScan();
      if (res && res.reminders) {
        let resolved = res.reminders;
        if (userRole === 'Staff' && adminUser) {
          resolved = resolved.filter(r => {
            if (r.targetType === 'recruitment') return false;
            if (r.targetType === 'renewal') {
              return policies.some(p => p.id === r.targetId);
            }
            return customers.some(c => c.id === r.targetId);
          });
        } else {
          resolved = resolved.filter(r => {
            if (r.targetType === 'recruitment') return true;
            if (r.targetType === 'renewal') {
              const tgtPol = policies.find(p => p.id === r.targetId);
              return tgtPol && (!tgtPol.createdBy || tgtPol.createdBy === 'admin');
            }
            const tgtCust = customers.find(c => c.id === r.targetId);
            return tgtCust && (!tgtCust.createdBy || tgtCust.createdBy === 'admin');
          });
        }
        setReminders(resolved);
      }
      setIsOnline(true);
      return res;
    } catch (err) {
      console.error('[API Trigger Automated Reminders Error]', err);
    }
  };

  return (
<<<<<<< HEAD
    <AppContext.Provider
      value={{
        isAuthenticated,
        adminUser,
        userRole,
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
        triggerAutomatedReminders,
      }}
    >
=======
    <AppContext.Provider value={{
      isAuthenticated,
      adminUser,
      userRole,
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
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
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