import React, { useState, useEffect } from 'react';
import {
  Lock,
  Building2,
  ShieldAlert,
  Compass,
  Eye,
  EyeOff,
} from 'lucide-react';

// Context provider and custom hooks imports
import { AppProvider, useApp } from './context/AppContext.jsx';
import useSync from './hooks/useSync.js';

// Subcomponents / Sidebar imports
import Sidebar from './components/Sidebar.jsx';

// Page-level container imports from src/pages
import DashboardPage from './pages/DashboardPage.jsx';
import RecruitmentPage from './pages/RecruitmentPage.jsx';
import PolicySalesPage from './pages/PolicySalesPage.jsx';
import CustomersPage from './pages/CustomersPage.jsx';
import RemindersPage from './pages/RemindersPage.jsx';
import DocumentsPage from './pages/DocumentsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import StaffManagement from './modules/staff/StaffManagement.jsx';

function MainLayout() {
  const {
    isAuthenticated,
    adminUser,
    userRole,
    activeTab,
    setActiveTab,
    login,
    logout,
  } = useApp();

  // Custom synchronization stats
  const { isOnline, isSyncing, lastSyncTime, pingMs, forceSync } = useSync();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState(null);

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
    }
  };

  // Sign out Session
  const handleSignOutSession = () => {
    logout();
  };

  // Return the Admin login security gateway if session is unauthenticated
  if (!isAuthenticated) {
    return (
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
          </p>
        </section>
      </main>
    );
  }

  return (
    <div id="office-viewport-container" className="flex h-screen w-screen bg-[#F1F5F9] text-[#334155] overflow-hidden select-none">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleSignOutSession}
        adminUsername={adminUser}
      />

      {/* Main Operations Core Content aspect */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header matching design */}
        <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider">Command Center</span>
            <span className="text-slate-300">/</span>
            <span className="text-slate-500 font-medium capitalize">
              {activeTab === 'dashboard' ? 'Operational Overview' : `${activeTab.replace('_', ' ')} Workspace`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => forceSync()}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 disabled:opacity-50 text-slate-700 rounded text-[11px] font-semibold border border-slate-200 cursor-pointer transition-colors"
            >
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
          </div>
        </header>

        {/* Dynamic Inner Tab Component Page Viewport */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 min-w-0 bg-[#F1F5F9]">
          <div className="max-w-7xl mx-auto space-y-4">
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'recruitment' && userRole === 'SuperAdmin' && <RecruitmentPage />}
            {activeTab === 'staff_management' && userRole === 'SuperAdmin' && <StaffManagement />}
            {activeTab === 'policies' && <PolicySalesPage />}
            {activeTab === 'customers' && <CustomersPage />}
            {activeTab === 'reminders' && <RemindersPage />}
            {activeTab === 'documents' && <DocumentsPage />}
            {activeTab === 'reports' && <ReportsPage />}
          </div>
        </main>

        {/* Quick Action / Status Bar Footer */}
        <footer className="h-9 bg-[#0F172A] border-t border-slate-800 px-4 flex items-center justify-between text-white text-[10px] shrink-0">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'} rounded-full`}></span>
              CRM Database: {isOnline ? 'Connected' : 'Offline Sandbox'}
            </span>
            <span className="flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'} rounded-full`}></span>
              API Status: {isOnline ? 'Secure' : 'Fallback State'} {pingMs !== null ? `(${pingMs}ms)` : ''}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Offline Caching Active</span>
            <span className="text-slate-400">Last Synced: {lastSyncTime}</span>
            <span className="text-slate-400 italic font-mono">Current User Token: {userRole} ({adminUser})</span>
          </div>
        </footer>
      </div>
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
