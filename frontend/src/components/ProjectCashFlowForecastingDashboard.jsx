import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Search, Loader2, Archive, CheckCircle, Clock, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown, Edit2 } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import ProjectCashFlowForecastingEntryForm from './ProjectCashFlowForecastingEntryForm';

const ProjectCashFlowForecastingDashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('created_at');
  const [order, setOrder] = useState('desc');

  const [summary, setSummary] = useState(null);

  const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, id: null, newStatus: null });
  const [toastMessage, setToastMessage] = useState(null);

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingProjectData, setEditingProjectData] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit: 20,
        search: searchTerm || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter.toLowerCase(),
        sortBy,
        order
      };
      
      const [response, summaryResponse] = await Promise.all([
        api.getProjects(params),
        api.getDashboardSummary()
      ]);

      if (response.data.success) {
        setProjects(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
      } else {
        setError('Failed to fetch projects data.');
      }

      if (summaryResponse.data.success) {
        setSummary(summaryResponse.data.data);
      }
    } catch (err) {
      setError('Network error while fetching dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, statusFilter, sortBy, order]);

  // Debounce search to avoid spamming the API
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setPage(1); // Reset to first page on search
      fetchProjects();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, statusFilter, sortBy, order, fetchProjects]);

  const handleSort = (column) => {
    if (sortBy === column) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setOrder('asc');
    }
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40 group-hover:opacity-100" />;
    return order === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 text-blue-400" /> : <ArrowDown className="w-3 h-3 ml-1 text-blue-400" />;
  };

  const handleEditClick = async (e, id) => {
    e.stopPropagation();
    try {
      const response = await api.getProjectById(id);
      if (response.data.success) {
        setEditingProjectData(response.data.data);
        setEditModalOpen(true);
      } else {
        alert("Failed to load project details");
      }
    } catch (err) {
      alert("Error loading project details");
    }
  };

  const handleStatusUpdate = (e, id, newStatus) => {
    e.stopPropagation(); // Prevent row click
    setConfirmConfig({ isOpen: true, id, newStatus });
  };

  const executeStatusUpdate = async () => {
    const { id, newStatus } = confirmConfig;
    if (!id || !newStatus) return;
    
    try {
      await api.updateProjectStatus(id, newStatus);
      fetchProjects(); // Refresh the list
      setToastMessage(`Project status updated to ${newStatus}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <Clock className="w-4 h-4 text-amber-400" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'archived': return <Archive className="w-4 h-4 text-slate-400" />;
      default: return null;
    }
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'active': return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'completed': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      case 'archived': return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
      default: return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-wide">Project Master Grid</h2>
          <p className="text-sm text-blue-200 mt-1">Manage and track your cash flow projections</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-200" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>
      </div>

      {/* Summary Widget */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 p-4 rounded-xl border border-white/10 shadow-sm">
            <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Projects</p>
            <p className="text-2xl text-white font-bold mt-1">{summary.totalProjects || 0}</p>
          </div>
          <div className="bg-amber-500/10 p-4 rounded-xl border border-amber-500/20 shadow-sm">
            <p className="text-xs text-amber-400 uppercase tracking-wider font-semibold">Active</p>
            <p className="text-2xl text-amber-100 font-bold mt-1">{summary.activeProjects || 0}</p>
          </div>
          <div className="bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 shadow-sm">
            <p className="text-xs text-emerald-400 uppercase tracking-wider font-semibold">Completed</p>
            <p className="text-2xl text-emerald-100 font-bold mt-1">{summary.completedProjects || 0}</p>
          </div>
          <div className="bg-blue-600/10 p-4 rounded-xl border border-blue-500/20 shadow-sm">
            <p className="text-xs text-blue-400 uppercase tracking-wider font-semibold">Total Inflows</p>
            <p className="text-2xl text-blue-100 font-bold mt-1">${(summary.totalInflows || 0).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex border-b border-white/10 mb-6 overflow-x-auto scrollbar-hide w-full">
        {[
          { label: 'All', value: 'All', count: summary?.totalProjects || 0 },
          { label: 'Active', value: 'Active', count: summary?.activeProjects || 0 },
          { label: 'Completed', value: 'Completed', count: summary?.completedProjects || 0 },
          { label: 'Archived', value: 'Archived', count: summary?.archivedProjects || 0 }
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`flex items-center px-6 py-3 text-sm transition-all whitespace-nowrap border-b-2 ${
              statusFilter === tab.value 
                ? 'border-blue-600 text-blue-600 font-semibold' 
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20 font-medium'
            }`}
          >
            {tab.label}
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
              statusFilter === tab.value 
                ? 'bg-blue-600/20 text-blue-500' 
                : 'bg-white/10 text-slate-300'
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Data Grid Area */}
      <div className="flex-1 relative min-h-[400px]">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-300">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-blue-500" />
            <p>Loading projects...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-300">
            <AlertCircle className="w-12 h-12 mb-4 text-rose-500" />
            <p>{error}</p>
            <button onClick={fetchProjects} className="mt-4 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition">Retry</button>
          </div>
        ) : projects.length === 0 ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-200 opacity-70">
            <Archive className="w-16 h-16 mb-4 stroke-[1]" />
            <p className="text-lg">No projects found.</p>
            <p className="text-sm">Try adjusting your filters or search term.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/10 bg-black/10">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 text-xs uppercase tracking-wider text-blue-200 border-b border-white/10">
                  <th className="p-4 font-medium cursor-pointer group hover:text-white transition" onClick={() => handleSort('Projects')}>
                    <div className="flex items-center">Project Name <SortIcon column="Projects" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer group hover:text-white transition" onClick={() => handleSort('monthly')}>
                    <div className="flex items-center">Month <SortIcon column="monthly" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer group hover:text-white transition text-right" onClick={() => handleSort('inflows')}>
                    <div className="flex items-center justify-end">Inflows ($) <SortIcon column="inflows" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer group hover:text-white transition" onClick={() => handleSort('client')}>
                    <div className="flex items-center">Client <SortIcon column="client" /></div>
                  </th>
                  <th className="p-4 font-medium cursor-pointer group hover:text-white transition text-center" onClick={() => handleSort('status')}>
                    <div className="flex items-center justify-center">Status <SortIcon column="status" /></div>
                  </th>
                  <th className="p-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {projects.map((project) => (
                  <tr 
                    key={project.id} 
                    onClick={() => navigate(`/project/${project.id}`)}
                    className="hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <td className="p-4 font-medium text-white">{project.Projects}</td>
                    <td className="p-4 text-blue-100">{project.monthly}</td>
                    <td className="p-4 text-right font-mono text-emerald-300">
                      ${project.inflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-slate-300">{project.client || '-'}</td>
                    <td className="p-4">
                      <div className="flex justify-center">
                        <span className={`flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusClass(project.status)}`}>
                          <span className="mr-1.5">{getStatusIcon(project.status)}</span>
                          <span className="capitalize">{project.status}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={(e) => handleEditClick(e, project.id)}
                          className="p-1.5 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 rounded-lg transition"
                          title="Edit Project"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {project.status !== 'completed' && (
                          <button 
                            onClick={(e) => handleStatusUpdate(e, project.id, 'completed')}
                            className="p-1.5 bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-300 rounded-lg transition"
                            title="Mark as Completed"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {project.status !== 'archived' && (
                          <button 
                            onClick={(e) => handleStatusUpdate(e, project.id, 'archived')}
                            className="p-1.5 bg-slate-500/20 hover:bg-slate-500/40 text-slate-300 rounded-lg transition"
                            title="Archive Project"
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && !loading && !error && projects.length > 0 && (
        <div className="flex justify-between items-center mt-6 pt-6 border-t border-white/10">
          <p className="text-sm text-blue-200">
            Page <span className="font-medium text-white">{page}</span> of <span className="font-medium text-white">{totalPages}</span>
          </p>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded text-sm text-white transition"
            >
              Previous
            </button>
            <button 
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed rounded text-sm text-white transition"
            >
              Next
            </button>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={confirmConfig.isOpen}
        onClose={() => setConfirmConfig({ isOpen: false, id: null, newStatus: null })}
        onConfirm={executeStatusUpdate}
        title="Confirm Status Change"
        message={`Change status to "${confirmConfig.newStatus}"? This action will be logged.`}
      />
      
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl backdrop-blur-md shadow-2xl flex items-center space-x-2 z-50 animate-in slide-in-from-bottom-5">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
      
      {/* Edit Modal Wrapper */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl my-8 animate-in fade-in zoom-in duration-200">
            <ProjectCashFlowForecastingEntryForm 
              mode="edit"
              initialValues={editingProjectData}
              onCancel={() => {
                setEditModalOpen(false);
                setEditingProjectData(null);
              }}
              onSubmitSuccess={() => {
                setEditModalOpen(false);
                setEditingProjectData(null);
                fetchProjects();
                setToastMessage("Project updated successfully");
                setTimeout(() => setToastMessage(null), 3000);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectCashFlowForecastingDashboard;
