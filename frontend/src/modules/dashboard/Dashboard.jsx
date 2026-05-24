import React from 'react';
import {
  UserPlus,
  FileText,
  Clock,
  ArrowUpRight,
  TrendingUp,
  AlertTriangle,
  Award,
  CircleDollarSign,
  Briefcase,
  Users,
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
  Cell,
} from 'recharts';

export default function Dashboard({
  candidates = [],
  policies = [],
  customers = [],
  reminders = [],
  onNavigate,
}) {
  const activeRecruitments = candidates.filter((c) => c.currentStage !== 'Generate Agent Code').length;

  const pendingInterviews =
    candidates.filter((c) => c.currentStage === 'Meeting Appointment').length +
    policies.filter((p) => p.currentStage === 'Meeting Appointment').length;

  const policyLeads = policies.filter((p) => p.currentStage !== 'Policy Issued' && p.currentStage !== 'Renewal Date Assigned').length;

  const convertedPolicies = policies.filter(
    (p) => p.currentStage === 'Policy Issued' || p.currentStage === 'Renewal Date Assigned'
  ).length;

  const renewalsDue = reminders.filter((r) => r.targetType === 'renewal' && !r.completed).length;

  const totalMissingDocSlots = customers.reduce((acc, cust) => {
    const slots = ['incomeProof', 'educationCertificate', 'aadhaarCard', 'panCard', 'passportSizePhoto'];
    const missing = slots.filter((slot) => !cust.kycDocuments[slot]).length;
    return acc + missing;
  }, 0);

  const upcomingExams = candidates.filter((c) => c.currentStage === 'Schedule Exam' || (c.exam && c.exam.scheduledDate && !c.exam.result)).length;

  const policyRevenue = policies
    .filter((p) => p.currentStage === 'Policy Issued' || p.currentStage === 'Renewal Date Assigned')
    .reduce((sum, p) => sum + p.premiumAmount, 0);

  const recruitmentFees = candidates.reduce((sum, cand) => {
    let candSum = 0;
    if (cand.fees?.applicationFeePaid) candSum += cand.fees.appFeeAmount || 0;
    if (cand.fees?.trainingFeePaid) candSum += cand.fees.trainingFeeAmount || 0;
    return sum + candSum;
  }, 0);

  const totalRevenue = policyRevenue + recruitmentFees;

  const policyLeadConversionRate = policies.length
    ? Math.round((convertedPolicies / policies.length) * 100)
    : 0;

  const stageCounts = {};
  candidates.forEach((c) => {
    stageCounts[c.currentStage] = (stageCounts[c.currentStage] || 0) + 1;
  });

  const recruitmentChartData = Object.entries(stageCounts).map(([stage, count]) => ({
    stage: stage.replace('Collection', 'Coll.').substring(0, 15) + '...',
    'Candidates Count': count,
  }));

  const policyTypeRevenue = policies
    .filter((p) => p.currentStage === 'Policy Issued' || p.currentStage === 'Renewal Date Assigned')
    .reduce((acc, cur) => {
      const type = cur.policyType.split('(')[0].trim();
      acc[type] = (acc[type] || 0) + cur.premiumAmount;
      return acc;
    }, {});

  const revenuePieData = Object.entries(policyTypeRevenue).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#14b8a6'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">Operations Dashboard</h1>
          <p className="text-xs text-slate-500 font-medium">
            Real-time business performance parameters for Aynkaran Consultants • {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div id="quick-indicators" className="mt-3 md:mt-0 flex space-x-2">
          <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-100 text-emerald-800 rounded-lg">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span>Desktop API Terminal Active</span>
          </span>
          <span className="inline-flex items-center px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-lg">
            Offline Cache Local
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recruitment Pipe</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1 font-sans">{activeRecruitments}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Pending Generation of agent codes</p>
            </div>
            <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600">
              <UserPlus size={20} />
            </div>
          </div>
          <button
            onClick={() => onNavigate('recruitment')}
            className="w-full text-left font-semibold text-xs text-blue-600 hover:text-blue-800 mt-4 flex items-center group"
          >
            <span>View pipeline tracker</span>
            <ArrowUpRight size={13} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Policy Conversions</p>
              <h3 className="text-3xl font-bold text-slate-800 mt-1 font-sans">{convertedPolicies}</h3>
              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center space-x-1">
                <TrendingUp size={12} />
                <span>{policyLeadConversionRate}% Conversion Success</span>
              </p>
            </div>
            <div className="bg-emerald-50 p-2.5 rounded-xl text-emerald-600">
              <FileText size={20} />
            </div>
          </div>
          <button
            onClick={() => onNavigate('policies')}
            className="w-full text-left font-semibold text-xs text-emerald-600 hover:text-emerald-800 mt-4 flex items-center group"
          >
            <span>Policy sales management</span>
            <ArrowUpRight size={13} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Renewals Pending</p>
              <h3 className="text-3xl font-semibold text-amber-600 mt-1 font-sans">{renewalsDue}</h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Renewal dates assigned</p>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600">
              <Clock size={20} />
            </div>
          </div>
          <button
            onClick={() => onNavigate('reminders')}
            className="w-full text-left font-semibold text-xs text-amber-600 hover:text-amber-800 mt-4 flex items-center group"
          >
            <span>Check scheduled timers</span>
            <ArrowUpRight size={13} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Annual Premium Volume</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-1 font-sans">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </h3>
              <p className="text-[10px] text-slate-400 font-medium mt-1">Includes ₹{recruitmentFees} Recruitment Fees</p>
            </div>
            <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600">
              <CircleDollarSign size={20} />
            </div>
          </div>
          <button
            onClick={() => onNavigate('reports')}
            className="w-full text-left font-semibold text-xs text-rose-600 hover:text-rose-800 mt-4 flex items-center group"
          >
            <span>Generate business report</span>
            <ArrowUpRight size={13} className="ml-1 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white pb-6 pt-5 px-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Recruitment Pipeline Stages Distribution</h3>
          {recruitmentChartData.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={recruitmentChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="stage" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    cursor={{ fill: '#f8fafc' }}
                  />
                  <Bar dataKey="Candidates Count" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 italic text-sm">
              No recruitment candidates currently on stages.
            </div>
          )}
        </div>

        <div className="bg-white pb-6 pt-5 px-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="text-sm font-bold text-slate-800 mb-3 uppercase tracking-wider">Premium Contribution by Plan</h3>
          {revenuePieData.length > 0 ? (
            <div className="flex-1 flex flex-col justify-between">
              <div className="h-44 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={revenuePieData} cx="50%" cy="50%" innerRadius={45} outerRadius={65} paddingAngle={3} dataKey="value">
                      {revenuePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val) => `₹${val.toLocaleString('en-IN')}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {revenuePieData.map((data, index) => (
                  <div key={data.name} className="flex justify-between items-center text-xs">
                    <span className="flex items-center space-x-1.5 text-slate-600 truncate max-w-[150px]">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                      <span className="truncate">{data.name}</span>
                    </span>
                    <span className="font-semibold text-slate-800">₹{data.value.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400 italic text-sm">
              No converted insurance policy contracts.
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
              <AlertTriangle size={16} className="text-amber-500" />
              <span>Critical Operations Attention Required</span>
            </h3>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded font-mono font-bold">
              {reminders.filter((r) => !r.completed).length} Pending Alerts
            </span>
          </div>

          <div className="space-y-3 max-h-[280px] overflow-y-auto">
            {reminders.filter((r) => !r.completed).slice(0, 4).map((reminder) => (
              <div
                key={reminder.id}
                className="p-3 bg-amber-50/50 hover:bg-amber-50 border border-amber-100 rounded-xl transition-colors flex items-start space-x-3 text-xs"
              >
                <div className="mt-0.5 p-1 bg-amber-100 rounded-lg text-amber-700">
                  <Clock size={14} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <p className="font-extrabold text-amber-900 leading-tight">{reminder.title}</p>
                    <span className="text-[10px] text-amber-700 bg-white border border-amber-200 px-1.5 py-0.5 rounded font-medium">
                      {reminder.triggerType}
                    </span>
                  </div>
                  <p className="text-slate-600 mt-1">{reminder.description}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-1.5">Due Date: {reminder.dueDate}</p>
                </div>
              </div>
            ))}
            {reminders.filter((r) => !r.completed).length === 0 && (
              <div className="py-8 text-center text-slate-400 text-xs">
                Perfect! No pending alerts or overdue pipeline items.
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
              <h3 className="font-bold text-sm text-slate-800 flex items-center space-x-2">
                <Award size={16} className="text-indigo-500" />
                <span>Upcoming Agent Exams & Results</span>
              </h3>
              <span className="text-xs text-slate-500">Scheduled Exams</span>
            </div>

            <div className="space-y-3">
              {candidates
                .filter((c) => c.currentStage === 'Schedule Exam' || c.currentStage === 'Reschedule Exam' || c.currentStage === 'Exam Result')
                .slice(0, 3)
                .map((candidate) => (
                  <div key={candidate.id} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-100 rounded-xl hover:bg-slate-100/60 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{candidate.name}</p>
                      <p className="text-[10px] font-medium text-slate-500">Contact: {candidate.mobile}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded ${
                        candidate.currentStage === 'Reschedule Exam'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {candidate.currentStage}
                      </span>
                      {candidate.exam?.scheduledDate && (
                        <p className="text-[9px] text-slate-400 font-mono mt-0.5">Date: {candidate.exam.scheduledDate}</p>
                      )}
                    </div>
                  </div>
                ))}
              {candidates.filter((c) => c.currentStage === 'Schedule Exam' || c.currentStage === 'Reschedule Exam' || c.currentStage === 'Exam Result').length === 0 && (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No trainee candidate ready for IRDAI testing currently.
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-4 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center space-x-1.5 font-medium text-slate-700">
              <Users size={14} className="text-slate-400" />
              <span>Active Agent Pipeline Total: <strong>{candidates.length}</strong></span>
            </span>
            <button
              onClick={() => onNavigate('recruitment')}
              className="font-bold text-indigo-600 hover:underline animate-pulse"
            >
              Add New Candidate →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
