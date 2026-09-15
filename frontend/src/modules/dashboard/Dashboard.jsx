import React, { useMemo } from 'react';
import {
  UserPlus,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  Briefcase,
  Users,
  ShieldCheck,
  FolderLock,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  FileSpreadsheet,
  CheckCircle2,
  Bell,
  Layers
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export default function Dashboard({
  candidates = [],
  policies = [],
  customers = [],
  allSupervisedCustomers = [],
  companies = [],
  reminders = [],
  advisors = [],
  staffs = [],
  userRole = 'SuperAdmin',
  adminUser = 'admin',
  onNavigate,
}) {
  const isStaff = userRole === 'Staff';

  // 1. Calculations & Metrics
  const activeCompaniesCount = useMemo(() => {
    return (companies || []).filter((c) => c.status === 'Active' || !c.status).length;
  }, [companies]);

  const activePolicySchemesCount = useMemo(() => {
    return (companies || []).reduce((acc, comp) => {
      if (comp.status === 'Active' || !comp.status) {
        const schemes = Array.isArray(comp.policies) ? comp.policies : [];
        return acc + schemes.length;
      }
      return acc;
    }, 0);
  }, [companies]);

  const activeRecruitments = useMemo(() => {
    return candidates.filter((c) => c.currentStage !== 'Generate Agent Code' && !c.isConvertedToAdvisor).length;
  }, [candidates]);

  const convertedAdvisorsCount = useMemo(() => {
    return (Array.isArray(advisors) && advisors.length > 0)
      ? advisors.length
      : candidates.filter((c) => c.isConvertedToAdvisor || c.currentStage === 'Generate Agent Code').length;
  }, [advisors, candidates]);

  const activeRemindersCount = useMemo(() => {
    return reminders.filter((r) => !r.completed).length;
  }, [reminders]);

  const renewalsDueCount = useMemo(() => {
    return reminders.filter((r) => r.targetType === 'renewal' && !r.completed).length;
  }, [reminders]);

  // Combined upcoming renewals list with Customer, Company, Policy Chosen, and Renewal Date
  const upcomingRenewalsList = useMemo(() => {
    const list = [];
    
    // 1. Check policies leads
    policies.forEach((p) => {
      if (p.renewalDate && p.renewalDate !== 'Pending' && p.renewalDate !== 'N/A') {
        const matchingCust = customers.find(c => c.id === p.customerId || c.name === p.customerName);
        const comp = p.companyName || p.insuranceCompany || matchingCust?.insuranceCompany || matchingCust?.companyName || 'Aynkaran';
        list.push({
          id: p.id,
          customerName: p.customerName || matchingCust?.name || 'Customer',
          companyName: comp,
          policyType: p.policyType || p.policyName || matchingCust?.policyType || 'Insurance Policy',
          issuedPolicyNumber: p.issuedPolicyNumber || p.id,
          renewalDate: p.renewalDate,
        });
      }
    });

    // 2. Check customer records who have renewalDate directly
    customers.forEach((c) => {
      const renDate = c.renewalDate || c.policyRenewalDate;
      if (renDate && renDate !== 'Pending' && renDate !== 'N/A' && !list.some(item => item.customerName === c.name)) {
        list.push({
          id: c.id,
          customerName: c.name,
          companyName: c.insuranceCompany || c.companyName || c.company || 'Aynkaran',
          policyType: c.policyType || c.policyName || c.policy || 'Insurance Policy',
          issuedPolicyNumber: c.policyNumber || c.id,
          renewalDate: renDate,
        });
      }
    });

    return list
      .sort((a, b) => new Date(a.renewalDate || 0) - new Date(b.renewalDate || 0))
      .slice(0, 5);
  }, [policies, customers]);

  // Total managed customers across all staff
  const staffManagedCustomersCount = useMemo(() => {
    const source = allSupervisedCustomers.length > 0 ? allSupervisedCustomers : customers;
    return source.filter((c) => c.createdBy && c.createdBy !== 'admin').length;
  }, [allSupervisedCustomers, customers]);

  // Missing KYC slots count
  const totalMissingKycCount = useMemo(() => {
    const requiredKyc = ['incomeProof', 'educationCertificate', 'aadhaarCard', 'panCard', 'passportSizePhoto'];
    return customers.reduce((acc, cust) => {
      const kyc = cust.kycDocuments || {};
      const missing = requiredKyc.filter((key) => !kyc[key] && !cust[key + 'Url']).length;
      return acc + missing;
    }, 0);
  }, [customers]);

  // Chart 1: Policy Sales & Customer Coverage by Insurance Company
  const companyDistributionChartData = useMemo(() => {
    const counts = {};

    // First tally from registered companies and their policies
    companies.forEach((comp) => {
      const cName = comp.name || 'Other';
      const schemeCount = (comp.policies || []).length;
      counts[cName] = schemeCount;
    });

    // Also count policies assigned to customers
    policies.forEach((p) => {
      const cName = p.companyName || p.insuranceCompany || 'General';
      counts[cName] = (counts[cName] || 0) + 1;
    });

    if (Object.keys(counts).length === 0) {
      return [
        { name: 'HDFC Life', 'Policies Count': 3 },
        { name: 'SBI', 'Policies Count': 2 },
        { name: 'KLA', 'Policies Count': 1 },
      ];
    }

    return Object.entries(counts).map(([name, count]) => ({
      name: name.length > 15 ? name.slice(0, 13) + '..' : name,
      'Policies Count': count,
    }));
  }, [companies, policies]);

  // Chart 2: Policy Categories / Schemes Distribution
  const policyTypeChartData = useMemo(() => {
    const counts = {};

    // Collect all policies from companies
    companies.forEach((comp) => {
      (comp.policies || []).forEach((pol) => {
        const name = pol.name || 'General Plan';
        counts[name] = (counts[name] || 0) + 1;
      });
    });

    // Collect policies from active policy leads
    policies.forEach((cur) => {
      const type = (cur.policyType || 'Standard Plan').split('(')[0].trim();
      counts[type] = (counts[type] || 0) + 1;
    });

    const entries = Object.entries(counts);
    if (entries.length === 0) {
      return [
        { name: 'Sanjay Par Advantage', value: 1 },
        { name: 'Health', value: 1 },
        { name: 'Travel', value: 1 },
      ];
    }

    return entries.map(([name, count]) => ({
      name,
      value: count,
    }));
  }, [companies, policies]);

  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#14b8a6', '#6366f1'];

  return (
    <div className="space-y-7 max-w-7xl mx-auto font-sans text-slate-200 animate-fade-in pb-12">
      
      {/* 1. Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-2xl">
              <Sparkles size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {isStaff ? 'Staff Operations & Sales Desk' : 'Executive Command Center'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time operational business metrics for Aynkaran Consultants • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            <span>MongoDB Atlas Active</span>
          </span>

          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <ShieldCheck size={14} />
            <span>{isStaff ? `Staff: @${adminUser}` : 'SuperAdmin Full Rights'}</span>
          </span>
        </div>
      </div>

      {/* 2. Top Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Customers */}
        <div className="bg-[#0F172A] p-5 rounded-3xl border border-slate-800 shadow-xl hover:border-slate-700 transition duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isStaff ? 'My CRM Clients' : 'Active Customer Base'}
              </p>
              <h3 className="text-3xl font-black text-white mt-1 font-mono">
                {isStaff ? customers.length : (allSupervisedCustomers.length > 0 ? allSupervisedCustomers.length : customers.length)}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Registered client profiles &amp; nominees
              </p>
            </div>
            <div className="bg-blue-500/10 text-blue-400 p-3 rounded-2xl border border-blue-500/20 group-hover:scale-105 transition">
              <Users size={22} />
            </div>
          </div>

          <button
            onClick={() => onNavigate('customers')}
            className="w-full text-left font-bold text-xs text-blue-400 hover:text-blue-300 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between group-hover:translate-x-0.5 transition cursor-pointer"
          >
            <span>Open Customers Directory</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* KPI 2: Companies & Policies (Created & Active) */}
        <div className="bg-[#0F172A] p-5 rounded-3xl border border-slate-800 shadow-xl hover:border-slate-700 transition duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Companies &amp; Policies</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1 font-mono">{activeCompaniesCount}</h3>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold mt-1">
                <ShieldCheck size={13} />
                <span>{activePolicySchemesCount} Active Policy Schemes</span>
              </div>
            </div>
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl border border-emerald-500/20 group-hover:scale-105 transition">
              <Building2 size={22} />
            </div>
          </div>

          <button
            onClick={() => onNavigate('policies')}
            className="w-full text-left font-bold text-xs text-emerald-400 hover:text-emerald-300 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between group-hover:translate-x-0.5 transition cursor-pointer"
          >
            <span>View Companies &amp; Policies</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

        {/* KPI 3: SuperAdmin (Recruitment) OR Staff (Renewals) */}
        {!isStaff ? (
          <div className="bg-[#0F172A] p-5 rounded-3xl border border-slate-800 shadow-xl hover:border-slate-700 transition duration-200 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Agent Recruitment Funnel</p>
                <h3 className="text-3xl font-black text-purple-400 mt-1 font-mono">{activeRecruitments}</h3>
                <p className="text-[11px] text-purple-300 font-medium mt-1">
                  {convertedAdvisorsCount} Licensed Advisors active
                </p>
              </div>
              <div className="bg-purple-500/10 text-purple-400 p-3 rounded-2xl border border-purple-500/20 group-hover:scale-105 transition">
                <UserPlus size={22} />
              </div>
            </div>

            <button
              onClick={() => onNavigate('recruitment')}
              className="w-full text-left font-bold text-xs text-purple-400 hover:text-purple-300 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between group-hover:translate-x-0.5 transition cursor-pointer"
            >
              <span>15-Stage Advisor Funnel</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        ) : (
          <div className="bg-[#0F172A] p-5 rounded-3xl border border-slate-800 shadow-xl hover:border-slate-700 transition duration-200 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pending Renewals</p>
                <h3 className="text-3xl font-black text-amber-400 mt-1 font-mono">{renewalsDueCount}</h3>
                <p className="text-[11px] text-slate-400 mt-1">Scheduled follow-up alerts</p>
              </div>
              <div className="bg-amber-500/10 text-amber-400 p-3 rounded-2xl border border-amber-500/20 group-hover:scale-105 transition">
                <Clock size={22} />
              </div>
            </div>

            <button
              onClick={() => onNavigate('reminders')}
              className="w-full text-left font-bold text-xs text-amber-400 hover:text-amber-300 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between group-hover:translate-x-0.5 transition cursor-pointer"
            >
              <span>Reminders &amp; Alerts</span>
              <ArrowUpRight size={14} />
            </button>
          </div>
        )}

        {/* KPI 4: Active Reminders & Alerts Console */}
        <div className="bg-[#0F172A] p-5 rounded-3xl border border-slate-800 shadow-xl hover:border-slate-700 transition duration-200 flex flex-col justify-between group">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {isStaff ? 'My Active Alerts' : 'Reminders Console'}
              </p>
              <h3 className="text-3xl font-black text-amber-400 mt-1 font-mono">
                {activeRemindersCount}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">
                Automated SMS, WhatsApp &amp; Email alerts
              </p>
            </div>
            <div className="bg-amber-500/10 text-amber-400 p-3 rounded-2xl border border-amber-500/20 group-hover:scale-105 transition">
              <Bell size={22} />
            </div>
          </div>

          <button
            onClick={() => onNavigate('reminders')}
            className="w-full text-left font-bold text-xs text-amber-400 hover:text-amber-300 mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between group-hover:translate-x-0.5 transition cursor-pointer"
          >
            <span>Open Reminders Console</span>
            <ArrowUpRight size={14} />
          </button>
        </div>

      </div>

      {/* 3. Interactive Charts Grid (2:1 Column layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart A: Policy Sales & Provider Coverage by Insurance Company */}
        <div className="lg:col-span-2 bg-[#0F172A] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Layers size={16} className="text-emerald-400" />
                <span>Policy Sales &amp; Schemes by Insurance Company</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Active policy schemes and leads categorized per company</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-slate-800 px-2.5 py-1 rounded-xl text-slate-300">
              {activeCompaniesCount} Companies Active
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={companyDistributionChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E293B" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: '#0B1120', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '12px' }}
                  cursor={{ fill: 'rgba(51, 65, 85, 0.3)' }}
                />
                <Bar dataKey="Policies Count" fill="#10b981" radius={[6, 6, 0, 0]} barSize={38} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart B: Policy Schemes Distribution */}
        <div className="bg-[#0F172A] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-blue-400" />
              <span>Policy Schemes Distribution</span>
            </h3>
            <p className="text-xs text-slate-400 mb-2">Breakdown of insurance schemes across providers</p>
          </div>

          <div className="h-56 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={policyTypeChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {policyTypeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val) => [`${val} Schemes / Policies`, 'Available']}
                  contentStyle={{ background: '#0B1120', borderRadius: '12px', border: '1px solid #334155', color: '#fff', fontSize: '11px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[10px]">
            {policyTypeChartData.slice(0, 4).map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-slate-300 truncate">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* 4. Action Center Grid: Renewals Watchlist + Quick Launchpad */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Upcoming Renewals Watchlist */}
        <div className="lg:col-span-2 bg-[#0F172A] p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Clock className="text-amber-400" size={18} />
              <div>
                <h3 className="text-sm font-bold text-white">Upcoming Renewals Watchlist</h3>
                <p className="text-xs text-slate-400">Customer policies, chosen schemes, and scheduled renewal deadlines</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('reminders')}
              className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
            >
              <span>View All Alerts</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {upcomingRenewalsList.length === 0 ? (
            <div className="py-10 text-center text-slate-500 space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500" />
              <p className="text-xs font-semibold text-slate-400">No overdue renewal assignments pending right now.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {upcomingRenewalsList.map((p) => {
                const isOverdue = new Date(p.renewalDate) <= new Date();
                return (
                  <div
                    key={p.id}
                    onClick={() => onNavigate('reminders')}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-2xl flex items-center justify-between gap-3 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl text-xs font-bold ${
                        isOverdue ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        <Calendar size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white group-hover:text-blue-400 transition">
                          {p.customerName || 'Client Policyholder'}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                          <strong className="text-slate-300">{p.companyName}</strong> • {p.policyType}
                          {p.issuedPolicyNumber && p.issuedPolicyNumber !== 'Unissued' && (
                            <span className="text-slate-500"> • Policy: {p.issuedPolicyNumber}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full font-mono ${
                        isOverdue ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        Due: {p.renewalDate}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Quick Launchpad & Integrity Hub */}
        <div className="bg-[#0F172A] p-6 rounded-3xl border border-slate-800 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-1">
              <Briefcase size={16} className="text-blue-400" />
              <span>Quick Command Launchpad</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">Direct shortcuts to system modules</p>

            <div className="space-y-2">
              <button
                onClick={() => onNavigate('customers')}
                className="w-full text-left p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Users size={15} className="text-blue-400" />
                  <span>Register Client Profile</span>
                </span>
                <ArrowRight size={13} className="text-slate-500" />
              </button>

              <button
                onClick={() => onNavigate('policies')}
                className="w-full text-left p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Building2 size={15} className="text-emerald-400" />
                  <span>Companies &amp; Schemes ({activeCompaniesCount})</span>
                </span>
                <ArrowRight size={13} className="text-slate-500" />
              </button>

              {!isStaff && (
                <>
                  <button
                    onClick={() => onNavigate('recruitment')}
                    className="w-full text-left p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <UserPlus size={15} className="text-purple-400" />
                      <span>Recruitment Funnel Pipeline</span>
                    </span>
                    <ArrowRight size={13} className="text-slate-500" />
                  </button>

                  <button
                    onClick={() => onNavigate('staff_management')}
                    className="w-full text-left p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <ShieldCheck size={15} className="text-amber-400" />
                      <span>Staff Supervision ({staffManagedCustomersCount} Managed)</span>
                    </span>
                    <ArrowRight size={13} className="text-slate-500" />
                  </button>
                </>
              )}

              <button
                onClick={() => onNavigate('reports')}
                className="w-full text-left p-3 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-xs font-bold text-slate-200 transition cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet size={15} className="text-rose-400" />
                  <span>Audit Exports &amp; Reports</span>
                </span>
                <ArrowRight size={13} className="text-slate-500" />
              </button>
            </div>
          </div>

          <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <FolderLock size={15} className="text-blue-400" />
              <span>KYC Compliance</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-amber-400">
              {totalMissingKycCount} missing slots
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}
