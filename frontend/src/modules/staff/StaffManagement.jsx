import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { 
  UserPlus, 
  Users, 
  Activity, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck,
  KeyRound, 
  Calendar, 
  Search, 
  RefreshCw, 
  Lock, 
  UserCheck, 
  Database,
  Eye,
  EyeOff,
  Copy,
  Check
} from 'lucide-react';

export default function StaffManagement() {
  const { adminUser, userRole } = useApp();
  const [activeSubTab, setActiveSubTab] = useState('roster'); // 'roster', 'logs', 'customers'
  
  // States
  const [staffs, setStaffs] = useState([]);
  const [logs, setLogs] = useState([]);
  const [customs, setCustoms] = useState([]); // all customers to group/filter
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ type: '', text: '' });

  // Creation form states
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Search/Filter states
  const [logSearch, setLogSearch] = useState('');
  const [selectedStaffFilter, setSelectedStaffFilter] = useState('only_staff');

  // Staff credentials popup state
  const [selectedStaffCreds, setSelectedStaffCreds] = useState(null);
  const [credsPasswordVisible, setCredsPasswordVisible] = useState(false);
  const [copiedField, setCopiedField] = useState(null);

  // Fetch initial rosters & telemetry
  const fetchData = async () => {
    setLoading(true);
    try {
      const [staffList, logList, allCustomers] = await Promise.all([
        apiService.getStaffList(),
        apiService.getStaffLogs(),
        // Pass supervise=true to retrieve ALL customers registered by staff (since we are SuperAdmin)
        apiService.getCustomers('SuperAdmin', 'admin', true)
      ]);

      setStaffs(Array.isArray(staffList) ? staffList : []);
      setLogs(Array.isArray(logList) ? logList : []);
      setCustoms(Array.isArray(allCustomers) ? allCustomers : []);
    } catch (err) {
      console.error('[Staff telemetry load fail]', err);
      showToast('error', 'Failed to retrieve rosters or audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userRole === 'SuperAdmin') {
      fetchData();
      const interval = setInterval(() => {
        fetchData();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [userRole]);

  const showToast = (type, text) => {
    setActionMessage({ type, text });
    setTimeout(() => {
      setActionMessage({ type: '', text: '' });
    }, 4500);
  };

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleClearLogs = async () => {
    if (!window.confirm("Are you sure you want to permanently clear all staff log history? This action cannot be undone.")) {
      return;
    }
    try {
      setLoading(true);
      await apiService.clearStaffLogs();
      setLogs([]);
      showToast('success', 'Staff log history cleared successfully.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Failed to clear log history.');
    } finally {
      setLoading(false);
    }
  };

  const formatTimestampFull = (isoString) => {
    if (!isoString) return 'N/A';
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) return 'N/A';
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const yyyy = dateObj.getFullYear();
    const datePart = `${dd}/${mm}/${yyyy}`;
    
    let hours = dateObj.getHours();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutes = String(dateObj.getMinutes()).padStart(2, '0');
    const seconds = String(dateObj.getSeconds()).padStart(2, '0');
    const timePart = `${String(hours).padStart(2, '0')}:${minutes}:${seconds} ${ampm}`;
    
    return `${datePart}, ${timePart}`;
  };

  // Create login credentials for staff
  const handleCreateStaff = async (e) => {
    e.preventDefault();
    const cleanUsername = newUsername.trim().toLowerCase();
    const cleanPassword = newPassword;
    const cleanDisplayName = newDisplayName.trim() || cleanUsername;

    if (!cleanUsername) {
      showToast('error', 'Username cannot be blank!');
      return;
    }

    if (!cleanPassword) {
      showToast('error', 'Password cannot be blank!');
      return;
    }

    // Validation rules:
    if (cleanUsername.length < 4) {
      showToast('error', 'Username must be at least 4 characters long.');
      return;
    }

    if (!/^[a-z][a-z0-9_]*$/.test(cleanUsername)) {
      showToast('error', 'Username must start with a letter and contain only lowercase letters, numbers, or underscores.');
      return;
    }

    if (cleanDisplayName.length < 3) {
      showToast('error', 'Display Name must be at least 3 characters long.');
      return;
    }

    if (cleanPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }

    if (!/[A-Za-z]/.test(cleanPassword) || !/[0-9]/.test(cleanPassword)) {
      showToast('error', 'Password must contain at least one letter and one number.');
      return;
    }

    try {
      const payload = {
        username: cleanUsername,
        password: cleanPassword,
        displayName: cleanDisplayName,
        requesterRole: 'SuperAdmin'
      };

      const result = await apiService.registerStaff(
        payload.username, 
        payload.password, 
        payload.displayName, 
        payload.requesterRole
      );

      if (result && result.success) {
        showToast('success', `Created Staff login credentials for "${payload.username}" successfully!`);
        setNewUsername('');
        setNewPassword('');
        setNewDisplayName('');
        fetchData();
      } else {
        showToast('error', result.error || 'Failed to create staff account.');
      }
    } catch (err) {
      showToast('error', err.message || 'Operation failed.');
    }
  };

  // Delete staff credentials
  const handleDeleteStaff = async (username) => {
    if (!window.confirm(`Are you absolutely sure you want to terminate login credentials for staff: "${username}"?`)) {
      return;
    }

    try {
      const result = await apiService.deleteStaff(username);
      if (result && result.success) {
        showToast('success', `Removed login access for "${username}".`);
        fetchData();
      } else {
        showToast('error', result.error || 'Failed to terminate credentials.');
      }
    } catch (err) {
      showToast('error', err.message || 'Operation failed.');
    }
  };

  // Render access block for unauthorized users
  if (userRole !== 'SuperAdmin') {
    return (
      <div className="p-8 flex items-center justify-center min-h-[70vh]">
        <div className="bg-[#0F172A] border border-rose-900/40 max-w-lg p-8 rounded-3xl shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 bg-rose-950/60 text-rose-400 rounded-full flex items-center justify-center mx-auto ring-8 ring-rose-950/30">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-white">Access Denied</h2>
          <p className="text-slate-400 text-sm leading-relaxed">
            The Staff Supervision &amp; Audit telemetry dashboard is restricted to <strong className="text-white">Superadmin</strong> authorized credentials only.
          </p>
        </div>
      </div>
    );
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const query = logSearch.toLowerCase();
    const matchesQuery = 
      (log.username && log.username.toLowerCase().includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query)) ||
      (log.target && log.target.toLowerCase().includes(query));
    
    return matchesQuery;
  });

  const staffCustomersCount = customs.filter(c => c.createdBy && c.createdBy !== 'admin').length;

  return (
    <div id="staff-management-container" className="space-y-6 max-w-7xl mx-auto animate-fade-in text-slate-200 font-sans pb-10">
      
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                Staff Supervision &amp; Access Center
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Provision staff credentials, inspect real-time telemetry activity logs, and monitor isolated staff customer portfolios.
              </p>
            </div>
          </div>
        </div>
        
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 text-xs bg-[#1E293B] hover:bg-slate-800 text-slate-200 font-bold rounded-xl border border-slate-700 transition duration-150 active:scale-95 disabled:opacity-50 cursor-pointer shadow"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin text-blue-400' : 'text-blue-400'} />
          <span>Refresh Data</span>
        </button>
      </div>

      {/* Action Toast Messages */}
      {actionMessage.text && (
        <div className={`p-4 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up border ${
          actionMessage.type === 'success' 
            ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800/80 shadow-emerald-950/40' 
            : 'bg-rose-950/80 text-rose-200 border-rose-800/80 shadow-rose-950/40'
        }`}>
          <div className={`w-2.5 h-2.5 rounded-full ${actionMessage.type === 'success' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
          <p className="text-xs font-semibold">{actionMessage.text}</p>
        </div>
      )}

      {/* Summary KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Staff Accounts</p>
              <p className="text-2xl font-black text-white mt-1 font-mono">{staffs.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span>Multi-tenant login access active</span>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Staff CRM Customers</p>
              <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">{staffCustomersCount}</p>
            </div>
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Database size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Strictly isolated from Admin CRM</span>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Telemetry Activity Logs</p>
              <p className="text-2xl font-black text-amber-400 mt-1 font-mono">{logs.length}</p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Activity size={20} />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Auditing logins, logouts &amp; actions</span>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Role Boundaries</p>
              <p className="text-sm font-bold text-white mt-2">Recruitment &amp; Content</p>
            </div>
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Lock size={20} />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11px] text-purple-300 font-semibold">
            <span>Restricted for Staff accounts</span>
          </div>
        </div>
      </div>

      {/* Sub-Tab Navigation Bar */}
      <div className="flex border-b border-slate-800 gap-2">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'roster' 
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
          }`}
        >
          <UserPlus size={15} />
          <span>Staff Roster &amp; Credentials</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
            {staffs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'logs' 
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
          }`}
        >
          <Activity size={15} />
          <span>Activity &amp; Login Logs</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
            {logs.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab('customers')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            activeSubTab === 'customers' 
              ? 'border-blue-500 text-blue-400 bg-blue-500/10 rounded-t-xl' 
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 rounded-t-xl'
          }`}
        >
          <Database size={15} />
          <span>Staff Portfolios Monitor</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-slate-300">
            {staffCustomersCount}
          </span>
        </button>
      </div>

      {/* Sub-Tab 1: Staff Roster & Provisioning Board */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Create New Staff Form */}
          <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5 h-fit">
            <div className="flex items-center gap-2.5 pb-4 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <KeyRound size={18} />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Create Staff Login</h2>
                <p className="text-[11px] text-slate-400">Generate secure credentials for staff member</p>
              </div>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Staff Display Name
                </label>
                <input 
                  type="text" 
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar" 
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Username (User ID)
                </label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ramesh" 
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                  required
                />
                <p className="text-[10px] text-slate-500">Lowercase letters, numbers, or underscores (min 4 chars)</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Secret Password
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter access password" 
                    className="w-full pl-4 pr-11 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 focus:outline-none p-1 rounded-md transition cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-[10px] text-slate-500">Min 6 characters, including letters &amp; numbers</p>
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition duration-150 shadow-lg shadow-blue-600/20 active:scale-98 cursor-pointer"
                >
                  <UserCheck size={16} />
                  <span>Generate Staff Credentials</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Active Staff Roster Cards */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" />
                <span>Active Staff Accounts</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {staffs.length}
                </span>
              </h2>
              <span className="text-[11px] text-slate-400">
                Click any staff card to view &amp; copy credentials
              </span>
            </div>

            {staffs.length === 0 ? (
              <div className="bg-[#0F172A] rounded-3xl p-12 border border-dashed border-slate-800 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto text-slate-500">
                  <Users size={24} />
                </div>
                <p className="text-sm font-semibold text-slate-300">No staff accounts created yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Use the credential generation form on the left to provision username and password logins for your team members.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {staffs.map(staff => {
                  const staffCusts = customs.filter(c => c.createdBy === staff.username);
                  
                  return (
                    <div 
                      key={staff.id || staff.username} 
                      onClick={() => {
                        setSelectedStaffCreds(staff);
                        setCredsPasswordVisible(false);
                      }}
                      className="bg-[#0F172A] border border-slate-800 hover:border-blue-500/50 p-5 rounded-3xl shadow-lg flex flex-col justify-between group hover:bg-[#131F37] transition duration-200 cursor-pointer active:scale-[0.99] relative overflow-hidden"
                      title="Click to view Username/Password credentials"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-sm font-black text-white shadow-md shadow-blue-500/20 shrink-0">
                            {staff.displayName ? staff.displayName.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition">
                              {staff.displayName}
                            </h3>
                            <p className="text-xs font-mono text-blue-400 truncate">@{staff.username}</p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteStaff(staff.username);
                          }}
                          className="text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition cursor-pointer"
                          title="Deactivate staff credentials"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
                          <Calendar size={13} className="text-slate-500" />
                          <span>Joined {(() => {
                            const dateObj = new Date(staff.createdAt);
                            if (isNaN(dateObj.getTime())) return 'N/A';
                            const dd = String(dateObj.getDate()).padStart(2, '0');
                            const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                            const yyyy = dateObj.getFullYear();
                            return `${dd}/${mm}/${yyyy}`;
                          })()}</span>
                        </div>

                        <span className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {staffCusts.length} Customer{staffCusts.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sub-Tab 2: Staff Activity & Audit Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Activity size={18} className="text-amber-400" />
                <span>Staff Activity &amp; Session Logs</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {filteredLogs.length} events
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit trail tracking logins, session sign-outs, customer registrations, and deletions.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleClearLogs}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-bold text-xs rounded-xl transition cursor-pointer shrink-0 flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} />
                <span>Clear History</span>
              </button>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input 
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search staff, action, target..."
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-slate-800 text-white text-xs rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition placeholder-slate-500"
                />
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-slate-950/60 rounded-2xl p-12 text-center text-slate-500 border border-slate-800/60">
              <Activity size={32} className="mx-auto text-slate-600 mb-2" />
              <p className="text-xs font-semibold text-slate-400">No activity log entries found matching criteria.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#131F37]">
                    <th className="px-5 py-3.5">Logged Timestamp</th>
                    <th className="px-5 py-3.5">Staff / User</th>
                    <th className="px-5 py-3.5">Audited Action Event</th>
                    <th className="px-5 py-3.5">Target / Context</th>
                    <th className="px-5 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs bg-slate-950/40">
                  {filteredLogs.map(log => {
                    const isStaff = log.username !== 'admin';
                    const isUserActive = log.username === 'admin' || staffs.some(s => s.username === log.username);
                    const formattedDate = formatTimestampFull(log.timestamp);

                    return (
                      <tr key={log.id || log.timestamp} className="hover:bg-slate-800/30 transition duration-100">
                        <td className="px-5 py-3.5 text-slate-400 font-mono whitespace-nowrap text-[11px]">
                          {formattedDate}
                        </td>
                        <td className="px-5 py-3.5 font-bold">
                          <span className={`px-2.5 py-1 rounded-xl text-[11px] font-mono tracking-wide ${
                            isStaff 
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            @{log.username}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-white">
                          {log.action}
                        </td>
                        <td className="px-5 py-3.5 text-slate-400 text-[11px] font-mono">
                          {log.target || '—'}
                        </td>
                        <td className="px-5 py-3.5 whitespace-nowrap">
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                              <span className="w-1.5 h-1.5 bg-rose-400 rounded-full" />
                              Deactivated
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab 3: Staff Customer Portfolios Monitor */}
      {activeSubTab === 'customers' && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Database size={18} className="text-emerald-400" />
                <span>Staff CRM Customer Portfolios Supervision</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervise customer records registered by staff members. Admin's own customers remain completely segregated.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Filter Staff:</label>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 py-2 px-3 rounded-xl text-xs font-semibold text-slate-200 outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="only_staff">Display All Staff Portfolios ({staffCustomersCount})</option>
                {staffs.map(st => {
                  const count = customs.filter(c => c.createdBy === st.username).length;
                  return (
                    <option key={st.id || st.username} value={st.username}>
                      Staff @{st.username} ({st.displayName}) — {count} customers
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Group and filter customers data list */}
          {(() => {
            const filteredPortfolios = customs.filter(c => {
              // Ignore any customer profile where creator is Superadmin ('admin' or not set)
              if (!c.createdBy || c.createdBy === 'admin') return false;

              if (selectedStaffFilter === 'only_staff') return true;
              return c.createdBy === selectedStaffFilter;
            });

            return filteredPortfolios.length === 0 ? (
              <div className="bg-slate-950/60 rounded-2xl p-12 text-center text-slate-500 border border-slate-800/60">
                <Database size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-xs font-semibold text-slate-400">No registered customer profiles found for this selection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-[#131F37]">
                      <th className="px-5 py-3.5">Customer ID</th>
                      <th className="px-5 py-3.5">Full Name</th>
                      <th className="px-5 py-3.5">Registering Staff Owner</th>
                      <th className="px-5 py-3.5">Phone Directory</th>
                      <th className="px-5 py-3.5">Email Contact</th>
                      <th className="px-5 py-3.5">Registered Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs bg-slate-950/40">
                    {filteredPortfolios.map(cust => {
                      return (
                        <tr key={cust.id} className="hover:bg-slate-800/30 transition duration-100">
                          <td className="px-5 py-3.5 font-mono font-bold text-blue-400">
                            {cust.id}
                          </td>
                          <td className="px-5 py-3.5 font-bold text-white">
                            {cust.name}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                              @{cust.createdBy}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-slate-300 font-mono">
                            {cust.mobileNumber || cust.mobile || cust.phone || 'Unavailable'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 font-mono">
                            {cust.emailId || cust.email || 'Unavailable'}
                          </td>
                          <td className="px-5 py-3.5 text-slate-400 whitespace-nowrap font-mono text-[11px]">
                            {formatTimestampFull(cust.createdAt)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })()}
        </div>
      )}

      {/* Staff Credentials Popup Modal for SuperAdmin */}
      {selectedStaffCreds && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-[#0F172A] rounded-3xl p-6 max-w-sm w-full border border-slate-700 shadow-2xl space-y-4 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-800">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <KeyRound size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Staff Login Credentials</h3>
                <p className="text-[11px] text-slate-400">Share with the staff member to log in</p>
              </div>
            </div>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Staff Display Name</span>
                <div className="font-semibold text-white bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800">
                  {selectedStaffCreds.displayName}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Username (User ID)</span>
                <div 
                  onClick={() => handleCopy(selectedStaffCreds.username, 'username')}
                  className="bg-slate-950 font-mono text-xs px-3.5 py-2.5 rounded-xl text-blue-400 font-bold border border-slate-800 select-all hover:border-blue-500 transition duration-150 cursor-pointer flex justify-between items-center" 
                  title="Click to copy username"
                >
                  <span>{selectedStaffCreds.username}</span>
                  <span className="text-[10px] text-slate-400 font-sans uppercase flex items-center gap-1">
                    {copiedField === 'username' ? (
                      <>
                        <Check size={12} className="text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span>Copy</span>
                      </>
                    )}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</span>
                <div className="relative">
                  <div 
                    onClick={() => handleCopy(selectedStaffCreds.password, 'password')}
                    className="bg-slate-950 font-mono text-xs px-3.5 py-2.5 rounded-xl text-white border border-slate-800 select-all hover:border-blue-500 transition duration-150 cursor-pointer pr-10 flex justify-between items-center" 
                    title="Click to copy password"
                  >
                    <span>{credsPasswordVisible ? selectedStaffCreds.password : '••••••••••••'}</span>
                    <span className="text-[10px] text-slate-400 font-sans uppercase mr-6 flex items-center gap-1">
                      {copiedField === 'password' ? (
                        <>
                          <Check size={12} className="text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          <span>Copy</span>
                        </>
                      )}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCredsPasswordVisible(!credsPasswordVisible);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 rounded-lg transition cursor-pointer"
                    title={credsPasswordVisible ? "Hide password" : "Show password"}
                  >
                    {credsPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStaffCreds(null);
                setCredsPasswordVisible(false);
              }}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition cursor-pointer text-center block mt-4 shadow-lg shadow-blue-600/20"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
