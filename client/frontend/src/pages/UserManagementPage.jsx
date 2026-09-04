import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { getUsers, createUser, updateUser } from '../services/api.js';
import { Users, UserPlus, Shield, ShieldCheck, UserCheck, UserX, Clock, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import { TableSkeleton } from '../components/common/Skeletons.jsx';
import ErrorState from '../components/common/ErrorState.jsx';
import { formatDate } from '../utils/formatters.js';

export default function UserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'EMPLOYEE' });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getUsers();
      setUsers(res.data || []);
    } catch (err) {
      setError(err.message || "Failed to load users from backend");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setModalError('');
    try {
      await createUser(formData);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', password: '', role: 'EMPLOYEE' });
      setActionSuccess("New team member added successfully!");
      setTimeout(() => setActionSuccess(''), 4000);
      loadUsers();
    } catch (err) {
      setModalError(err.message || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (targetUser) => {
    if (targetUser.id === currentUser?.id || targetUser._id === currentUser?.id) {
      alert("You cannot deactivate your own administrator account.");
      return;
    }

    const newStatus = !targetUser.isActive;
    const confirmMsg = newStatus 
      ? `Reactivate account for ${targetUser.name}?`
      : `Deactivate account for ${targetUser.name}? They will not be able to log in.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      await updateUser(targetUser.id || targetUser._id, { isActive: newStatus });
      setActionSuccess(`Account for ${targetUser.name} has been ${newStatus ? 'activated' : 'deactivated'}.`);
      setTimeout(() => setActionSuccess(''), 4000);
      loadUsers();
    } catch (err) {
      alert(err.message || "Failed to update account status.");
    }
  };

  const handleChangeRole = async (targetUser, newRole) => {
    if (targetUser.id === currentUser?.id || targetUser._id === currentUser?.id) {
      if (newRole !== 'ADMIN') {
        alert("You cannot remove your own administrator privileges.");
        return;
      }
    }

    try {
      await updateUser(targetUser.id || targetUser._id, { role: newRole });
      setActionSuccess(`Role for ${targetUser.name} updated to ${newRole}.`);
      setTimeout(() => setActionSuccess(''), 4000);
      loadUsers();
    } catch (err) {
      alert(err.message || "Failed to update user role.");
    }
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      
      {/* Header & Add User Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-extrabold tracking-tight text-white">User Management & Role Governance</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Control platform access levels, create employee accounts, and enforce role-based access policies (RBAC).
          </p>
        </div>

        <button
          onClick={() => {
            setIsModalOpen(true);
            setModalError('');
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Team Member</span>
        </button>
      </div>

      {/* Success Banner */}
      {actionSuccess && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center gap-2.5 text-xs text-emerald-300 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Users Table */}
      {loading ? (
        <TableSkeleton rows={4} cols={7} />
      ) : error ? (
        <ErrorState title="Failed to load users" message={error} onRetry={loadUsers} />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden glass-panel">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px] bg-slate-950/50">
                  <th className="py-3.5 px-4">User Name</th>
                  <th className="py-3.5 px-4">Email Address</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Account Status</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4">Last Login</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-10 text-center text-slate-500">
                      No users registered
                    </td>
                  </tr>
                ) : (
                  users.map((u) => {
                    const isSelf = u.id === currentUser?.id || u._id === currentUser?.id;
                    return (
                      <tr key={u.id || u._id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-white">
                          <div className="flex items-center gap-2">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-[10px] font-bold border border-indigo-500/30">
                                You
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-300 font-mono text-xs">
                          {u.email}
                        </td>
                        <td className="py-3.5 px-4">
                          <select
                            disabled={isSelf}
                            value={u.role}
                            onChange={(e) => handleChangeRole(u, e.target.value)}
                            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 disabled:opacity-75 disabled:cursor-not-allowed"
                          >
                            <option value="ADMIN">ADMIN</option>
                            <option value="EMPLOYEE">EMPLOYEE</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-4">
                          {u.isActive ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {formatDate(u.createdAt)}
                        </td>
                        <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                          {u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            disabled={isSelf}
                            onClick={() => handleToggleActive(u)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border disabled:opacity-40 disabled:cursor-not-allowed ${
                              u.isActive
                                ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/10'
                                : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-[#0B0F19] p-6 shadow-2xl shadow-indigo-950/50 space-y-5">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">Add Team Member</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Aditi Roy"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="aditi@revenuepilot.ai"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Initial Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-300">Platform Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="EMPLOYEE">EMPLOYEE (Recovery Operations)</option>
                  <option value="ADMIN">ADMIN (Full Platform & User Administration)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Create Account</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
