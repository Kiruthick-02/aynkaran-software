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
    .filter((r) => r.title.toLowerCase().includes(searchQuery.toLowerCase()) || r.description.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 4: Automated Reminders & Broadcasting Console</h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor trigger schedules (1 month, 3 weeks, 2 weeks, 1 week, 3 days, and 1 day before) and dispatch announcements to clients & agents.
          </p>
        </div>
        {visibleReminders.some((r) => r.completed) && (
          <button
            onClick={handleClearCompleted}
            className="mt-3 sm:mt-0 text-rose-600 hover:text-rose-800 font-bold text-xs bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl transition-all hover:cursor-pointer"
          >
            Clear Archive Logs
          </button>
        )}
      </div>
      

      {successToast && (
        <div className="bg-emerald-600 text-white p-4 rounded-xl shadow-lg border border-emerald-500 flex items-center space-x-3 text-xs animate-bounce">
          <div className="bg-emerald-500 p-1.5 rounded-full text-white">
            <Sparkles size={16} />
          </div>
          <div className="flex-1 font-semibold">{successToast}</div>
          <button onClick={() => setSuccessToast(null)} className="text-white hover:text-emerald-200 font-extrabold text-[10px]">
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 border border-slate-200 rounded-2xl shadow-sm">
        <div className="relative">
          <input
            type="text"
            placeholder="Search alerts (e.g. Priyamvada)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
        </div>

        <div className="md:col-span-2 flex flex-wrap gap-2 items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Categorize:</span>
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
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
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
              className={`p-5 rounded-2xl border transition-all hover:shadow-md ${
                reminder.completed
                  ? 'bg-slate-50/70 border-slate-200 text-slate-500 opacity-75'
                  : reminder.triggerType === 'Due date' || reminder.triggerType === '1 day before'
                  ? 'bg-rose-50/30 border-rose-200/60'
                  : 'bg-white border-slate-200'
              }`}
            >
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start space-x-3.5 flex-1 pr-4">
                  <div className={`mt-1 p-2 rounded-xl shrink-0 ${
                    reminder.completed
                      ? 'bg-slate-200 text-slate-500'
                      : reminder.targetType === 'renewal'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                      : 'bg-amber-50 text-amber-600 border border-amber-100'
                  }`}>
                    <Bell size={18} />
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className={`font-extrabold text-sm ${reminder.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {reminder.title}
                      </p>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        reminder.completed
                          ? 'bg-slate-100 text-slate-400'
                          : reminder.triggerType === 'Due date'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        Stage: {reminder.triggerType}
                      </span>
                      <span className={`text-[9px] font-mono font-bold uppercase px-2 py-0.5 border rounded-lg ${
                        reminder.targetType === 'renewal' ? 'bg-teal-50 border-teal-200 text-teal-800' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        {reminder.targetType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{reminder.description}</p>
                    
                    {(reminder.customerMobile || reminder.customerEmail) && (
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] font-mono text-indigo-600 mt-1 px-2.5 py-1 rounded-lg w-fit border border-indigo-100/60 bg-indigo-50/50">
                        {reminder.customerMobile && <span>📞 Contact Mobile: <strong className="text-slate-800">{reminder.customerMobile}</strong></span>}
                        {reminder.customerMobile && reminder.customerEmail && <span className="text-indigo-300">|</span>}
                        {reminder.customerEmail && <span>✉️ Email ID: <strong className="text-slate-800">{reminder.customerEmail}</strong></span>}
                      </div>
                    )}



                    <div className="flex items-center space-x-2.5 text-[10px] font-mono text-slate-400 mt-2">
                      <span>Schedule: {reminder.dueDate}</span>
                      <span>•</span>
                      <span>Logs Created {new Date(reminder.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-row md:flex-col items-start md:items-end justify-between md:justify-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <div className="flex items-center space-x-2 w-full md:w-auto justify-between md:justify-end">
                    <button
                      onClick={() => toggleReminderComplete(reminder.id)}
                      className={`inline-flex items-center space-x-1 px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        reminder.completed
                          ? 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          : 'bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100'
                      }`}
                    >
                      <CheckCircle size={14} />
                      <span>{reminder.completed ? 'Acknowledge Re-open' : 'Mark Complete'}</span>
                    </button>

                    <button
                      onClick={() => handleDeleteReminder(reminder.id)}
                      className="p-1.5 border border-slate-200 hover:bg-rose-50 text-rose-600 rounded-lg transition-colors cursor-pointer"
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
                        className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 hover:cursor-pointer transition-colors rounded-lg flex items-center space-x-1"
                      >
                        <MessageSquare size={13} className="text-emerald-600" />
                        <span className="text-[10px] font-bold">WhatsApp</span>
                      </button>

                      <button
                        onClick={() => handleBroadcastSimulation(reminder, 'email')}
                        title="Broadcast via Corporate Mail"
                        className="p-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 hover:cursor-pointer transition-colors rounded-lg flex items-center space-x-1"
                      >
                        <Mail size={13} className="text-indigo-600" />
                        <span className="text-[10px] font-bold">Email</span>
                      </button>

                      <button
                        onClick={() => handleBroadcastSimulation(reminder, 'sms')}
                        title="Broadcast via Cellular SMS"
                        className="p-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 hover:cursor-pointer transition-colors rounded-lg flex items-center space-x-1"
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
          <div className="py-16 text-center text-slate-400 italic text-sm bg-white border border-dashed rounded-2xl">
            No scheduling triggers discovered under search constraints.
          </div>
        )}
      </div>
    </div>
  );
}
