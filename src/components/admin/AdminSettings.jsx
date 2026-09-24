import React, { useState } from 'react';
import {
  Save,
  KeyRound,
  Phone,
  Cloud,
  Download,
  Upload,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { getAdminConfig, saveAdminConfig, exportAllDataBackup, restoreAllDataFromJSON } from '../../utils/licence';
import { getCloudConfig, saveCloudConfig } from '../../utils/cloud';

export default function AdminSettings({ onConfigUpdated }) {
  const [config, setConfig] = useState(() => getAdminConfig());
  const [cloud, setCloud] = useState(() => getCloudConfig());
  const [statusMsg, setStatusMsg] = useState('');
  const [cloudMsg, setCloudMsg] = useState('');

  const handleSaveAdminConfig = (e) => {
    e.preventDefault();
    saveAdminConfig(config);
    setStatusMsg('Admin credentials & shop contact saved successfully!');
    if (onConfigUpdated) onConfigUpdated();
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const handleSaveCloud = (e) => {
    e.preventDefault();
    const updated = {
      ...cloud,
      enabled: Boolean(cloud.supabaseUrl && cloud.supabaseAnonKey),
    };
    saveCloudConfig(updated);
    setCloud(updated);
    setCloudMsg('Cloud Supabase configuration updated!');
    setTimeout(() => setCloudMsg(''), 3000);
  };

  const handleRestoreFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const res = restoreAllDataFromJSON(event.target.result);
        if (res.success) {
          alert('System data successfully restored! The page will now refresh.');
          window.location.reload();
        } else {
          alert(`Restore failed: ${res.error}`);
        }
      } catch (err) {
        alert(`Invalid JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
          System Settings & Cloud Sync
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Configure admin access, client support hotlines, and remote Supabase connectivity
        </p>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-emerald-950/80 border border-emerald-700 text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* 1. Admin Credentials & Support Contacts */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
          <KeyRound className="w-5 h-5 text-indigo-400" />
          <h2 className="text-base font-black text-white">Admin Credentials & Client Contacts</h2>
        </div>

        <form onSubmit={handleSaveAdminConfig} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Admin Username
              </label>
              <input
                type="text"
                value={config.username}
                onChange={(e) => setConfig({ ...config, username: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Admin Password
              </label>
              <input
                type="text"
                value={config.password}
                onChange={(e) => setConfig({ ...config, password: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Support Phone (Shown to Clients)
              </label>
              <input
                type="text"
                value={config.contactPhone}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                placeholder="0300-1234567"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                WhatsApp Hotline Number
              </label>
              <input
                type="text"
                value={config.whatsappNumber}
                onChange={(e) => setConfig({ ...config, whatsappNumber: e.target.value })}
                placeholder="923001234567"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Default Licence Duration (Days)
              </label>
              <input
                type="number"
                value={config.defaultDurationDays}
                onChange={(e) => setConfig({ ...config, defaultDurationDays: Number(e.target.value) })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Admin Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. MODE B: Remote Cloud Supabase Sync */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-black text-white">Mode B: Remote Cloud Control (Supabase)</h2>
              <p className="text-xs text-slate-400">Connect free Supabase backend for instant remote client blocking</p>
            </div>
          </div>
          <span
            className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${
              cloud.enabled
                ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {cloud.enabled ? '🟢 Cloud Active' : '⚪ LocalStorage Mode A'}
          </span>
        </div>

        {cloudMsg && (
          <div className="p-3 bg-sky-950/80 border border-sky-800 text-sky-300 rounded-xl text-xs font-bold">
            {cloudMsg}
          </div>
        )}

        <form onSubmit={handleSaveCloud} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Supabase Project URL
              </label>
              <input
                type="text"
                placeholder="https://xyzcompany.supabase.co"
                value={cloud.supabaseUrl || ''}
                onChange={(e) => setCloud({ ...cloud, supabaseUrl: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1">
                Supabase Anon Public API Key
              </label>
              <input
                type="password"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={cloud.supabaseAnonKey || ''}
                onChange={(e) => setCloud({ ...cloud, supabaseAnonKey: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-800/60 rounded-xl text-xs text-slate-400 leading-relaxed border border-slate-700/60">
            <span className="font-bold text-slate-300 block mb-0.5">ℹ️ How Remote Mode Works:</span>
            When Supabase credentials are provided, client apps sync with cloud every 30 minutes and on every app open. If you click <b>Force Block</b> or <b>Extend Expiry</b>, it syncs remotely across different devices. Without cloud, the system operates seamlessly in offline LocalStorage mode (Mode A).
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-black shadow-md transition cursor-pointer"
            >
              <Cloud className="w-4 h-4" />
              <span>Update Cloud Connection</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Data Management (Backup, Restore & Reset) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4">
        <h2 className="text-base font-black text-white pb-2 border-b border-slate-800">
          Data Management & Diagnostics
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Backup */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
            <span className="text-xs font-bold text-white block">Download Full System Backup</span>
            <p className="text-[11px] text-slate-400">
              Exports all client records, action history, and configuration as a single JSON file.
            </p>
            <button
              onClick={exportAllDataBackup}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-400" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          {/* Restore */}
          <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
            <span className="text-xs font-bold text-white block">Restore from JSON File</span>
            <p className="text-[11px] text-slate-400">
              Upload a previously downloaded backup JSON file to restore state.
            </p>
            <label className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold transition cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>Upload Backup JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFile}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
