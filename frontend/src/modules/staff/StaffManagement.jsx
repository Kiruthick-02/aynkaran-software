import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { apiService } from '../../services/api';
import { 
  UserPlus, 
  Users, 
  Activity, 
  Trash2, 
  ShieldAlert, 
  KeyRound, 
  Calendar, 
  Search, 
  RefreshCw, 
  Lock, 
  UserCheck, 
  Database,
  ArrowRightLeft,
  Eye,
  EyeOff
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

  const handleClearLogs = async () => {
    if (!confirm("Are you sure you want to permanently clear all staff log history? This action cannot be undone.")) {
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
    // 1. Username length: min 4 chars
    if (cleanUsername.length < 4) {
      showToast('error', 'Username must be at least 4 characters long.');
      return;
    }

    // 2. Username format: alphanumeric and underscore only, starting with a letter
    if (!/^[a-z][a-z0-9_]*$/.test(cleanUsername)) {
      showToast('error', 'Username must start with a letter and contain only lowercase letters, numbers, or underscores.');
      return;
    }

    // 3. Display name length: min 3 chars
    if (cleanDisplayName.length < 3) {
      showToast('error', 'Display Name must be at least 3 characters long.');
      return;
    }

    // 4. Password length: min 6 chars
    if (cleanPassword.length < 6) {
      showToast('error', 'Password must be at least 6 characters.');
      return;
    }

    // 5. Password complexity: at least one letter and one number
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
        <div className="bg-white border border-red-100 max-w-lg p-6 rounded-2xl shadow-xl text-center space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto ring-8 ring-red-50">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Access Denied</h2>
          <p className="text-gray-600 text-sm leading-relaxed">
            The Staff Management &amp; Audit telemetry dashboard is restricted to **Superadmin** authorized credentials only.
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

  return (
    <div id="staff-management-container" className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in">
      
      {/* Banner and Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-100 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Staff supervision</h1>
          <p className="text-sm text-slate-500 mt-1">
            Provision staff profiles, inspect telemetry logs, and supervise staff CRM portfolios securely.
          </p>
        </div>
        
        <button 
          onClick={fetchData} 
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition duration-150 active:scale-95 disabled:opacity-50"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          Refresh Data
        </button>
      </div>

      {/* Action Messages Toast */}
      {actionMessage.text && (
        <div className={`p-4 rounded-xl shadow-md flex items-center gap-3 animate-slide-up border ${
          actionMessage.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'
        }`}>
          <div className={`w-2 h-2 rounded-full ${actionMessage.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold">{actionMessage.text}</p>
        </div>
      )}

      {/* Sub Tabs Controls */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveSubTab('roster')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeSubTab === 'roster' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus size={16} />
          Create &amp; Manage Staffs
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeSubTab === 'logs' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Activity size={16} />
          Staff Activity Logs
        </button>
        <button
          onClick={() => setActiveSubTab('customers')}
          className={`flex items-center gap-2 px-5 py-3 border-b-2 text-sm font-semibold transition-all ${
            activeSubTab === 'customers' 
              ? 'border-indigo-600 text-indigo-600 font-extrabold' 
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database size={16} />
          Staff Portfolios Monitor
        </button>
      </div>

      {/* Roster Section with Provisioning Board */}
      {activeSubTab === 'roster' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* New Staff Form */}
          <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <KeyRound size={20} className="text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Add staff Login</h2>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Display Name</label>
                <input 
                  type="text" 
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Username</label>
                <input 
                  type="text" 
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. ramesh" 
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition font-mono"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Secret access password" 
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded-md hover:bg-slate-100 transition"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition duration-150 shadow-md shadow-indigo-100"
              >
                <UserCheck size={16} />
                Generate Login Credentials
              </button>
            </form>
          </div>

          {/* Roster lists cards group */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Active Staffs ({staffs.length})
            </h2>

            {staffs.length === 0 ? (
              <div className="bg-slate-50 rounded-2xl p-8 border border-dashed border-slate-200 text-center space-y-3">
                <Users size={32} className="text-slate-300 mx-auto" />
                <p className="text-sm font-medium text-slate-500">No managed staff profiles have been created yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                {staffs.map(staff => (
                  <div 
                    key={staff.id} 
                    onClick={() => {
                      setSelectedStaffCreds(staff);
                      setCredsPasswordVisible(false);
                    }}
                    className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex items-center justify-between group hover:shadow-md transition cursor-pointer hover:border-indigo-100 active:scale-[0.99]"
                    title="Click to view Username/Password credentials"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-indigo-700 border border-indigo-50">
                          {staff.displayName ? staff.displayName.charAt(0).toUpperCase() : 'S'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800 text-sm leading-tight">{staff.displayName}</p>
                          <p className="text-xs font-mono text-indigo-500">@{staff.username}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Calendar size={12} />
                        <span>Joined {(() => {
                          const dateObj = new Date(staff.createdAt);
                          if (isNaN(dateObj.getTime())) return 'N/A';
                          const dd = String(dateObj.getDate()).padStart(2, '0');
                          const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
                          const yyyy = dateObj.getFullYear();
                          return `${dd}/${mm}/${yyyy}`;
                        })()}</span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteStaff(staff.username);
                      }}
                      className="bg-transparent text-rose-500 hover:bg-rose-50 hover:text-rose-600 p-2.5 rounded-xl transition cursor-pointer"
                      title="Deactivate staff credentials"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Logs section */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Activity size={20} className="text-rose-600" />
              Staff Log History ({filteredLogs.length})
            </h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-xl transition cursor-pointer shrink-0"
              >
                Clear History
              </button>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  placeholder="Search staff, action, or target ID..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition"
                />
              </div>
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400">
              <Activity size={36} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-medium">No audited telemetry actions meet those filter requirements.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                    <th className="px-4 py-3">Logged Client Timestamp</th>
                    <th className="px-4 py-3">Staff Member</th>
                    <th className="px-4 py-3">Audited Action Event</th>
                    <th className="px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {filteredLogs.map(log => {
                    const isStaff = log.username !== 'admin';
                    const isUserActive = log.username === 'admin' || staffs.some(s => s.username === log.username);
                    
                    const formattedDate = formatTimestampFull(log.timestamp);

                    return (
                      <tr key={log.id} className="hover:bg-slate-50 transition duration-100">
                        <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap">
                          {formattedDate}
                        </td>
                        <td className="px-4 py-3.5 font-bold">
                          <span className={`px-2 py-1 rounded text-xs tracking-wide uppercase ${
                            isStaff ? 'bg-indigo-50 text-indigo-700' : 'bg-amber-50 text-amber-800'
                          }`}>
                            {log.username}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-950">
                          {log.action}
                        </td>
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          {isUserActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600">
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

      {/* Portfolios Monitor Section */}
      {activeSubTab === 'customers' && (
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Database size={20} className="text-emerald-600" />
                Staff CRM Portfolios Supervision
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Filter customers according to registering staff user credentials to view staff portfolios list.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Select Registering Staff Option:</label>
              <select
                value={selectedStaffFilter}
                onChange={(e) => setSelectedStaffFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white cursor-pointer"
              >
                <option value="only_staff">Display All Staff Portfolios</option>
                {staffs.map(st => (
                  <option key={st.id} value={st.username}>Only Staff @{st.username} ({st.displayName})</option>
                ))}
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
              <div className="bg-slate-50 rounded-2xl p-12 text-center text-slate-400">
                <Database size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No registered customer profiles found for this selection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                      <th className="px-4 py-3">Customer ID</th>
                      <th className="px-4 py-3">Full Name</th>
                      <th className="px-4 py-3">Registering Agent/Staff Owner</th>
                      <th className="px-4 py-3">Phone Directory</th>
                      <th className="px-4 py-3">Email Contact</th>
                      <th className="px-4 py-3">Joined Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                    {filteredPortfolios.map(cust => {
                      const isOwnerStaff = cust.createdBy && cust.createdBy !== 'admin';
                      return (
                        <tr key={cust.id} className="hover:bg-slate-50 transition duration-100">
                          <td className="px-4 py-3.5 font-mono font-semibold text-indigo-600">
                            {cust.id}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-slate-800">
                            {cust.name}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`px-2.5 py-1 rounded text-xs font-semibold ${
                              isOwnerStaff ? 'bg-indigo-50 text-indigo-700 font-bold border border-indigo-100' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {cust.createdBy || 'SuperAdmin (admin)'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-slate-600 font-mono">
                            {cust.mobileNumber || cust.mobile || cust.phone || 'Unavailable'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 font-mono">
                            {cust.emailId || cust.email || 'Unavailable'}
                          </td>
                          <td className="px-4 py-3.5 text-slate-400 whitespace-nowrap font-mono">
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

      {/* Staff credentials popup modal for SuperAdmin */}
      {selectedStaffCreds && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-slate-100 shadow-xl space-y-4 relative animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <KeyRound className="text-indigo-600" size={20} />
              <h3 className="text-lg font-bold text-slate-800 font-sans">Staff Credentials</h3>
            </div>
            
            <div className="space-y-3 font-sans">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Staff Display Name</span>
                <div className="font-semibold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl text-sm border border-slate-100">
                  {selectedStaffCreds.displayName}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">Username (User ID)</span>
                <div 
                  onClick={() => {
                    navigator.clipboard.writeText(selectedStaffCreds.username);
                  }}
                  className="bg-slate-50 font-mono text-xs px-3 py-2 rounded-xl text-indigo-600 font-semibold border border-slate-100 select-all hover:bg-slate-100 transition duration-150 cursor-pointer flex justify-between items-center" 
                  title="Click to copy username"
                >
                  <span>{selectedStaffCreds.username}</span>
                  <span className="text-[9px] text-slate-400 font-sans uppercase">Click to copy</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1 font-sans">Password</span>
                <div className="relative">
                  <div 
                    onClick={() => {
                      navigator.clipboard.writeText(selectedStaffCreds.password);
                    }}
                    className="bg-slate-50 font-mono text-xs px-3 py-2 rounded-xl text-slate-800 border border-slate-100 select-all hover:bg-slate-100 transition duration-150 cursor-pointer pr-10 flex justify-between items-center" 
                    title="Click to copy password"
                  >
                    <span>{credsPasswordVisible ? selectedStaffCreds.password : '••••••••'}</span>
                    <span className="text-[9px] text-slate-400 font-sans uppercase mr-6">Click to copy</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCredsPasswordVisible(!credsPasswordVisible);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 transition cursor-pointer"
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
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 rounded-xl text-xs font-bold transition cursor-pointer text-center block mt-3"
            >
              Done / Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
