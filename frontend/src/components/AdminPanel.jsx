import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { Users, Shield, Trash2, Activity } from 'lucide-react';

const AdminPanel = () => {
    const [users, setUsers] = useState([]);
    const [logs, setLogs] = useState([]);
    const [newUsername, setNewUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [newRole, setNewRole] = useState('user');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const fetchData = async () => {
        try {
            const usersRes = await api.getUsers();
            setUsers(usersRes.data.data || []);
            const logsRes = await api.getAuditLogs();
            setLogs(logsRes.data.data || []);
        } catch (err) {
            console.error("Failed to load admin data", err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            await api.createUser({ username: newUsername, password: newPassword, role: newRole });
            setSuccess('User created successfully');
            setNewUsername('');
            setNewPassword('');
            fetchData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user');
        }
    };

    const handleDeleteUser = async (id) => {
        if (!window.confirm('Are you sure you want to delete this user?')) return;
        try {
            await api.deleteUser(id);
            fetchData();
        } catch (err) {
            alert('Failed to delete user');
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* User Management Section */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center mb-6">
                            <Users className="w-5 h-5 mr-3 text-blue-400" />
                            <h2 className="text-xl font-semibold text-white">Create User</h2>
                        </div>
                        <form onSubmit={handleCreateUser} className="space-y-4">
                            {error && <div className="text-rose-400 text-sm">{error}</div>}
                            {success && <div className="text-green-400 text-sm">{success}</div>}
                            <input
                                type="text"
                                placeholder="Username"
                                value={newUsername}
                                onChange={e => setNewUsername(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                                required
                            />
                            <select
                                value={newRole}
                                onChange={e => setNewRole(e.target.value)}
                                className="w-full px-4 py-2 bg-slate-900/50 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                            >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                            </select>
                            <button
                                type="submit"
                                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
                            >
                                Create User
                            </button>
                        </form>
                    </div>
                </div>

                {/* Users List */}
                <div className="lg:col-span-2">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
                        <div className="flex items-center mb-6">
                            <Shield className="w-5 h-5 mr-3 text-purple-400" />
                            <h2 className="text-xl font-semibold text-white">User Accounts</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-white/10 text-slate-400 text-sm">
                                        <th className="pb-3 px-4 font-medium">Username</th>
                                        <th className="pb-3 px-4 font-medium">Role</th>
                                        <th className="pb-3 px-4 font-medium">Created</th>
                                        <th className="pb-3 px-4 font-medium text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(user => (
                                        <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                            <td className="py-3 px-4 text-white">{user.username}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded-md text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-300'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-slate-400 text-sm">{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td className="py-3 px-4 text-right">
                                                <button onClick={() => handleDeleteUser(user.id)} className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Audit Logs */}
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center mb-6">
                            <Activity className="w-5 h-5 mr-3 text-emerald-400" />
                            <h2 className="text-xl font-semibold text-white">System Audit Logs</h2>
                        </div>
                        <div className="max-h-96 overflow-y-auto pr-2 space-y-3">
                            {logs.map(log => (
                                <div key={log.id} className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-white text-sm font-medium">{log.action}</span>
                                        <span className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center text-xs text-slate-400">
                                        <span>Project ID: {log.project_id}</span>
                                        <span className="mx-2">•</span>
                                        <span>By: {log.changed_by}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
