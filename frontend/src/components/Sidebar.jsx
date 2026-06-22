import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  Users,
  Bell,
  FolderClosed,
  Download,
  RefreshCw,
  LogOut,
  ShieldCheck
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, adminUsername }) {
  const { userRole } = useApp();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ...(userRole === 'SuperAdmin' ? [
      { id: 'recruitment', label: 'Recruitment (Agents)', icon: UserPlus },
      { id: 'staff_management', label: 'Staff Supervision', icon: ShieldCheck }
    ] : []),
    { id: 'policies', label: 'Policy Sales', icon: FileText },
    { id: 'customers', label: 'Customer CRM', icon: Users },
    { id: 'reminders', label: 'Reminders Console', icon: Bell },
    { id: 'documents', label: 'Document Vault', icon: FolderClosed },
    { id: 'reports', label: 'Export & Reports', icon: Download },
  ];

  return (
    <aside className="w-60 bg-[#0F172A] flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800/60 select-none">
      <div className="p-6">
        <h1 className="text-white font-bold text-lg tracking-tight uppercase leading-none">Aynkaran</h1>
        <p className="text-slate-400 text-[10px] tracking-widest uppercase mt-0.5">Consultants</p>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
               key={item.id}
               id={`nav-tab-${item.id}`}
               onClick={() => setActiveTab(item.id)}
               className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-xs font-medium transition-colors cursor-pointer text-left ${
                 isActive
                   ? 'bg-blue-600 text-white'
                   : 'text-slate-300 hover:bg-slate-800'
               }`}
            >
              <IconComponent size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-auto p-4 border-t border-slate-800 bg-[#0B132B]/40">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white uppercase">
            {adminUsername.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{adminUsername === 'admin' ? 'SuperAdmin' : adminUsername}</p>
            <p className="text-[10px] text-slate-400 truncate">v1.4.0 (Aynkaran Desk)</p>
          </div>
        </div>

        <button
          onClick={onLogout}
          id="btn-logout"
          className="w-full flex items-center justify-between px-2.5 py-1.5 text-[10px] font-semibold text-rose-400 hover:bg-rose-500/10 rounded-md transition-colors cursor-pointer"
        >
          <span className="flex items-center space-x-1.5">
            <LogOut size={12} />
            <span>Sign Out Session</span>
          </span>
          <span className="text-[9px] bg-slate-800 px-1 py-0.2 rounded text-slate-400">Offline</span>
        </button>
      </div>
    </aside>
  );
}
