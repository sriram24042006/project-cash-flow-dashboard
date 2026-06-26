import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Printer, Download, ArrowLeft, Clock, CheckCircle2, User, Edit2, Save, X, DollarSign, Users } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const ProjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    Projects: '',
    monthly: '',
    inflows: '',
    status: '',
    client: '',
    billing: ''
  });
  const [editError, setEditError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, newStatus: null });
  const [toastMessage, setToastMessage] = useState(null);

  const fetchDetail = async () => {
    try {
      const response = await api.getProjectDetail(id);
      if (response.data.success) {
        setProject(response.data.data);
        setEditForm({
          Projects: response.data.data.Projects,
          monthly: response.data.data.monthly,
          inflows: response.data.data.inflows,
          status: response.data.data.status,
          client: response.data.data.client || '',
          billing: response.data.data.billing || ''
        });
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError('Network error fetching project details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handlePrint = () => window.print();

  const handleExportCSV = () => {
    if (!project || !project.audit_logs) return;
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Timestamp,Action,Changed By\n";
    project.audit_logs.forEach(log => {
      const row = `"${log.timestamp}","${log.action}","${log.changed_by}"`;
      csvContent += row + "\n";
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Project_${project.Projects}_Audit_History.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEdit = () => {
    setEditError('');
    if (!editForm.Projects || !editForm.monthly || editForm.inflows === '') {
      setEditError('Projects, monthly, and inflows are required.');
      return;
    }

    if (editForm.status !== project.status) {
      setConfirmConfig({ isOpen: true, newStatus: editForm.status });
    } else {
      executeSave();
    }
  };

  const executeSave = async () => {
    setIsSaving(true);
    try {
      const response = await api.updateProject(id, {
        Projects: editForm.Projects,
        monthly: editForm.monthly,
        inflows: parseFloat(editForm.inflows),
        status: editForm.status,
        client: editForm.client,
        billing: editForm.billing
      });
      if (response.data.success) {
        setIsEditing(false);
        fetchDetail(); // Refresh data to get new audit logs
        setToastMessage(`Project updated successfully`);
        setTimeout(() => setToastMessage(null), 3000);
      } else {
        setEditError(response.data.message || 'Failed to update project.');
      }
    } catch (err) {
      setEditError('Network error updating project.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 p-6 rounded-2xl text-center">
        <p className="text-rose-400">{error || 'Unknown Error'}</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-400 hover:text-blue-300">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-white/10 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            {isEditing ? (
              <input 
                type="text" 
                name="Projects"
                value={editForm.Projects} 
                onChange={handleEditChange}
                className="text-2xl font-bold bg-white/10 border border-white/20 rounded px-2 py-1 text-white focus:outline-none"
              />
            ) : (
              <h1 className="text-2xl font-bold text-white tracking-wide">{project.Projects}</h1>
            )}
            
            <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
              <span>Active Month:</span> 
              {isEditing ? (
                <input type="text" name="monthly" value={editForm.monthly} onChange={handleEditChange} className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-blue-400 focus:outline-none w-24" />
              ) : (
                <span className="text-blue-400 font-medium">{project.monthly}</span>
              )}
              <span className="mx-1">•</span>
              <span>Status:</span>
              {isEditing ? (
                <select name="status" value={editForm.status} onChange={handleEditChange} className="bg-slate-800 border border-white/20 rounded px-2 py-0.5 text-white focus:outline-none">
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="archived">Archived</option>
                </select>
              ) : (
                <span className={`uppercase tracking-wider text-xs px-2 py-1 rounded-full ${project.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : project.status === 'completed' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-500/20 text-slate-400'}`}>
                  {project.status}
                </span>
              )}
            </p>
            {isEditing ? (
              <div className="flex gap-4 mt-2">
                <input type="text" name="client" placeholder="Client Name" value={editForm.client} onChange={handleEditChange} className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-slate-300 text-sm focus:outline-none flex-1" />
                <input type="text" name="billing" placeholder="Billing Details" value={editForm.billing} onChange={handleEditChange} className="bg-white/10 border border-white/20 rounded px-2 py-0.5 text-slate-300 text-sm focus:outline-none flex-1" />
              </div>
            ) : (
              <p className="text-slate-400 text-sm mt-1">
                Client: <span className="text-slate-300">{project.client || 'N/A'}</span> • Billing: <span className="text-slate-300">{project.billing || 'N/A'}</span>
              </p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex items-center px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                <X className="w-4 h-4 mr-2" /> Cancel
              </button>
              <button onClick={handleSaveEdit} disabled={isSaving} className="flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors disabled:opacity-50">
                <Save className="w-4 h-4 mr-2" /> {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsEditing(true)} className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/10">
                <Edit2 className="w-4 h-4 mr-2" /> Edit
              </button>
              <button onClick={handlePrint} className="flex items-center px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors border border-white/10 hidden md:flex">
                <Printer className="w-4 h-4 mr-2" /> Print
              </button>
              <button onClick={handleExportCSV} className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20 hidden md:flex">
                <Download className="w-4 h-4 mr-2" /> Export Logs
              </button>
            </>
          )}
        </div>
      </div>

      {editError && (
        <div className="p-4 bg-rose-500/20 border border-rose-500/50 rounded-xl text-rose-100 text-sm">
          {editError}
        </div>
      )}

      {/* Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Project Metrics & Linked Data */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4">Financial Overview</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-400">Total Inflows</p>
                {isEditing ? (
                  <div className="flex items-center mt-1">
                    <span className="text-emerald-400 text-xl font-bold mr-1">$</span>
                    <input type="number" name="inflows" value={editForm.inflows} onChange={handleEditChange} className="bg-white/10 border border-white/20 rounded px-2 py-1 text-emerald-400 font-bold w-full focus:outline-none" />
                  </div>
                ) : (
                  <p className="text-3xl font-bold text-emerald-400 mt-1">${parseFloat(project.inflows).toLocaleString()}</p>
                )}
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-slate-400">Created At</p>
                <p className="text-slate-200 mt-1">{new Date(project.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Linked Payments */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2 text-rose-400" />
              Linked Outflows (Payments)
            </h2>
            {project.payments && project.payments.length > 0 ? (
              <div className="space-y-3">
                {project.payments.map(pay => (
                  <div key={pay.id} className="p-3 bg-slate-800/50 rounded-lg border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{pay.monthly}</p>
                      <p className="text-xs text-slate-400 uppercase">{pay.status}</p>
                    </div>
                    <p className="text-rose-400 font-bold">${parseFloat(pay.inflows).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No linked payments found.</p>
            )}
          </div>

          {/* Linked Customers */}
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-400" />
              Linked Customers
            </h2>
            {project.customers && project.customers.length > 0 ? (
              <div className="space-y-3">
                {project.customers.map(cust => (
                  <div key={cust.id} className="p-3 bg-slate-800/50 rounded-lg border border-white/5 flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-slate-200">{cust.monthly}</p>
                      <p className="text-xs text-slate-400 uppercase">{cust.status}</p>
                    </div>
                    <p className="text-emerald-400 font-bold">${parseFloat(cust.inflows).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm">No linked customers found.</p>
            )}
          </div>
        </div>

        {/* Audit Log Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white mb-6 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              Audit Log History
            </h2>
            
            <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-700 before:to-transparent">
              
              {project.audit_logs && project.audit_logs.length > 0 ? (
                project.audit_logs.map((log, index) => (
                  <div key={log.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-slate-900 bg-blue-500 text-white shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow z-10">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-white/10 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-800/80 transition-colors shadow-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-blue-400 text-sm tracking-wide">{log.action}</span>
                        <span className="text-xs text-slate-400 font-medium">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center text-xs text-slate-300">
                        <User className="w-3 h-3 mr-1" /> {log.changed_by}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-slate-400 text-center py-8">No audit logs recorded for this project.</div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, newStatus: null })}
        onConfirm={executeSave}
        title="Confirm Status Change"
        message={`Change status to "${confirmConfig.newStatus}"? This action will be logged.`}
      />
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl flex items-center space-x-2 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

export default ProjectDetailView;
