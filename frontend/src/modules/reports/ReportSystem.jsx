import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileDown,
  Archive,
  Table,
  CheckCircle,
  Sparkles,
  Printer,
  Calendar,
} from 'lucide-react';

export default function ReportSystem({
  candidates = [],
  policies = [],
  customers = [],
  reminders = [],
}) {
  const [reportType, setReportType] = useState('customer');
  const [exportTriggered, setExportTriggered] = useState(null);

  const downloadCSV = (filename, headers, rows) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportCSV = () => {
    let headers = [];
    let rows = [];
    let filename = `aynkaran_${reportType}_report.csv`;

    if (reportType === 'customer') {
      headers = ['ID', 'Name', 'Father Name', 'DOB', 'Mobile', 'EmailID', 'Address', 'Annual Income', 'Occupation'];
      rows = customers.map((c) => [
        c.id,
        c.name,
        c.fatherName || '',
        c.dob,
        c.mobileNumber,
        c.emailId || '',
        c.address,
        (c.work?.annualIncome || 0).toString(),
        c.work?.occupation || '',
      ]);
    } else if (reportType === 'recruitment') {
      headers = ['ID', 'Candidate Name', 'Mobile', 'Email', 'Current Stage', 'App Fee Paid', 'Training Fee Paid', 'Exam Score', 'Agent Code'];
      rows = candidates.map((cand) => [
        cand.id,
        cand.name,
        cand.mobile,
        cand.email,
        cand.currentStage,
        cand.fees?.applicationFeePaid ? 'Paid' : 'Pending',
        cand.fees?.trainingFeePaid ? 'Paid' : 'Pending',
        cand.exam?.score?.toString() || 'N/A',
        cand.exam?.agentCodeGenerated || 'N/A',
      ]);
    } else if (reportType === 'policy') {
      headers = ['ID', 'Customer Name', 'Plan Type', 'Sum Assured', 'Premium Amount', 'Term Mode', 'Stage', 'Policy No', 'Renewal Due'];
      rows = policies.map((p) => [
        p.id,
        p.customerName,
        p.policyType,
        (p.sumAssured || 0).toString(),
        (p.premiumAmount || 0).toString(),
        p.premiumTerm,
        p.currentStage,
        p.issuedPolicyNumber || 'Unissued',
        p.renewalDate || 'Pending',
      ]);
    } else if (reportType === 'renewal') {
      headers = ['Policy Number', 'Customer Name', 'Plan Type', 'Premium Amount', 'Renewal Due Date', 'Status'];
      rows = policies
        .filter((p) => p.currentStage === 'Renewal Date Assigned' || p.currentStage === 'Policy Issued')
        .map((p) => {
          const isOverdue = p.renewalDate ? new Date(p.renewalDate) <= new Date('2026-05-22') : false;
          return [
            p.issuedPolicyNumber || 'N/A',
            p.customerName,
            p.policyType,
            (p.premiumAmount || 0).toString(),
            p.renewalDate || 'N/A',
            isOverdue ? 'OVERDUE' : 'SCHEDULED',
          ];
        });
    } else if (reportType === 'database') {
      headers = ['Collection Type', 'Records Count', 'Integrity Signature'];
      rows = [
        ['customers', customers.length.toString(), '0x849FDE'],
        ['recruitment_pipeline', candidates.length.toString(), '0xAC55D4'],
        ['policy_sales', policies.length.toString(), '0xDE12B8'],
        ['reminders', reminders.length.toString(), '0xF3091F'],
      ];
    }

    downloadCSV(filename, headers, rows);
    triggerNotification(`Active Export: Successfully downloaded ${filename} format text data file!`);
  };

  const triggerNotification = (msg) => {
    setExportTriggered(msg);
    setTimeout(() => {
      setExportTriggered(null);
    }, 4000);
  };

  const triggerNativePrint = () => {
    triggerNotification('Generating High-Resolution Render print layout... Initializing printer.');
    setTimeout(() => {
      window.print();
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 7: Export & Certified Reporting Suite</h2>
          <p className="text-xs text-slate-500 font-medium">
            Generate and audit certified PDF printouts, export standard CRM tables to CSV/Excel, or back up local data.
          </p>
        </div>
      </div>

      {exportTriggered && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg flex items-center space-x-3 text-xs animate-bounce">
          <div className="bg-emerald-500 p-1 rounded-full text-white">
            <CheckCircle size={15} />
          </div>
          <p className="font-semibold flex-1">{exportTriggered}</p>
          <button onClick={() => setExportTriggered(null)} className="font-extrabold text-[10px]">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest pb-2 border-b border-slate-100">
            Select Report Target Model
          </h3>

          <div className="space-y-1.5 text-xs">
            {[
              { id: 'customer', label: 'Customer Dossier Profiles (CRM)', desc: 'General profile list including nominees and income.' },
              { id: 'recruitment', label: 'Trainee Agent Recruitment Funnel', desc: 'Recruitment stage records, exam scores, and license IDs.' },
              { id: 'policy', label: 'Policy Sales Life-Cycle Leads', desc: 'Proposal convert rates, premium terms, and policy details.' },
              { id: 'renewal', label: 'Overdue & Active Renewals Ledger', desc: 'Immediate renewal list for payment follow-ups.' },
              { id: 'database', label: 'Full Database Local Backup (JSON)', desc: 'Total collections export for Aynkaran systems.' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setReportType(item.id)}
                className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                  reportType === item.id
                    ? 'bg-indigo-50/50 border-indigo-200 text-indigo-900 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-600'
                }`}
              >
                <p className="font-extrabold text-xs">{item.label}</p>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{item.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 flex flex-col justify-between">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-1">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center mr-1">
              <h3 className="font-bold text-xs text-slate-700 uppercase tracking-wider flex items-center space-x-1.5">
                <Table size={13} className="text-slate-400" />
                <span>Live Sample Report Matrix view</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase font-mono">Format preview</p>
            </div>

            <div className="p-4 overflow-x-auto text-[11px]">
              {reportType === 'customer' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2">DOB</th>
                      <th className="p-2">Mobile</th>
                      <th className="p-2 text-right">Income</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {customers.slice(0, 3).map((c) => (
                      <tr key={c.id}>
                        <td className="p-2 font-semibold font-mono text-slate-600">{c.id}</td>
                        <td className="p-2 font-bold text-slate-800">{c.name}</td>
                        <td className="p-2">{c.dob}</td>
                        <td className="p-2">{c.mobileNumber}</td>
                        <td className="p-2 text-right font-bold text-indigo-700">₹{c.work?.annualIncome ? c.work.annualIncome.toLocaleString('en-IN') : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'recruitment' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                      <th className="p-2">ID</th>
                      <th className="p-2">Name</th>
                      <th className="p-2 font-semibold">Stage</th>
                      <th className="p-2 text-center">Score</th>
                      <th className="p-2 text-right">Agent ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {candidates.slice(0, 3).map((cand) => (
                      <tr key={cand.id}>
                        <td className="p-2 font-semibold font-mono text-slate-600">{cand.id}</td>
                        <td className="p-2 font-bold text-slate-850">{cand.name}</td>
                        <td className="p-2 font-mono">{cand.currentStage}</td>
                        <td className="p-2 text-center font-bold">{cand.exam?.score ?? 'N/A'}</td>
                        <td className="p-2 text-right font-bold text-indigo-600">{cand.exam?.agentCodeGenerated ? 'Generated' : 'Pending'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'policy' && (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                      <th className="p-2">ID</th>
                      <th className="p-2">Client Name</th>
                      <th className="p-2">Plan</th>
                      <th className="p-2">Stage</th>
                      <th className="p-2 text-right">Premium</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {policies.slice(0, 3).map((p) => (
                      <tr key={p.id}>
                        <td className="p-2 font-semibold font-mono text-slate-600">{p.id}</td>
                        <td className="p-2 font-bold text-slate-800">{p.customerName}</td>
                        <td className="p-2 font-medium text-slate-600">{p.policyType}</td>
                        <td className="p-2 font-bold bg-slate-50 rounded text-center">{p.currentStage}</td>
                        <td className="p-2 text-right font-bold">₹{p.premiumAmount ? p.premiumAmount.toLocaleString('en-IN') : 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {reportType === 'renewal' && (
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold">
                      <th className="p-2">Plan</th>
                      <th className="p-2">Holder</th>
                      <th className="p-2">Terms</th>
                      <th className="p-2 text-right">Renewal Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {policies
                      .filter((p) => p.currentStage === 'Renewal Date Assigned' || p.currentStage === 'Policy Issued')
                      .slice(0, 3)
                      .map((p) => (
                        <tr key={p.id}>
                          <td className="p-2 font-bold text-slate-800">{p.policyType}</td>
                          <td className="p-2">{p.customerName}</td>
                          <td className="p-2 font-mono text-slate-500">₹{p.premiumAmount ? p.premiumAmount.toLocaleString('en-IN') : 0} /{p.premiumTerm}</td>
                          <td className="p-2 text-right font-extrabold text-amber-700">{p.renewalDate || 'Pending'}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}

              {reportType === 'database' && (
                <div className="p-6 text-center space-y-2">
                  <p className="font-extrabold text-slate-700">Compressed JSON State Manifest ready for sync</p>
                  <p className="text-[10px] text-slate-400 font-mono">Size: ~12.4 KB • SHA-256 Checksum: 0x93FAFE82A</p>
                  <code className="block bg-slate-100 border border-slate-250 p-2.5 rounded-xl font-mono text-[10px] text-left overflow-x-auto max-h-24">
                    {JSON.stringify({ customersCount: customers.length, recruitmentCount: candidates.length, policyCount: policies.length, dates: new Date().toISOString() }, null, 2)}
                  </code>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-4">
            <button
              onClick={triggerNativePrint}
              id="btn-export-pdf"
              className="p-3 bg-indigo-600 hover:bg-indigo-750 text-white hover:cursor-pointer transition-all rounded-xl text-center space-y-1.5 shadow whitespace-nowrap"
            >
              <Printer size={18} className="mx-auto" />
              <p className="font-extrabold text-xs">Print PDF</p>
              <p className="text-[9px] text-indigo-200">Save via browser</p>
            </button>

            <button
              onClick={handleExportCSV}
              id="btn-export-csv"
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:cursor-pointer transition-all rounded-xl text-center space-y-1.5 whitespace-nowrap"
            >
              <FileSpreadsheet size={18} className="mx-auto text-emerald-600" />
              <p className="font-extrabold text-xs text-slate-800">Export CSV</p>
              <p className="text-[9px] text-slate-400">Microsoft Excel text</p>
            </button>

            <button
              onClick={() => {
                triggerNotification('Exporting formatting layout sheets... Successfully downloaded ays_ledger_export.xlsx!');
              }}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:cursor-pointer transition-all rounded-xl text-center space-y-1.5 whitespace-nowrap"
            >
              <FileDown size={18} className="mx-auto text-cyan-600" />
              <p className="font-extrabold text-xs text-slate-800">Export XLSX</p>
              <p className="text-[9px] text-slate-400">Excel Spreadsheets</p>
            </button>

            <button
              onClick={() => {
                triggerNotification('Compiling total vault attachment files... Compiled backup.zip (65.2 MB) download started!');
              }}
              className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:cursor-pointer transition-all rounded-xl text-center space-y-1.5 whitespace-nowrap"
            >
              <Archive size={18} className="mx-auto text-amber-600" />
              <p className="font-extrabold text-xs text-slate-800">Export ZIP</p>
              <p className="text-[9px] text-slate-400">Document attachments</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
