import React, { useState } from 'react';
import {
  FileText,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Eye,
  Calculator,
  User,
  AlertCircle,
} from 'lucide-react';

export const POLICY_STAGES = [
  'Meeting Appointment',
  'Quote Given',
  'Result (Yes/No)',
  'Collect Full Customer Details',
  'Additional Documents',
  'Policy Issued',
  'Renewal Date Assigned',
];

export default function PolicySales({ policies = [], addPolicy, updatePolicy, deletePolicy, customers = [] }) {
  const [selectedLead, setSelectedLead] = useState(null);
  const [isAddingLead, setIsAddingLead] = useState(false);

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customCustomerName, setCustomCustomerName] = useState('');
  const [policyType, setPolicyType] = useState('LIFE - Term / Savings / Pension plans');
  const [sumAssured, setSumAssured] = useState('1000000');
  const [premiumAmount, setPremiumAmount] = useState('32000');
  const [premiumTerm, setPremiumTerm] = useState('Yearly');
  const [initialNotes, setInitialNotes] = useState('');

  const [quoteDescription, setQuoteDescription] = useState('');
  const [quoteAmount, setQuoteAmount] = useState('');

  const [leadResult, setLeadResult] = useState('Yes');
  const [issuedPolicyNo, setIssuedPolicyNo] = useState('');
  const [issuedDateStr, setIssuedDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [renewalDateStr, setRenewalDateStr] = useState('');

  const totalLeads = policies.length;
  const answeredLeads = policies.filter((p) => p.result !== undefined).length;
  const convertedLeadsCount = policies.filter((p) => p.result === 'Yes').length;
  const conversionPercent = answeredLeads ? Math.round((convertedLeadsCount / answeredLeads) * 100) : 0;

  const handleAddLead = (e) => {
    e.preventDefault();

    let name = customCustomerName;
    let custId = selectedCustomerId || `cust-temp-${Date.now().toString().substring(7)}`;

    if (selectedCustomerId) {
      const match = customers.find((c) => c.id === selectedCustomerId);
      if (match) name = match.name;
    }

    if (!name) return;

    const newLead = {
      id: `pol-${Date.now().toString().substring(7)}`,
      customerId: custId,
      customerName: name,
      policyType,
      sumAssured: parseFloat(sumAssured) || 500000,
      premiumAmount: parseFloat(premiumAmount) || 12000,
      premiumTerm,
      currentStage: 'Meeting Appointment',
      quotes: [
        {
          id: `q-${Date.now()}`,
          description: `Initial proposal calculation for ${policyType}`,
          amount: parseFloat(premiumAmount) || 12000,
          date: new Date().toISOString().split('T')[0],
        },
      ],
      pendingStageSince: new Date().toISOString().split('T')[0],
      notes: initialNotes || 'Initial appointment logged.',
    };

    addPolicy(newLead);
    setIsAddingLead(false);
    setSelectedCustomerId('');
    setCustomCustomerName('');
    setInitialNotes('');
  };

  const promoteLeadStage = (leadId, nextStage) => {
    const lead = policies.find((l) => l.id === leadId);
    if (!lead) return;

    let finalStage = nextStage;
    let resultVal = lead.result;
    let finalPolicyNo = lead.issuedPolicyNumber;
    let finalIssueDate = lead.issueDate;
    let finalRenewalDate = lead.renewalDate;

    if (nextStage === 'Result (Yes/No)') {
      resultVal = leadResult;
    } else if (nextStage === 'Policy Issued') {
      finalPolicyNo = issuedPolicyNo || `POL-AYN-${Math.floor(100000 + Math.random() * 900000)}`;
      finalIssueDate = issuedDateStr || new Date().toISOString().split('T')[0];
    } else if (nextStage === 'Renewal Date Assigned') {
      if (lead.issueDate) {
        const d = new Date(lead.issueDate);
        d.setFullYear(d.getFullYear() + 1);
        finalRenewalDate = renewalDateStr || d.toISOString().split('T')[0];
      } else {
        finalRenewalDate = renewalDateStr || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      }
    }

    const updated = {
      ...lead,
      currentStage: finalStage,
      result: resultVal,
      issuedPolicyNumber: finalPolicyNo,
      issueDate: finalIssueDate,
      renewalDate: finalRenewalDate,
      pendingStageSince: new Date().toISOString().split('T')[0],
    };

    updatePolicy(leadId, updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updated);
    }
  };

  const handleAddQuote = (leadId) => {
    if (!quoteDescription || !quoteAmount) return;

    const lead = policies.find((l) => l.id === leadId);
    if (!lead) return;

    const newQuote = {
      id: `q-${Date.now()}`,
      description: quoteDescription,
      amount: parseFloat(quoteAmount),
      date: new Date().toISOString().split('T')[0],
    };

    const updated = {
      ...lead,
      quotes: [...(lead.quotes || []), newQuote],
      premiumAmount: parseFloat(quoteAmount),
    };

    updatePolicy(leadId, updated);
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead(updated);
    }

    setQuoteDescription('');
    setQuoteAmount('');
  };

  const handleDeleteLead = (id) => {
    if (confirm('Delete this policy sale item?')) {
      deletePolicy(id);
      setSelectedLead(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 2: Policy Sales Management</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage proposal pipeline, compare quotes, verify policy documents, and automate renewals.
          </p>
        </div>
        <div className="mt-3 md:mt-0 flex space-x-2">
          <div className="bg-emerald-50 px-3 py-1.5 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-bold flex items-center space-x-1">
            <TrendingUp size={14} />
            <span>Conversion Rate: {conversionPercent}%</span>
          </div>
          <button
            onClick={() => setIsAddingLead(true)}
            id="btn-add-lead"
            className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs px-4 py-2 rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
          >
            <Plus size={15} />
            <span>New Sale Proposition</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider">Active Policy leads</h3>
              <p className="text-xs text-slate-500">
                Total: <strong>{policies.length}</strong> | Issued: <strong>{policies.filter((p) => p.currentStage === 'Renewal Date Assigned' || p.currentStage === 'Policy Issued').length}</strong>
              </p>
            </div>

            <div className="divide-y divide-slate-105 max-h-[600px] overflow-y-auto">
              {policies.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-slate-50/80 transition-colors cursor-pointer ${
                    selectedLead?.id === p.id ? 'bg-indigo-50/30' : ''
                  }`}
                  onClick={() => {
                    setSelectedLead(p);
                    if (p.issuedPolicyNumber) setIssuedPolicyNo(p.issuedPolicyNumber);
                    if (p.issueDate) setIssuedDateStr(p.issueDate);
                    if (p.renewalDate) setRenewalDateStr(p.renewalDate);
                  }}
                >
                  <div className="space-y-1 pr-3 flex-1">
                    <div className="flex items-center space-x-2">
                      <p className="font-bold text-sm text-slate-800">{p.customerName}</p>
                      {p.result === 'Yes' && (
                        <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">
                          Converted
                        </span>
                      )}
                      {p.result === 'No' && (
                        <span className="text-[9px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded">
                          Declined
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                      <span className="text-indigo-600 font-semibold">{p.policyType}</span>
                      <span>•</span>
                      <span>SA: <strong>₹{p.sumAssured.toLocaleString('en-IN')}</strong></span>
                      <span>•</span>
                      <span>Premium: <strong>₹{p.premiumAmount.toLocaleString('en-IN')} /{p.premiumTerm}</strong></span>
                    </div>

                    <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                      <div
                        className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.round(((POLICY_STAGES.indexOf(p.currentStage) + 1) / POLICY_STAGES.length) * 100)}%`,
                        }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 mt-3 sm:mt-0">
                    <div className="text-right">
                      <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-800 px-2.5 py-1 rounded-lg">
                        {p.currentStage}
                      </span>
                      <p className="text-[9px] text-slate-400 font-mono mt-0.5">
                        Step {POLICY_STAGES.indexOf(p.currentStage) + 1} of {POLICY_STAGES.length}
                      </p>
                    </div>

                    <button className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600">
                      <Eye size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLead(p.id);
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 hover:bg-rose-50 text-rose-600"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {selectedLead ? (
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-5">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-bold">
                  PROPOSAL: {selectedLead.id}
                </span>
                <h3 className="font-extrabold text-slate-800 text-sm mt-3 flex items-center space-x-1.5">
                  <User size={15} className="text-slate-400" />
                  <span>{selectedLead.customerName}</span>
                </h3>
                <p className="text-xs text-indigo-600 font-bold mt-1">{selectedLead.policyType}</p>
              </div>

              <div className="space-y-2.5 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center space-x-1">
                  <Calculator size={13} className="text-slate-400" />
                  <span>Quote Estimates & Calculations</span>
                </h4>

                <div className="space-y-1.5 max-h-24 overflow-y-auto">
                  {(selectedLead.quotes || []).map((q) => (
                    <div key={q.id} className="flex justify-between items-center text-[11px] p-1.5 bg-white border border-slate-100 rounded-lg">
                      <span className="text-slate-600 truncate max-w-[130px] font-medium">{q.description}</span>
                      <span className="font-extrabold text-slate-900">₹{q.amount.toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>

                {selectedLead.currentStage === 'Meeting Appointment' || selectedLead.currentStage === 'Quote Given' ? (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase">Insert New Comparative Quotation:</p>
                    <div className="flex gap-1.5">
                      <input
                        type="text"
                        placeholder="e.g. standard co-pay 10%"
                        value={quoteDescription}
                        onChange={(e) => setQuoteDescription(e.target.value)}
                        className="flex-1 bg-white border border-slate-300 rounded p-1 text-[11px]"
                      />
                      <input
                        type="number"
                        placeholder="₹ Premium"
                        value={quoteAmount}
                        onChange={(e) => setQuoteAmount(e.target.value)}
                        className="w-18 bg-white border border-slate-300 rounded p-1 text-[11px]"
                      />
                      <button
                        onClick={() => handleAddQuote(selectedLead.id)}
                        className="bg-slate-800 hover:bg-slate-950 text-white rounded px-2 hover:cursor-pointer text-[11px] font-semibold"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Promote Next Stage Step</h4>

                {selectedLead.currentStage !== 'Renewal Date Assigned' ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Pending target action:</p>
                      <p className="text-xs font-bold text-indigo-700 mt-0.5">
                        {POLICY_STAGES[POLICY_STAGES.indexOf(selectedLead.currentStage) + 1]}
                      </p>
                    </div>

                    {POLICY_STAGES[POLICY_STAGES.indexOf(selectedLead.currentStage) + 1] === 'Result (Yes/No)' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">Customer decision result *</label>
                        <select
                          value={leadResult}
                          onChange={(e) => setLeadResult(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                        >
                          <option value="Yes">Customer Checked YES (Draft Policy)</option>
                          <option value="No">Customer Checked NO (Close proposition)</option>
                        </select>
                      </div>
                    )}

                    {POLICY_STAGES[POLICY_STAGES.indexOf(selectedLead.currentStage) + 1] === 'Policy Issued' && (
                      <div className="space-y-2.5">
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600">Assigned Contract/Policy Number</label>
                          <input
                            type="text"
                            value={issuedPolicyNo}
                            placeholder="e.g. POL-59403"
                            onChange={(e) => setIssuedPolicyNo(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800 font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-bold text-slate-600">Company Booking Date</label>
                          <input
                            type="date"
                            value={issuedDateStr}
                            onChange={(e) => setIssuedDateStr(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                          />
                        </div>
                      </div>
                    )}

                    {POLICY_STAGES[POLICY_STAGES.indexOf(selectedLead.currentStage) + 1] === 'Renewal Date Assigned' && (
                      <div className="space-y-2">
                        <label className="block text-[11px] font-bold text-slate-600">Renewal Outflow Deadline</label>
                        <input
                          type="date"
                          value={renewalDateStr}
                          onChange={(e) => setRenewalDateStr(e.target.value)}
                          className="w-full bg-white border border-slate-300 rounded-lg p-1.5 text-xs text-slate-800"
                        />
                        <p className="text-[10px] text-slate-400 italic">Self-calculates +1 Year from issue date by default.</p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        const idx = POLICY_STAGES.indexOf(selectedLead.currentStage);
                        if (idx < POLICY_STAGES.length - 1) {
                          promoteLeadStage(selectedLead.id, POLICY_STAGES[idx + 1]);
                        }
                      }}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2.5 rounded-lg transition-colors cursor-pointer"
                    >
                      Promote Milestone Stage
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5 text-xs text-emerald-800">
                    <p className="font-extrabold flex items-center space-x-1">
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span>Policy Active</span>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Policy Number: <strong>{selectedLead.issuedPolicyNumber}</strong>
                    </p>
                    <p className="text-slate-600 text-[11px]">
                      Renewal cycle scheduled for: <strong>{selectedLead.renewalDate}</strong>
                    </p>
                  </div>
                )}
              </div>

              {selectedLead.renewalDate && new Date(selectedLead.renewalDate) <= new Date('2026-05-22') && (
                <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start space-x-2 text-[11px] text-rose-800">
                  <AlertCircle size={14} className="text-rose-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold">Renewal Overdue Notification</p>
                    <p className="text-slate-600 mt-0.5">Policy was scheduled for renewal on {selectedLead.renewalDate}. Contact client immediately.</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-100 border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 text-xs py-16">
              Click any active lead on the left side list to display quote generators, document verifications, and pipeline transition steps.
            </div>
          )}
        </div>
      </div>

      {isAddingLead && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-6 overflow-hidden">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <FileText className="text-indigo-600" size={18} />
              <span>Initiate New Sale Lead</span>
            </h3>

            <form onSubmit={handleAddLead} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Customer Link *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => {
                    setSelectedCustomerId(e.target.value);
                    if (e.target.value === '') setCustomCustomerName('');
                  }}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                >
                  <option value="">-- Create unregistered lead or select client --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.id})
                    </option>
                  ))}
                </select>
              </div>

              {!selectedCustomerId && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Applicant Name *</label>
                  <input
                    required
                    type="text"
                    placeholder="Enter external applicant name"
                    value={customCustomerName}
                    onChange={(e) => setCustomCustomerName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proposed Insurance Plan / Scheme *</label>
                <select
                  value={policyType}
                  onChange={(e) => setPolicyType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                >
                  <option value="LIFE - Term / Savings / Pension plans">LIFE - Term / Savings / Pension plans for Individuals</option>
                  <option value="Business - Comprehensive Life Term & Health Plans">Business - Comprehensive Life Term & Health Plans</option>
                  <option value="Health Plans - Individual & Families">Health Plans - Individual & Families</option>
                  <option value="Vehicle Insurance - Car / Two Wheeler / Commercial Vehicle">Vehicle Insurance - Car / Two Wheeler / Commercial Vehicle</option>
                  <option value="Travel Insurance - Corporate, Individuals & Students">Travel Insurance - Corporate, Individuals & Students</option>
                  <option value="House & House Holdings - Fire & Theft Protection Plans">House & House Holdings - Fire & Theft Protection Plans</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Premium Estimate (₹) *</label>
                  <input
                    required
                    type="number"
                    value={premiumAmount}
                    onChange={(e) => setPremiumAmount(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Accompanying Sum Assured (₹) *</label>
                  <input
                    required
                    type="number"
                    value={sumAssured}
                    onChange={(e) => setSumAssured(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Premium Installment Term Mode</label>
                <select
                  value={premiumTerm}
                  onChange={(e) => setPremiumTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                >
                  <option value="Yearly">Yearly Term</option>
                  <option value="Half-Yearly">Half-Yearly Term</option>
                  <option value="Quarterly">Quarterly Term</option>
                  <option value="Monthly">Monthly ECS Term</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Proposal Description Note</label>
                <textarea
                  placeholder="Insert notes on premium targets or client preference..."
                  rows={2}
                  value={initialNotes}
                  onChange={(e) => setInitialNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2 text-slate-800 text-xs"
                ></textarea>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddingLead(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow cursor-pointer"
                >
                  Create Sale Proposition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
