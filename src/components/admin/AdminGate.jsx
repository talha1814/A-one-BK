import React, { useState, useEffect, useCallback } from 'react';
import AdminLogin from './AdminLogin';
import AdminSidebar from './AdminSidebar';
import AdminDashboard from './AdminDashboard';
import ClientManager from './ClientManager';
import ClientForm from './ClientForm';
import PaymentHistory from './PaymentHistory';
import AdminSettings from './AdminSettings';
import Modal from '../shared/Modal';
import {
  verifyAdminSession,
  adminLogout,
  getClients,
  getActionLogs,
  addClient,
  editClient,
  extendClientExpiry,
  toggleForceBlockClient,
  deleteClient,
} from '../../utils/licence';
import { generateRandomPassword } from '../../utils/codeGen';
import { KeyRound, Sparkles, Copy, Check } from 'lucide-react';

export default function AdminGate() {
  const [isAdminAuth, setIsAdminAuth] = useState(() => verifyAdminSession());
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'clients' | 'payments' | 'settings'
  const [clients, setClients] = useState(() => getClients());
  const [actionLogs, setActionLogs] = useState(() => getActionLogs());

  // Modals state
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copiedPass, setCopiedPass] = useState(false);
  const [historyModalClient, setHistoryModalClient] = useState(null);

  const refreshData = useCallback(() => {
    setClients(getClients());
    setActionLogs(getActionLogs());
  }, []);

  useEffect(() => {
    // Check session validity periodically
    const timer = setInterval(() => {
      if (!verifyAdminSession()) {
        setIsAdminAuth(false);
      }
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    adminLogout();
    setIsAdminAuth(false);
  };

  const handleOpenAddClient = () => {
    setEditingClient(null);
    setIsClientFormOpen(true);
  };

  const handleOpenEditClient = (client) => {
    setEditingClient(client);
    setIsClientFormOpen(true);
  };

  const handleSaveClientForm = async (formData) => {
    try {
      if (editingClient) {
        await editClient(editingClient.id, formData);
      } else {
        await addClient(formData);
      }
      setIsClientFormOpen(false);
      setEditingClient(null);
      refreshData();
    } catch (err) {
      alert(err.message || 'Operation failed');
    }
  };

  const handleExtendExpiry = async (id, days, amount) => {
    try {
      await extendClientExpiry(id, days, amount);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to extend expiry');
    }
  };

  const handleToggleForceBlock = async (id, blocked) => {
    try {
      await toggleForceBlockClient(id, blocked);
      refreshData();
    } catch (err) {
      alert(err.message || 'Failed to update block state');
    }
  };

  const handleDeleteClient = (id) => {
    deleteClient(id);
    refreshData();
  };

  const handleGeneratePasswordTool = () => {
    setGeneratedPassword(generateRandomPassword());
    setCopiedPass(false);
    setIsPasswordModalOpen(true);
  };

  if (!isAdminAuth) {
    return <AdminLogin onLoginSuccess={() => setIsAdminAuth(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row selection:bg-indigo-500 selection:text-white">
      {/* Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
        clientCount={clients.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl">
        {activeTab === 'dashboard' && (
          <AdminDashboard
            clients={clients}
            actionLogs={actionLogs}
            onNavigateTab={setActiveTab}
            onOpenAddClient={handleOpenAddClient}
            onOpenPasswordGenerator={handleGeneratePasswordTool}
          />
        )}

        {activeTab === 'clients' && (
          <ClientManager
            clients={clients}
            onAddClient={handleOpenAddClient}
            onEditClient={handleOpenEditClient}
            onExtendExpiry={handleExtendExpiry}
            onToggleForceBlock={handleToggleForceBlock}
            onDeleteClient={handleDeleteClient}
            onViewClientHistory={(client) => setHistoryModalClient(client)}
          />
        )}

        {activeTab === 'payments' && (
          <PaymentHistory actionLogs={actionLogs} />
        )}

        {activeTab === 'settings' && (
          <AdminSettings onConfigUpdated={refreshData} />
        )}
      </main>

      {/* Add / Edit Client Modal */}
      <ClientForm
        isOpen={isClientFormOpen}
        client={editingClient}
        onClose={() => {
          setIsClientFormOpen(false);
          setEditingClient(null);
        }}
        onSave={handleSaveClientForm}
      />

      {/* Password Generator Tool Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-sm w-full p-5 text-white shadow-2xl space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-black">Random Password Generator</h3>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Cryptographically strong, readable password format for new clients:
            </p>

            <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between">
              <span className="font-mono text-base font-black text-amber-300 tracking-wider">
                {generatedPassword}
              </span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedPassword);
                  setCopiedPass(true);
                  setTimeout(() => setCopiedPass(false), 2000);
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition"
              >
                {copiedPass ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => {
                  setGeneratedPassword(generateRandomPassword());
                  setCopiedPass(false);
                }}
                className="flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Generate Another</span>
              </button>

              <button
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Specific History Modal */}
      {historyModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 text-white shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-black">History for {historyModalClient.shopName}</h3>
                <p className="text-xs text-slate-400">Client ID: {historyModalClient.id} (@{historyModalClient.username})</p>
              </div>
              <button
                onClick={() => setHistoryModalClient(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-2">
              {actionLogs
                .filter((l) => l.clientId === historyModalClient.id)
                .map((log) => (
                  <div key={log.id} className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60 text-xs flex justify-between items-center">
                    <div>
                      <span className="font-bold text-white block">{log.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.date).toLocaleString()}
                      </span>
                    </div>
                    <span className="font-black text-emerald-400">
                      {log.amount > 0 ? `Rs ${log.amount}` : '-'}
                    </span>
                  </div>
                ))}
            </div>

            <div className="pt-2 border-t border-slate-800 text-right">
              <button
                onClick={() => setHistoryModalClient(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
