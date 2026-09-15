// context/AppContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
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
    return (
      localStorage.getItem('aynakaran_role') ||
      (localStorage.getItem('aynakaran_user') === 'admin' ? 'SuperAdmin' : 'Staff')
    );
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

  const loadStateFromServer = useCallback(async () => {
    const isAuthenticatedFlag = localStorage.getItem('aynakaran_auth') === 'true';
    if (!isAuthenticatedFlag) return;

    try {
      const role =
        localStorage.getItem('aynakaran_role') ||
        (localStorage.getItem('aynakaran_user') === 'admin' ? 'SuperAdmin' : 'Staff');
      const username = localStorage.getItem('aynakaran_user') || 'admin';

      const responses = await Promise.allSettled([
        apiService.getCustomers(role, username),
        apiService.getCandidates(),
        apiService.getPolicies(role, username),
        apiService.getReminders(role, username),
      ]);

      const [custResult, candResult, policyResult, reminderResult] = responses;
      const failedResources = responses
        .map((response, index) => response.status === 'rejected' ? ['customers', 'candidates', 'policies', 'reminders'][index] : null)
        .filter(Boolean);
      if (failedResources.length) {
        console.warn(`[Sync Error] Failed resources: ${failedResources.join(', ')}`);
      }

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

      let resolvedCusts = custResult.status === 'fulfilled' && Array.isArray(custResult.value) ? custResult.value : cachedCusts;
      let resolvedCands = candResult.status === 'fulfilled' && Array.isArray(candResult.value) ? candResult.value : cachedCands;
      let resolvedPols = policyResult.status === 'fulfilled' && Array.isArray(policyResult.value) ? policyResult.value : cachedPols;
      let resolvedRems = reminderResult.status === 'fulfilled' && Array.isArray(reminderResult.value) ? reminderResult.value : cachedRems;

      if (failedResources.length > 0) {
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
          console.error('[System Sync] Bulk push failed:', syncErr);
        }
      }

      if (role === 'Staff' && username) {
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
          return tgtCust && (!tgtCust.createdBy || tgtCust.createdBy === 'admin');
        });
      }

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
      setIsServerLoaded(true);
    }
  }, []);

  useEffect(() => {
    loadStateFromServer();
    const interval = setInterval(() => loadStateFromServer(), 6000);
    return () => clearInterval(interval);
  }, [loadStateFromServer]);

  const login = async (username, password) => {
    try {
      const response = await apiService.loginUser(username, password);
      if (response && response.success) {
        const loggedUser = response.user;
        setIsServerLoaded(false);
        setIsAuthenticated(true);
        setAdminUser(loggedUser.username);
        setUserRole(loggedUser.role);
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
    }
  };

  const logout = async () => {
    setIsServerLoaded(false);
    try {
      if (adminUser) await apiService.logoutUser(adminUser);
    } catch (e) {
      console.error('[API Logout Error]', e);
    }
    setIsAuthenticated(false);
    setAdminUser('admin');
    setUserRole('SuperAdmin');
    localStorage.removeItem('aynakaran_auth');
    localStorage.removeItem('aynakaran_user');
    localStorage.removeItem('aynakaran_role');
    setCustomers([]);
    setCandidates([]);
    setPolicies([]);
    setReminders([]);
  };

  // --- CUSTOMERS ---
  const addCustomer = async (cust) => {
    const custId = cust.id || `cust-${Date.now()}`;
    const newCust = {
      ...cust,
      id: custId,
      renewalDate: cust.renewalDate || '',
      createdAt: cust.createdAt || new Date().toISOString(),
      createdBy: adminUser,
    };

    setCustomers((prev) => [newCust, ...prev]);

    try {
      const created = await apiService.createCustomer(newCust);
      if (created && created.success !== false) {
        setIsOnline(true);
        const merged = { ...newCust, ...(created.data || created) };
        setCustomers((prev) =>
          prev.map((c) => (c.id === custId ? merged : c))
        );
        return merged;
      }
    } catch (err) {
      console.error('[API Create Customer Error]', err);
    }
    return newCust;
  };

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

    try {
      await apiService.updateCustomer(id, payload);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Customer Error]', err);
    }
  };

  const deleteCustomer = async (id, otp) => {
    try {
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
      return { success: false, error: err.message || 'Deletion error' };
    }
  };

  // --- CANDIDATES / POLICIES / REMINDERS (unchanged) ---
  const addCandidate = async (cand) => {
    const candId = cand.id || `cand-${Date.now()}`;
    const newCand = {
      ...cand,
      id: candId,
      pendingStageSince:
        cand.pendingStageSince || new Date().toISOString().split('T')[0],
      createdAt: cand.createdAt || new Date().toISOString(),
    };
    setCandidates((prev) => [newCand, ...prev]);
    try {
      const created = await apiService.createCandidate(newCand);
      if (created) {
        setIsOnline(true);
        setCandidates((prev) =>
          prev.map((c) =>
            c.id === candId ? { ...newCand, ...(created.data || created) } : c
          )
        );
        return { ...newCand, ...(created.data || created) };
      }
    } catch (err) {
      console.error('[API Create Candidate Error]', err);
    }
    return newCand;
  };

  const updateCandidate = async (id, updatedFields) => {
    const username = adminUser || 'admin';
    setCandidates((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, ...updatedFields } : c));
      localStorage.setItem(`ayn_candidates_${username}`, JSON.stringify(updated));
      return updated;
    });
    try {
      await apiService.updateCandidate(id, updatedFields);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Candidate Error]', err);
    }
  };

  const deleteCandidate = async (id) => {
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
    } catch (err) {
      console.error('[API Delete Candidate Error]', err);
    }
  };

  const addPolicy = async (policy) => {
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
    try {
      const created = await apiService.createPolicy(newPolicy);
      if (created) {
        setIsOnline(true);
        setPolicies((prev) =>
          prev.map((p) =>
            p.id === polId ? { ...newPolicy, ...(created.data || created) } : p
          )
        );
        return { ...newPolicy, ...(created.data || created) };
      }
    } catch (err) {
      console.error('[API Create Policy Error]', err);
    }
    return newPolicy;
  };

  const updatePolicy = async (id, updatedFields) => {
    const payload = { ...updatedFields, updatedBy: adminUser };
    setPolicies((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...payload } : p))
    );
    try {
      await apiService.updatePolicy(id, payload);
      setIsOnline(true);
    } catch (err) {
      console.error('[API Update Policy Error]', err);
    }
  };

  const deletePolicy = async (id, otp) => {
    try {
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
      return { success: false, error: err.message || 'Deletion error' };
    }
  };

  const addReminder = async (rem) => {
    const remId = rem.id || `rem-${Date.now()}`;
    const newRem = {
      ...rem,
      id: remId,
      createdAt: rem.createdAt || new Date().toISOString(),
      createdBy: adminUser,
    };
    setReminders((prev) => [newRem, ...prev]);
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
    setReminders((prev) => prev.filter((r) => r.id !== id));
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