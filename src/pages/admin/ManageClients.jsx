import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminAPI } from '../../api/client';
import { 
  Users, 
  Plus, 
  Trash2, 
  Edit3, 
  Lock, 
  Store, 
  User, 
  ShieldCheck, 
  ArrowLeft, 
  Check, 
  X,
  Power
} from 'lucide-react';

export default function ManageClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Client Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shopName, setShopName] = useState('A-One Bun Kabab');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Edit / Password Reset State
  const [editingClient, setEditingClient] = useState(null);
  const [editShopName, setEditShopName] = useState('');
  const [editActive, setEditActive] = useState(true);
  const [editPassword, setEditPassword] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getClients();
      if (res.success) {
        setClients(res.clients || []);
      }
    } catch (err) {
      console.error('Fetch clients error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Create Client
  const handleCreateClient = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!username.trim() || !password.trim()) return;

    setSubmitting(true);
    try {
      const res = await adminAPI.createClient({
        username: username.trim(),
        password: password.trim(),
        shopName: shopName.trim(),
      });

      if (res.success) {
        setUsername('');
        setPassword('');
        setShopName('A-One Bun Kabab');
        setShowAddForm(false);
        fetchClients();
      }
    } catch (err) {
      setFormError(err.message || 'Could not create client.');
    } finally {
      setSubmitting(false);
    }
  };

  // Open Edit Modal
  const startEdit = (client) => {
    setEditingClient(client);
    setEditShopName(client.shopName);
    setEditActive(client.active);
    setEditPassword('');
  };

  // Save Edit Client
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;

    setEditSubmitting(true);
    try {
      const payload = {
        shopName: editShopName.trim(),
        active: editActive,
      };
      if (editPassword.trim()) {
        payload.password = editPassword.trim();
      }

      const res = await adminAPI.updateClient(editingClient._id, payload);
      if (res.success) {
        setEditingClient(null);
        fetchClients();
      }
    } catch (err) {
      alert(err.message || 'Could not update client.');
    } finally {
      setEditSubmitting(false);
    }
  };

  // Delete Client
  const handleDeleteClient = async (client) => {
    if (!window.confirm(`Permanently delete client '${client.username}' and ALL their sales data?`)) return;
    try {
      await adminAPI.deleteClient(client._id);
      fetchClients();
    } catch (err) {
      alert(err.message || 'Could not delete client');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 py-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-700 transition-colors"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏪</span>
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                Manage Client Accounts (Multi-Tenant)
              </h1>
            </div>
            <p className="text-xs text-stone-500 font-semibold mt-0.5">
              Create, edit, reset passwords and control active status for shop clients
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-1.5 shadow-md shadow-rose-900/20 active:scale-95 transition-all"
        >
          {showAddForm ? <X size={16} /> : <Plus size={16} strokeWidth={2.5} />}
          <span>{showAddForm ? 'Close Form' : '+ Create New Client'}</span>
        </button>
      </div>

      {/* Add Client Form */}
      {showAddForm && (
        <div className="bg-white p-5 rounded-3xl border-2 border-rose-400 shadow-xl space-y-4 animate-scale-in">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="font-extrabold text-stone-800 text-sm flex items-center gap-2">
              <Plus size={16} className="text-rose-600" />
              <span>Create New Shop Client Account</span>
            </h3>
            <button
              onClick={() => setShowAddForm(false)}
              className="text-stone-400 hover:text-stone-700"
            >
              <X size={18} />
            </button>
          </div>

          {formError && (
            <div className="text-xs bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 font-bold">
              {formError}
            </div>
          )}

          <form onSubmit={handleCreateClient} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Shop Name (Dukaan ka Naam) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. A-One Bun Kabab Saddar"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                User ID / Username *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. saddar_branch"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono font-bold focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                required
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 text-stone-800"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/20 active:scale-95"
              >
                {submitting ? 'Creating...' : 'Create Client'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Clients Table */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-stone-100 flex items-center justify-between">
          <h3 className="font-extrabold text-stone-800 text-sm flex items-center gap-2">
            <span>👥</span>
            <span>Registered Shop Clients ({clients.length})</span>
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-stone-400 font-bold text-xs">
            Loading clients...
          </div>
        ) : clients.length === 0 ? (
          <div className="p-12 text-center text-stone-400 text-xs font-semibold">
            No client accounts exist.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-stone-50/70 text-stone-400 uppercase tracking-wider font-extrabold">
                  <th className="py-3 px-4">Shop Name</th>
                  <th className="py-3 px-4">User ID (Login)</th>
                  <th className="py-3 px-4">Account Status</th>
                  <th className="py-3 px-4">Created Date</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-semibold">
                {clients.map((c) => (
                  <tr key={c._id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-stone-800 text-sm">
                      {c.shopName}
                    </td>

                    <td className="py-3.5 px-4 font-mono font-bold text-stone-600">
                      @{c.username}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          c.active
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : 'bg-rose-100 text-rose-800 border-rose-300'
                        }`}
                      >
                        {c.active ? 'ACTIVE' : 'DISABLED'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-400">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(c)}
                          className="px-2.5 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors"
                        >
                          <Edit3 size={13} />
                          <span>Edit / Reset Pass</span>
                        </button>

                        <button
                          onClick={() => handleDeleteClient(c)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50"
                          title="Delete Client"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-stone-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-stone-200 animate-scale-in space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <span className="text-xs uppercase font-extrabold text-stone-400">
                  Edit Client Account
                </span>
                <h3 className="text-lg font-black text-stone-900">
                  @{editingClient.username}
                </h3>
              </div>
              <button
                onClick={() => setEditingClient(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Shop Name
                </label>
                <input
                  type="text"
                  required
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-bold text-stone-800"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Reset Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  placeholder="Enter new password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl font-mono text-stone-800"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="font-bold text-stone-700">Account Access:</span>
                <button
                  type="button"
                  onClick={() => setEditActive(!editActive)}
                  className={`px-3 py-1.5 rounded-xl font-black text-[11px] transition-colors ${
                    editActive
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                      : 'bg-rose-100 text-rose-800 border border-rose-300'
                  }`}
                >
                  {editActive ? 'ENABLED (Active)' : 'DISABLED (Blocked)'}
                </button>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="w-1/2 py-2.5 border border-stone-300 rounded-xl font-bold text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-md shadow-rose-900/20 active:scale-95"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
