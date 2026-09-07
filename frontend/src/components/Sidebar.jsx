//src/components/Sidebar.jsx
import React from 'react';
<<<<<<< HEAD
import { 
  LayoutDashboard, 
  Building2, 
  UserCheck, 
  Users, 
  Bell, 
  FileBox, 
  ShieldAlert, 
  FileText, 
  Globe, 
  LogOut 
} from 'lucide-react';

/**
 * Sidebar Component
 * Matches the exact design and 9-item structure of the Aynkaran Consultants dashboard.
 */
const Sidebar = ({ activeTab, setActiveTab, onLogout, adminUsername = "SuperAdmin" }) => {
  
  // The specific 9 modules from your screenshot requirement
  const menuItems = [
    { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    { id: 'policies', name: 'Companies & Policies', icon: Building2 },
    { id: 'recruitment', name: 'Agent Recruitment', icon: UserCheck },
    { id: 'customers', name: 'Customers', icon: Users },
    { id: 'reminders', name: 'Reminders Console', icon: Bell },
    { id: 'documents', name: 'Documents Vault', icon: FileBox },
    { id: 'staff_management', name: 'Staff Supervision', icon: ShieldAlert },
    { id: 'reports', name: 'Exports & Reports', icon: FileText },
    { id: 'content', name: 'Content Publishing', icon: Globe },
=======
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
>>>>>>> d96c25bb403988716178a2b21910505a45607a70
  ];

  return (
    <aside className="w-72 bg-[#1b3b8c] flex flex-col h-full text-white shrink-0 shadow-2xl">
      {/* Brand Header */}
      <div className="p-8 pb-10">
        <h1 className="text-2xl font-black tracking-wider uppercase leading-none">Aynkaran</h1>
        <p className="text-[10px] text-white/60 font-bold tracking-[0.3em] uppercase mt-1">Consultants</p>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-5 py-3 rounded-full transition-all text-[11px] font-bold uppercase tracking-widest cursor-pointer ${
                isActive 
                  ? 'bg-white text-[#1b3b8c] shadow-lg' 
                  : 'text-white/80 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-4">
                <Icon size={18} className={isActive ? 'text-[#1b3b8c]' : 'text-white/70'} />
                <span>{item.name}</span>
              </div>
              
              {/* Badges for Notifications (e.g. Customers, Staff) */}
              {item.badge && (
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                  isActive ? 'bg-[#1b3b8c] text-white' : 'bg-blue-500 text-white'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Profile & Sign Out Block (Dark Navy Background) */}
      <div className="bg-[#0e2154] p-6 space-y-5 border-t border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#1b3b8c] flex items-center justify-center font-bold text-sm shadow-inner border border-white/10">
            {adminUsername.substring(0, 2).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-white truncate">{adminUsername}</p>
            <p className="text-[10px] text-white/40 font-medium truncate">v1.4.0 (Aynkaran Desk)</p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-white/5">
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-rose-400 hover:text-rose-300 text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer"
          >
            <LogOut size={16} /> 
            <span>Sign Out Session</span>
          </button>
          
          <span className="bg-black/40 px-2.5 py-0.5 rounded text-[10px] font-mono text-white/60 font-bold">
            OFFLINE
          </span>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;