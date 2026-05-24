import React, { useState } from 'react';
import {
  RefreshCw,
  Cpu,
  Download,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function UpdateSystem() {
  const [checking, setChecking] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadPercent, setDownloadPercent] = useState(0);
  const [updateFinished, setUpdateFinished] = useState(false);
  const [logText, setLogText] = useState(['[SYSTEM INITIALIZATION] Offline Cache validated. Engine version v1.4.0 online.']);

  const handleCheckUpdates = () => {
    setChecking(true);
    setLogText((prev) => [...prev, '[CONNECTION] Establishing SSL connection to HF Release repository...', '[DNS] Querying huggerface.co/aynkaran-consultants/desktop/releases...']);

    setTimeout(() => {
      setChecking(false);
      setUpdateAvailable(true);
      setLogText((prev) => [
        ...prev,
        '[UPDATE INSTANCE DISCOVERED] Found release v1.5.0-production (Build 2026.05.22).',
        '[RELEASE LOG] v1.5.0 features direct IRDAI XML upload, faster customer dossier caching, and WhatsApp automation gateways.',
      ]);
    }, 2000);
  };

  const handleDownloadUpdate = () => {
    setDownloading(true);
    setLogText((prev) => [...prev, '[DOWNLOAD] Starting payload download of aynkaran-setup-1.5.0.exe (64.8 MB)...']);

    const interval = setInterval(() => {
      setDownloadPercent((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setUpdateFinished(true);
          setLogText((prevLog) => [...prevLog, '[DOWNLOAD] Completed integration of files. Verifying signature key...', '[SIGNATURE] MD5 Checksum matches source repository. Release verified.']);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  const handleRestartApp = () => {
    setLogText((prev) => [...prev, '[REBOOT] Closing background electron processes. Relaunching local window shell...']);
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 font-sans">Module 9: Hugging Face Release Auto Update Station</h2>
          <p className="text-xs text-slate-500 font-medium">
            Manage corporate desktop software updates wirelessly over secure Hugging Face artifact repository mirrors.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Installed Edition</p>
              <h3 className="font-extrabold text-lg text-slate-800 mt-1 font-sans">Aynkaran Consultants v1.4.0-Stable</h3>
              <p className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center space-x-1 bg-emerald-50 px-2 py-0.5 rounded">
                <span>Enterprise License Verification: Active Offline</span>
              </p>
            </div>

            <button
              disabled={checking || downloading || updateFinished}
              onClick={handleCheckUpdates}
              className="mt-3 sm:mt-0 flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow shadow-indigo-600/10 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw size={14} className={checking ? 'animate-spin' : ''} />
              <span>{checking ? 'Checking Repository...' : 'Check For Updates'}</span>
            </button>
          </div>

          <div className="space-y-4">
            {updateAvailable && !updateFinished && (
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-indigo-900 font-bold">
                  <Sparkles size={16} />
                  <span>Interactive Update Available (v1.5.0)</span>
                </div>
                <p className="text-slate-600 text-[11px] leading-relaxed">
                  A new stable desktop edition has been published. Hugging Face release pipeline offers automated installation with electron-updater bindings.
                </p>

                {downloading ? (
                  <div className="space-y-2 mt-4 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-500 font-mono font-bold">
                      <span>Downloading setup package...</span>
                      <span>{downloadPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${downloadPercent}%` }}></div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleDownloadUpdate}
                    className="bg-indigo-600 text-white font-extrabold px-3 py-2 rounded-lg text-xs mt-2 cursor-pointer flex items-center space-x-1.5"
                  >
                    <Download size={13} />
                    <span>Download and Deploy update</span>
                  </button>
                )}
              </div>
            )}

            {updateFinished && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold">
                  <CheckCircle size={16} className="text-emerald-600" />
                  <span>Update Package (v1.5.0) ready for deployment</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Installation compiled successfully. Click below to reboot Aynkaran Desktop windows client and apply changes.
                </p>
                <button
                  onClick={handleRestartApp}
                  className="bg-emerald-600 text-white font-extrabold px-3 py-2 rounded-lg text-xs mt-2 flex items-center space-x-1.5 cursor-pointer hover:bg-emerald-700 transition"
                >
                  <RefreshCw size={13} />
                  <span>Restart Application</span>
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 text-slate-300 p-5 rounded-2xl shadow-inner font-mono text-xs flex flex-col justify-between border border-slate-800">
          <div>
            <div className="pb-3 border-b border-slate-800 flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
              <span className="flex items-center space-x-1">
                <Cpu size={12} className="text-indigo-400" />
                <span>Updater Engine Logs</span>
              </span>
              <span>v1.0.4-sys</span>
            </div>

            <div className="space-y-2 mt-4 max-h-64 overflow-y-auto text-[11px] leading-relaxed">
              {logText.map((log, idx) => (
                <div key={idx} className="flex gap-1.5">
                  <span className="text-slate-600 select-none">&gt;</span>
                  <p>{log}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-[9px] text-slate-600 italic text-center mt-6">
            Electron background workers connected: huggerface-mirror-1
          </p>
        </div>
      </div>
    </div>
  );
}
