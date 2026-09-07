<<<<<<< HEAD
// src/App.jsx
=======
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Building2,
  UserPlus,
  Users,
  Bell,
  FolderLock,
  ShieldAlert,
<<<<<<< HEAD
  FileBarChart,
  Globe,
  LogOut,
  Eye,
  EyeOff,
  ShieldCheck,
  RefreshCw,
  FileText,
  PlusCircle,
=======
  Compass,
  Eye,
  EyeOff,
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
} from 'lucide-react';

import { AppProvider, useApp } from './context/AppContext.jsx';
import API_URL from './config/api.js';
import { apiService } from './services/api.js';
import useSync from './hooks/useSync.js';
import Sidebar from './components/Sidebar.jsx';

// Page Imports
import DashboardPage from './pages/DashboardPage.jsx';
import RecruitmentPage from './pages/AdvisorManagementPage.jsx';
import AdvisorManagementModule from './modules/advisor/AdvisorManagement.jsx';
import PolicySalesPage from './pages/PolicySalesPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import RemindersPage from './pages/RemindersPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import StaffManagement from './modules/staff/StaffManagement.jsx';
<<<<<<< HEAD
import ContentPublishingPage from './pages/ContentPublishingPage.jsx';
=======
>>>>>>> d96c25bb403988716178a2b21910505a45607a70

function MainLayout() {
  const {
    isAuthenticated,
    adminUser,
    userRole,
    activeTab,
    setActiveTab,
    login,
    logout,
    candidates,
    addCandidate,
    updateCandidate,
    deleteCandidate
  } = useApp();

  const { isOnline, isSyncing, lastSyncTime, pingMs, forceSync } = useSync();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);

