import React, { useState } from 'react';
import {
  Bell,
  MessageSquare,
  Mail,
  Smartphone,
  CheckCircle,
  Clock,
  Send,
  AlertTriangle,
  Sparkles,
  Search,
  Trash2,
} from 'lucide-react';

export default function Reminders({ reminders = [], addReminder, updateReminder, deleteReminder, triggerAutomatedReminders, userRole = 'SuperAdmin' }) {
  const [filterType, setFilterType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [successToast, setSuccessToast] = useState(null);

  const visibleReminders = userRole === 'Staff'
    ? reminders.filter(r => r.targetType !== 'recruitment')
    : reminders;


  const handleBroadcastSimulation = (reminder, channel) => {
    let destination = '';
    if (reminder.targetType === 'recruitment') destination = 'Candidate Contact Tel';
    else destination = 'Client Registered CRM info';

    const msg = `Successfully broadcasted [${reminder.title}] announcement via ${channel.toUpperCase()} to ${destination}!`;
    setSuccessToast(msg);

    setTimeout(() => {
      setSuccessToast(null);
    }, 4000);

    const updatedChannels = {
      ...reminder.channels,
      [channel]: true,
    };
    updateReminder(reminder.id, { channels: updatedChannels });
  };

  const toggleReminderComplete = (id) => {
    const r = visibleReminders.find((item) => item.id === id);
    if (r) {
      updateReminder(id, { completed: !r.completed });
    }
  };

  const handleDeleteReminder = (id) => {
    if (confirm('Are you sure you want to permanently delete this reminder?')) {
      deleteReminder(id);
    }
  };

  const handleClearCompleted = () => {
    if (confirm('Clear all completed notification tasks from historic logs?')) {
      const completed = visibleReminders.filter((r) => r.completed);
      completed.forEach((r) => deleteReminder(r.id));
    }
  };

  const filtered = visibleReminders
    .filter((r) => {
      if (filterType === 'all') return true;
      if (filterType === 'pending') return !r.completed;
      if (filterType === 'completed') return r.completed;
      return r.targetType === filterType;
    })
    .filter((r) => 
      (r.title || '').toLowerCase().includes((searchQuery || '').toLowerCase()) || 
      (r.description || '').toLowerCase().includes((searchQuery || '').toLowerCase())
    );

  return (
    <div className="space-y-5 text-slate-200 animate-fade-in">
      <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400">Operations / Communications</p>
          <h2 className="text-xl font-black uppercase tracking-tight text-white">Reminders Console</h2>
          <p className="mt-1 max-w-2xl text-xs font-medium leading-relaxed text-slate-400">
            Monitor trigger schedules (1 month, 3 weeks, 2 weeks, 1 week, 3 days, and 1 day before) and dispatch announcements to clients & agents.
          </p>
        </div>
        {visibleReminders.some((r) => r.completed) && (
          <button
            onClick={handleClearCompleted}
            className="inline-flex items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300 transition hover:bg-rose-500/20 hover:text-white"
          >
            Clear Archive Logs
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Total Alerts', value: visibleReminders.length, tone: 'text-blue-300', icon: Bell },
          { label: 'Active Queue', value: visibleReminders.filter((r) => !r.completed).length, tone: 'text-amber-300', icon: Clock },
          { label: 'Renewals', value: visibleReminders.filter((r) => r.targetType === 'renewal' || r.targetType === 'customer').length, tone: 'text-emerald-300', icon: AlertTriangle },
          { label: 'Completed', value: visibleReminders.filter((r) => r.completed).length, tone: 'text-slate-300', icon: CheckCircle },
        ].map(({ label, value, tone, icon: Icon }) => (
          <div key={label} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-[#1e293b] px-4 py-3 shadow-sm">
            <Icon className={`h-4 w-4 ${tone}`} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{label}</p>
              <p className={`mt-0.5 text-lg font-black ${tone}`}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {successToast && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs text-emerald-100 shadow-lg">
          <div className="rounded-full bg-emerald-500/20 p-1.5 text-emerald-300">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 font-semibold">{successToast}</div>
          <button onClick={() => setSuccessToast(null)} className="text-[10px] font-extrabold text-emerald-300 hover:text-white">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-800 bg-[#1e293b] p-4 shadow-xl md:grid-cols-3">
        <div className="relative">
          <input
            type="text"
            placeholder="Search alerts (e.g. Priyamvada)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-[#0b1120] py-2.5 pl-9 pr-4 text-xs text-white placeholder-slate-500 outline-none transition focus:border-blue-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">View:</span>
          {[
            { id: 'all', label: 'All Alerts' },
            { id: 'pending', label: 'Active Reminders' },
            { id: 'completed', label: 'Archived / Complete' },
            ...(userRole === 'Staff' ? [] : [{ id: 'recruitment', label: 'Recruitment Delays' }]),
            { id: 'renewal', label: 'Contract Renewals' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterType(cat.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                filterType === cat.id
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-950/40'
                  : 'border border-slate-700 bg-[#0b1120] text-slate-400 hover:border-slate-600 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filtered.map((reminder) => {
          return (
            <div
              key={reminder.id}
              className={`rounded-2xl border p-5 transition-all hover:border-slate-700 hover:shadow-lg ${
                reminder.completed
                  ? 'bg-slate-900/60 border-slate-800 text-slate-500 opacity-75'
                  : reminder.triggerType === 'Due date' || reminder.triggerType === '1 day before'
                  ? 'bg-rose-950/20 border-rose-500/30'
                  : 'bg-[#1e293b] border-slate-800 shadow-lg'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start space-x-3.5 flex-1 pr-4">
                  <div className={`mt-1 shrink-0 rounded-xl border p-2 ${
                    reminder.completed
                      ? 'border-slate-700 bg-slate-800 text-slate-500'
                      : reminder.targetType === 'renewal'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                      : 'border-amber-500/30 bg-amber-500/10 text-amber-300'
                  }`}>
                    <Bell size={18} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-extrabold text-sm ${reminder.completed ? 'line-through text-slate-400' : 'text-white'}`}>
                        {reminder.title}
                      </p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        reminder.completed
                          ? 'bg-slate-800 text-slate-500'
                          : reminder.triggerType === 'Due date'
                          ? 'bg-rose-500/10 text-rose-300'
                          : 'bg-blue-500/10 text-blue-300'
                      }`}>
                        Stage: {reminder.triggerType}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border rounded-lg ${
                        reminder.targetType === 'renewal' || reminder.targetType === 'customer' ? 'border-teal-500/30 bg-teal-500/10 text-teal-300' : 'border-slate-700 bg-slate-800 text-slate-400'
                      }`}>
                        {reminder.targetType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{reminder.description}</p>
                    
                    {(reminder.customerMobile || reminder.customerEmail) && (
                      <div className="flex w-fit flex-wrap items-center gap-x-2.5 gap-y-1 rounded-lg border border-slate-700 bg-slate-900/70 px-2.5 py-1 text-[10px] font-mono text-slate-400">
                        {reminder.customerMobile && <span>Mobile: <strong className="text-slate-200">{reminder.customerMobile}</strong></span>}
                        {reminder.customerMobile && reminder.customerEmail && <span className="text-slate-600">|</span>}
                        {reminder.customerEmail && <span>Email: <strong className="text-slate-200">{reminder.customerEmail}</strong></span>}
                      </div>
                    )}



                    <div className="flex items-center space-x-2.5 text-[10px] font-mono text-slate-400 mt-2">
                      <span>Schedule: {reminder.dueDate}</span>
                      <span>•</span>
                      <span>Logs Created {new Date(reminder.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-2 flex w-full flex-row items-start justify-between gap-3 border-t border-slate-800 pt-3 md:mt-0 md:w-auto md:flex-col md:items-end md:justify-center md:border-t-0 md:pt-0">
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
                    <button
                      onClick={() => toggleReminderComplete(reminder.id)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        reminder.completed
                          ? 'border border-slate-700 bg-slate-800 text-slate-400 hover:bg-slate-700'
                          : 'border border-blue-500/30 bg-blue-500/10 text-blue-300 hover:bg-blue-500/20'
                      }`}
                    >
                      <CheckCircle size={14} />
                      <span>{reminder.completed ? 'Acknowledge Re-open' : 'Mark Complete'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="rounded-lg border border-rose-500/30 p-1.5 text-rose-300 transition-colors hover:bg-rose-500/10"
                      title="Delete Reminder"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  {!reminder.completed && (
                    <div className="flex items-center space-x-1">
                      <span className="text-[10px] text-slate-400 mr-1.5 font-bold uppercase">Broadcasters:</span>
                      <button
                        onClick={() => handleBroadcastSimulation(reminder, 'whatsapp')}
                        title="Broadcast via WhatsApp"
                        className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-1.5 text-emerald-300 transition-colors hover:bg-emerald-500/20"
                      >
                        <MessageSquare size={13} className="text-emerald-600" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleBroadcastSimulation(reminder, 'email')}
                        title="Broadcast via Corporate Mail"
                        className="flex items-center gap-1 rounded-lg border border-blue-500/30 bg-blue-500/10 p-1.5 text-blue-300 transition-colors hover:bg-blue-500/20"
                      >
                        <Mail size={13} className="text-indigo-600" />
                        <span className="text-[10px] font-bold">Email</span>
                      </button>

                      <button
                        onClick={() => handleBroadcastSimulation(reminder, 'sms')}
                        title="Broadcast via Cellular SMS"
                        className="flex items-center gap-1 rounded-lg border border-amber-500/30 bg-amber-500/10 p-1.5 text-amber-300 transition-colors hover:bg-amber-500/20"
                      >
                        <Smartphone size={13} className="text-amber-600" />
                        <span className="text-[10px] font-bold">SMS</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-700 bg-[#1e293b] py-16 text-center text-sm italic text-slate-500">
            No scheduling triggers discovered under search constraints.
          </div>
        )}
      </div>
    </div>
  );
}
