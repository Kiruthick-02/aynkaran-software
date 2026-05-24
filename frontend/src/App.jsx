import React, { useState } from 'react';
import {
  Lock,
  Building2,
  ShieldAlert,
  Compass,
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
import UpdatesPage from './pages/UpdatesPage.jsx';

function MainLayout() {
  const {
    isAuthenticated,
    adminUser,
    activeTab,
    setActiveTab,
    login,
    logout,
  } = useApp();

  // Custom synchronization stats
  const { isOnline, isSyncing, lastSyncTime, pingMs, forceSync } = useSync();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);

  // Handle Login Authentication
  const handleAdminSignIn = (e) => {
    e.preventDefault();
    setLoginError(null);

    const result = login(username, password);
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
      <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 transition-all">
        {/* Ambient background designs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-800 rounded-full blur-3xl"></div>
        </div>

        <section id="login-form-container" className="relative w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl flex flex-col justify-between">
          <div className="space-y-6">
            {/* Visual Logo Brand */}
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                <Building2 size={24} />
              </div>
              <div className="space-y-1">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans uppercase">Aynkaran Consultants</h1>
                <p className="text-xs text-slate-400 font-medium font-sans">Insurance Operations Desktop Gateway</p>
              </div>
            </div>

            {loginError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-xs flex items-start space-x-2">
                <ShieldAlert size={14} className="mt-0.5 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            {/* In-app guidelines help box */}
            <div className="bg-slate-800/40 border border-slate-700 p-3.5 rounded-xl text-[11px] text-slate-300">
              <p className="font-bold mb-1 flex items-center space-x-1">
                <Compass size={12} className="text-indigo-400" />
                <span>Default Office Admin Credentials:</span>
              </p>
              <p>Username: <strong className="font-mono text-white select-all">admin</strong></p>
              <p>Password: <strong className="font-mono text-white select-all">admin@aynakaran</strong></p>
            </div>

            <form onSubmit={handleAdminSignIn} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">User Identifier ID</label>
                <input
                  required
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Secure Sign On Code</label>
                <input
                  required
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded-xl p-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              <button
                type="submit"
                id="btn-login-submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-xl transition-all shadow shadow-indigo-600/10 cursor-pointer"
              >
                Sign In to Database
              </button>
            </form>
          </div>

          <p className="text-[10px] text-center text-slate-500 mt-6 font-mono select-none">
            Authorized Single Company Use Only • AES 256 Cached
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
              {activeTab === 'dashboard' ? 'Operational Overview' : `${activeTab} Workspace`}
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
            <button
              onClick={() => setActiveTab('recruitment')}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold cursor-pointer transition-colors shadow-sm"
            >
              New Recruitment Case
            </button>
          </div>
        </header>

        {/* Dynamic Inner Tab Component Page Viewport */}
        <main className="flex-1 overflow-y-auto p-5 md:p-6 min-w-0 bg-[#F1F5F9]">
          <div className="max-w-7xl mx-auto space-y-4">
            {activeTab === 'dashboard' && <DashboardPage />}
            {activeTab === 'recruitment' && <RecruitmentPage />}
            {activeTab === 'policies' && <PolicySalesPage />}
            {activeTab === 'customers' && <CustomersPage />}
            {activeTab === 'reminders' && <RemindersPage />}
            {activeTab === 'documents' && <DocumentsPage />}
            {activeTab === 'reports' && <ReportsPage />}
            {activeTab === 'updates' && <UpdatesPage />}
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
            <span className="text-slate-400 italic font-mono">Current User Token: SuperAdmin ({adminUser})</span>
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