<<<<<<< HEAD
  // ========== SHARED CUSTOMER REGISTRY ==========
  // Created in Companies & Policies → shown in Customers tab
  const [policyHolders, setPolicyHolders] = useState(() => {
    try {
      const raw = localStorage.getItem('aynkaran_policy_holders');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // ========== ADVISOR LIFECYCLE REGISTRY ==========
  // Candidate registration -> training -> examination -> advisor -> ABP hierarchy.
  // This state is kept in App.jsx so all five advisor-module sections share the
  // same records without changing the existing customer, notification, or auth logic.
  const [advisorCandidates, setAdvisorCandidates] = useState(() => {
    try {
      const raw = localStorage.getItem('aynkaran_advisor_candidates');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [trainingPrograms, setTrainingPrograms] = useState(() => {
    try {
      const raw = localStorage.getItem('aynkaran_training_programs');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [licensingExams, setLicensingExams] = useState(() => {
    try {
      const raw = localStorage.getItem('aynkaran_licensing_exams');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const [advisors, setAdvisors] = useState(() => {
    try {
      const raw = localStorage.getItem('aynkaran_advisors');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('aynkaran_advisor_candidates', JSON.stringify(advisorCandidates));
      localStorage.setItem('aynkaran_training_programs', JSON.stringify(trainingPrograms));
      localStorage.setItem('aynkaran_licensing_exams', JSON.stringify(licensingExams));
      localStorage.setItem('aynkaran_advisors', JSON.stringify(advisors));
    } catch (_) {}
  }, [advisorCandidates, trainingPrograms, licensingExams, advisors]);

  // Recruitment & Milestones has its own lifecycle state. Mirror it to the
  // shared candidate API so Documents Vault can resolve the same trainee.
  useEffect(() => {
    if (!advisorCandidates.length) return;
    Promise.all(advisorCandidates.map(candidate =>
      apiService.updateCandidate(candidate.id, candidate)
    )).catch(error => console.warn('[Advisor Candidate Sync]', error.message));
  }, [advisorCandidates]);

  const handleAddAdvisorCandidate = async (candidate) => {
    const row = {
      ...candidate,
      id: candidate.id || `CAN-${Date.now()}`,
      addedOn: candidate.addedOn || new Date().toISOString().slice(0, 10),
      documents: candidate.documents || [],
      trainingHistory: candidate.trainingHistory || [],
      examHistory: candidate.examHistory || [],
    };
    setAdvisorCandidates((prev) => [row, ...prev]);
    try {
      await apiService.createCandidate(row);
    } catch (error) {
      // The background upsert effect retains the record if the first request
      // races with another lifecycle save.
      console.warn('[Advisor Candidate Create]', error.message);
=======
  // Clear credential fields when signed out / unauthenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setUsername('');
      setPassword('');
    }
  }, [isAuthenticated]);

  // Handle Login Authentication
  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setLoginError(null);

    const result = await login(username, password);
    if (!result.success) {
      setLoginError(result.error);
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
    }
  };

  const handleUpdateAdvisorCandidate = async (candidateOrId, maybePayload = null) => {
    const candidate =
      typeof candidateOrId === 'object' && candidateOrId !== null
        ? candidateOrId
        : { id: candidateOrId, ...(maybePayload || {}) };

    if (!candidate || !candidate.id) return;

    let syncedCandidate = null;
    setAdvisorCandidates((prev) =>
      prev.map((item) => {
        if (item.id !== candidate.id) return item;

        const merged = {
          ...item,
          ...candidate,
          documents: Array.isArray(candidate.documents)
            ? candidate.documents
            : Array.isArray(item.documents)
              ? item.documents
              : [],
          stageNumber: candidate.stageNumber ?? item.stageNumber ?? 1,
          currentStage: candidate.currentStage ?? item.currentStage ?? 'Candidate Registered'
        };

        syncedCandidate = merged;
        return merged;
      })
    );
    if (syncedCandidate) {
      try {
        await apiService.updateCandidate(syncedCandidate.id, syncedCandidate);
      } catch (error) {
        console.warn('[Advisor Candidate Update]', error.message);
      }
    }
  };

  const handleDeleteAdvisorCandidate = async (candidateId) => {
    await apiService.deleteCandidate(candidateId);
    setAdvisorCandidates((prev) => prev.filter((candidate) => candidate.id !== candidateId));
  };

  const handleAddTrainingProgram = (program) => {
    const row = {
      ...program,
      id: program.id || `TRN-${Date.now()}`,
      status: program.status || 'Upcoming',
    };
    setTrainingPrograms((prev) => [row, ...prev]);
  };

  const handleUpdateTrainingProgram = (program) => {
    setTrainingPrograms((prev) =>
      prev.map((item) => (item.id === program.id ? { ...item, ...program } : item))
    );
  };

  const handleAddLicensingExam = (exam) => {
    const row = {
      ...exam,
      id: exam.id || `EXM-${Date.now()}`,
      registeredCount: exam.registeredCount || 0,
      appearedCount: exam.appearedCount || 0,
      passedCount: exam.passedCount || 0,
      failedCount: exam.failedCount || 0,
      status: exam.status || 'Scheduled',
    };
    setLicensingExams((prev) => [row, ...prev]);
  };

  const handleAddAdvisor = (advisor) => {
    const row = {
      ...advisor,
      id: advisor.id || `ADV-${Date.now()}`,
      status: advisor.status || 'Active',
      experience: advisor.experience || 0,
      activePoliciesCount: advisor.activePoliciesCount || 0,
      totalCommission: advisor.totalCommission || 0,
      performance: advisor.performance || [],
      assignedCustomers: advisor.assignedCustomers || [],
      documents: advisor.documents || [],
    };
    setAdvisors((prev) => [row, ...prev]);
  };

  const [toast, setToast] = useState(null);
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('sec_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch (_) {
      return [];
    }
  });
  const [notifOpen, setNotifOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [realtimeMsg, setRealtimeMsg] = useState(null);
  const [lastEnquiryId, setLastEnquiryId] = useState(
    () => (notifications[0] && notifications[0].id) || null
  );

  useEffect(() => {
    try {
      localStorage.setItem(
        'aynkaran_policy_holders',
        JSON.stringify(policyHolders)
      );
    } catch (_) {}
  }, [policyHolders]);

  const showNotification = (msg) => {
    setToast(msg);
    window.clearTimeout(showNotification._t);
    showNotification._t = window.setTimeout(() => setToast(null), 3500);
  };

  // Persist notifications whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('sec_notifications', JSON.stringify(notifications));
    } catch (_) {}
  }, [notifications]);

  // Poll for new enquiries to show realtime popup + sidebar list
  useEffect(() => {
    let cancelled = false;

    const fetchEnquiries = async () => {
      try {
        const res = await fetch(`${API_URL}/api/enquiries`);
        if (!res.ok) return;
        const list = await res.json();
        if (!Array.isArray(list) || list.length === 0) return;

        const latest = list[0];
        if (!latest) return;

        if (!lastEnquiryId) {
          // first time, seed notifications
          setNotifications((prev) => {
            // merge but keep existing local ones first
            const merged = [...(prev || [])];
            return merged;
          });
        }

        if (latest.id && latest.id !== lastEnquiryId) {
          // new enquiry arrived
          const note = {
            ...latest,
            id: latest.id,
            name: latest.name || latest.fullname || 'New Enquiry',
            mobile: latest.mobile || latest.whatsApp || '',
            message: latest.message || latest.notes || '',
            enquiryType: latest.enquiryType || 'customer',
            createdAt: latest.createdAt || latest.timestamp || new Date().toISOString(),
            isRead: false,
          };
          setNotifications((prev) => [note, ...(prev || [])].slice(0, 200));
          setLastEnquiryId(latest.id);
          setRealtimeMsg(`${note.name} — ${note.mobile || 'unknown'} sent an enquiry`);
          // auto-hide realtime popup
          window.clearTimeout(setRealtimeMsg._t);
          setRealtimeMsg._t = window.setTimeout(() => setRealtimeMsg(null), 6000);
        }
      } catch (e) {
        // ignore polling errors
      }
    };

    // Initial fetch and then poll
    fetchEnquiries();
    const id = setInterval(() => {
      if (!cancelled) fetchEnquiries();
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [lastEnquiryId]);

  const handleAddCustomer = (customer) => {
    const row = {
      ...customer,
      id: customer.id || `cust-${Date.now()}`,
      renewalDate: customer.renewalDate || '',
      createdAt: customer.createdAt || new Date().toISOString(),
    };
    setPolicyHolders((prev) => [row, ...prev]);
  };

  const handleUpdateCustomer = (id, patch) => {
    setPolicyHolders((prev) =>
      prev.map((c) => ((c.id || c._id) === id ? { ...c, ...patch } : c))
    );
  };

  // Authentication logic
  const handleAdminSignIn = async (e) => {
    e.preventDefault();
    setLoginError(null);
    const result = await login(username, password);
    if (!result.success) setLoginError(result.error);
  };

  // LOGIN SCREEN
  if (!isAuthenticated) {
    return (
<<<<<<< HEAD
      <main className="min-h-screen flex items-center justify-center bg-[#070B19] px-4">
        <section className="relative w-full max-w-md bg-[#0F172A]/90 border border-slate-800 p-10 rounded-[40px] shadow-2xl flex flex-col items-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-blue-600/30">
            <Building2 size={32} />
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-tighter">
            Aynkaran
          </h1>
          <p className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.3em] mb-8">
            Consultant Gateway
=======
      <main className="min-h-screen flex items-center justify-center bg-[#070B19] px-4 transition-all relative">
        {/* Glow-gradients background decorations */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-25">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-tr from-[#3b82f6] to-[#4f46e5] rounded-full blur-[140px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-gradient-to-tr from-[#6366f1] to-[#a855f7] rounded-full blur-[140px]"></div>
        </div>

        <section id="login-form-container" className="relative w-full max-w-md bg-[#0F172A]/85 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl shadow-indigo-950/25 flex flex-col justify-between">
          <div className="space-y-7">
            
            {/* Visual Logo Brand */}
            <div className="text-center space-y-4">
              <div className="mx-auto w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/30">
                <Building2 size={26} />
              </div>
              <div className="space-y-1.5">
                <h1 className="text-2xl font-black tracking-tight text-white font-sans uppercase">Aynkaran</h1>
                <p className="text-xs text-indigo-400 font-bold font-sans tracking-wide uppercase">Consultant Operations Gateway</p>
              </div>
            </div>

            {loginError && (
              <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-2xl text-xs flex items-start space-x-2.5 shadow-sm">
                <ShieldAlert size={16} className="mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSignIn} className="space-y-5 text-xs">
              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Username</label>
                <input
                  required
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-2xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-950 transition duration-150"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-300 font-bold">Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-200 rounded-2xl p-3 pr-10 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-slate-950 transition duration-150"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm py-3.5 rounded-2xl transition duration-150 shadow-lg shadow-indigo-600/20 active:scale-98 cursor-pointer text-center"
              >
                Signin
              </button>
            </form>
          </div>

          <p className="text-[10px] text-center text-slate-500 mt-8 font-mono select-none">
            Authorized System Access Only • Aynkaran Desk Secured
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          </p>

          {loginError && (
            <div className="w-full p-3 mb-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] text-center">
              {loginError}
            </div>
          )}

          <form onSubmit={handleAdminSignIn} className="w-full space-y-4">
            <input
              required
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-black/40 border border-slate-800 text-white rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
            />
            <div className="relative">
              <input
                required
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-slate-800 text-white rounded-2xl p-4 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black text-xs uppercase tracking-widest py-4 rounded-2xl shadow-lg transition-transform active:scale-95 cursor-pointer"
            >
              Sign In Session
            </button>
          </form>
        </section>
      </main>
    );
  }

  // MAIN DASHBOARD
  return (
    <div className="flex h-screen w-screen bg-[#0B1120] text-slate-200 overflow-hidden font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={logout}
        adminUsername={adminUser}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
<<<<<<< HEAD
        <header className="h-16 bg-[#0B1120] border-b border-slate-800 px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em]">
            <span className="text-slate-500">Command Center</span>
            <span className="text-slate-700">/</span>
            <span className="text-white">
              {activeTab === 'dashboard'
                ? 'Overview'
                : activeTab.replace('_', ' ')}
=======
        {/* Header matching design */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider">Command Center</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium capitalize">
              {activeTab === 'dashboard' ? 'Operational Overview' : `${activeTab.replace('_', ' ')} Workspace`}
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              title="Notifications"
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-lg hover:bg-white/5"
            >
<<<<<<< HEAD
              <Bell size={18} />
              {notifications && notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
=======
              {isSyncing ? 'Syncing...' : 'Force Sync'}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 cursor-pointer transition-colors"
            >
              Export Summary
            </button>
            {userRole === 'SuperAdmin' && (
              <button
                onClick={() => setActiveTab('recruitment')}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
              >
                New Recruitment Case
              </button>
            )}
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          </div>
        </header>

        {/* Notifications Sidebar */}
        {notifOpen && (
          <aside className="fixed right-0 top-16 h-[calc(100vh-64px)] w-96 bg-[#061026] border-l border-slate-800 z-50 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-sm">Notifications</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setNotifications((prev) => prev.map((p) => ({ ...p, isRead: true })))}
                  className="text-xs text-slate-400 hover:text-white h-6 flex items-center leading-none py-0.5"
                >
                  Mark all read
                </button>
                <button onClick={() => setNotifOpen(false)} className="text-xs text-slate-400 h-6 flex items-center leading-none py-0.5">Close</button>
              </div>
            </div>

            {notifications.length === 0 && (
              <div className="text-slate-500 text-sm">No notifications yet.</div>
            )}

            <ul className="space-y-2">
              {notifications.map((n) => (
                <li key={n.id} className={`p-3 rounded-lg border ${n.isRead ? 'bg-transparent border-slate-800' : 'bg-slate-900 border-slate-700'}`}>
                  <div className="flex items-start justify-between">
                    <div className="text-sm">
                      <div className="font-semibold">{n.name}</div>
                      <div className="text-xs text-slate-400">{n.message}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 ml-2">{new Date(n.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        // Open the matching enquiry module.
                        setNotifications((prev) => prev.map((p) => (p.id === n.id ? { ...p, isRead: true } : p)));
                        setSelectedNotification(n);
                        try {
                          if (n.enquiryType === 'advisor') {
                            localStorage.setItem('ayn_advisor_management_tab', 'enquiries');
                          } else {
                            localStorage.setItem('aynkaran_customers_tab', 'enquiries');
                          }
                        } catch (_) {}
                        setActiveTab(n.enquiryType === 'advisor' ? 'recruitment' : 'customers');
                        setNotifOpen(false);
                      }}
                      className="text-xs text-blue-400 h-6 flex items-center"
                    >
                      Open
                    </button>
                    <button
                      onClick={() => setNotifications((prev) => prev.filter((p) => p.id !== n.id))}
                      className="text-xs text-slate-400"
                    >
                      Dismiss
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        )}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0B1120] animate-fade-in">
          <div className="max-w-screen-2xl mx-auto">
            {activeTab === 'dashboard' && <DashboardPage />}
<<<<<<< HEAD

            {/* Companies & Policies — MUST receive onAddCustomer */}
            {activeTab === 'policies' && (
              <PolicySalesPage
                policyHolders={policyHolders}
                onAddCustomer={handleAddCustomer}
                onShowNotification={showNotification}
              />
            )}

            {activeTab === 'recruitment' && (
              <AdvisorManagementModule
                candidates={advisorCandidates}
                programs={trainingPrograms}
                exams={licensingExams}
                advisors={advisors}
                onAddCandidate={handleAddAdvisorCandidate}
                onUpdateCandidate={handleUpdateAdvisorCandidate}
                onDeleteCandidate={handleDeleteAdvisorCandidate}
                onAddProgram={handleAddTrainingProgram}
                onUpdateProgram={handleUpdateTrainingProgram}
                onAddExam={handleAddLicensingExam}
                onAddAdvisor={handleAddAdvisor}
                initialEnquiry={selectedNotification?.enquiryType === 'advisor' ? selectedNotification : null}
                onShowNotification={showNotification}
              />
            )}

            {/* Customers — same list */}
            {activeTab === 'customers' && (
              <CustomersPage
                customers={policyHolders}
                onUpdateCustomer={handleUpdateCustomer}
                onShowNotification={showNotification}
                initialEnquiry={selectedNotification?.enquiryType === 'advisor' ? null : selectedNotification}
              />
            )}

=======
            {activeTab === 'recruitment' && userRole === 'SuperAdmin' && <RecruitmentPage />}
            {activeTab === 'staff_management' && userRole === 'SuperAdmin' && <StaffManagement />}
            {activeTab === 'policies' && <PolicySalesPage />}
            {activeTab === 'customers' && <CustomersPage />}
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
            {activeTab === 'reminders' && <RemindersPage />}
            {activeTab === 'documents' && <DocumentsPage />}
            {activeTab === 'staff_management' && <StaffManagement />}
            {activeTab === 'reports' && <ReportsPage />}
<<<<<<< HEAD

            {/* Content Publishing */}
{activeTab === 'content' && (
  <ContentPublishingPage onShowNotification={showNotification} />
)}

=======
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          </div>
        </main>

        <footer className="h-10 bg-[#070B19] border-t border-slate-800 px-6 flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                    : 'bg-rose-500'
                }`}
              ></span>
              Database Online
            </span>
            <span className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  isOnline
                    ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'
                    : 'bg-slate-600'
                }`}
              ></span>
              Website Synced
            </span>
          </div>
<<<<<<< HEAD
          <div className="flex items-center gap-6 font-mono text-slate-600">
            <span>TERMINAL_UID: 9X88-AQ-210</span>
            <span>© 2026 AYNKARAN CONSULTANTS</span>
=======
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Offline Caching Active</span>
            <span className="text-slate-400">Last Synced: {lastSyncTime}</span>
            <span className="text-slate-400 italic font-mono">Current User Token: {userRole} ({adminUser})</span>
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
          </div>
        </footer>
      </div>
                
      {/* Toast */}
      {realtimeMsg && (
        <div className="fixed bottom-20 right-6 z-[210] max-w-sm px-4 py-3 rounded-xl bg-blue-900 border border-blue-700 text-white text-xs font-semibold shadow-2xl">
          {realtimeMsg}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-[200] max-w-sm px-4 py-3 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs font-semibold shadow-2xl">
          {toast}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
