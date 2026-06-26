import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

const ProjectCashFlowForecastingEntryForm = ({ onProjectAdded, initialValues, mode = 'create', onCancel, onSubmitSuccess }) => {
  const [formData, setFormData] = useState({
    Projects: initialValues?.Projects || '',
    monthly: initialValues?.monthly || '',
    inflows: initialValues?.inflows || '',
    client: initialValues?.client || '',
    billing: initialValues?.billing || '',
    status: initialValues?.status || 'active'
  });

  useEffect(() => {
    if (initialValues) {
      setFormData({
        Projects: initialValues.Projects || '',
        monthly: initialValues.monthly || '',
        inflows: initialValues.inflows || '',
        client: initialValues.client || '',
        billing: initialValues.billing || '',
        status: initialValues.status || 'active'
      });
    }
  }, [initialValues]);

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateField = (name, value) => {
    let error = '';
    switch (name) {
      case 'Projects':
        if (!value.trim()) error = 'Project name is required';
        break;
      case 'monthly':
        if (!value.match(/^\d{4}-\d{2}$/)) error = 'Must be in YYYY-MM format';
        break;
      case 'inflows':
        if (isNaN(value) || value === '') error = 'Must be a valid numerical amount';
        break;
      case 'client':
        if (!value.trim()) error = 'Client name is required';
        break;
      case 'billing':
        if (!value.trim()) error = 'Billing details are required';
        break;
      default:
        break;
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Real-time validation
    const error = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: error }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields before submission
    const newErrors = {};
    let isValid = true;
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key]);
      if (error) {
        newErrors[key] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);

    if (isValid) {
      setIsSubmitting(true);
      try {
        if (mode === 'edit' && initialValues?.id) {
          await api.updateProject(initialValues.id, {
            Projects: formData.Projects,
            monthly: formData.monthly,
            inflows: parseFloat(formData.inflows),
            client: formData.client,
            billing: formData.billing,
            status: formData.status
          });
          setSuccess(true);
          if (onSubmitSuccess) onSubmitSuccess();
        } else {
          await api.createProject({
            Projects: formData.Projects,
            monthly: formData.monthly,
            inflows: parseFloat(formData.inflows),
            client: formData.client,
            billing: formData.billing,
            status: 'active'
          });
          setSuccess(true);
          setFormData({ Projects: '', monthly: '', inflows: '', client: '', billing: '', status: 'active' });
          if (onProjectAdded) onProjectAdded();
        }
        
        // Reset success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } catch (err) {
        setErrors({ submit: 'Failed to create project. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
      {/* Decorative glassmorphism blob */}
      <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/30 rounded-full blur-3xl pointer-events-none"></div>
      
      <h2 className="text-2xl font-semibold text-white mb-6 tracking-wide">
        {mode === 'edit' ? 'Edit Cash Flow Entry' : 'New Cash Flow Entry'}
      </h2>
      
      {success && (
        <div className="mb-6 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-xl flex items-center text-emerald-100">
          <CheckCircle2 className="w-5 h-5 mr-3" />
          Project successfully {mode === 'edit' ? 'updated' : 'recorded'}!
        </div>
      )}

      {errors.submit && (
        <div className="mb-6 p-4 bg-rose-500/20 border border-rose-500/50 rounded-xl flex items-center text-rose-100">
          <AlertCircle className="w-5 h-5 mr-3" />
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Projects Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100">Project Name</label>
            <input
              type="text"
              name="Projects"
              value={formData.Projects}
              onChange={handleChange}
              placeholder="e.g., Alpha Development"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            {errors.Projects && <p className="text-rose-400 text-xs mt-1">{errors.Projects}</p>}
          </div>

          {/* Monthly Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100">Month (YYYY-MM)</label>
            <input
              type="text"
              name="monthly"
              value={formData.monthly}
              onChange={handleChange}
              placeholder="2026-06"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            {errors.monthly && <p className="text-rose-400 text-xs mt-1">{errors.monthly}</p>}
          </div>

          {/* Inflows Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100">Inflows ($)</label>
            <input
              type="text"
              name="inflows"
              value={formData.inflows}
              onChange={handleChange}
              placeholder="50000"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            {errors.inflows && <p className="text-rose-400 text-xs mt-1">{errors.inflows}</p>}
          </div>

          {/* Client Field */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-blue-100">Client</label>
            <input
              type="text"
              name="client"
              value={formData.client}
              onChange={handleChange}
              placeholder="Acme Corp"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            {errors.client && <p className="text-rose-400 text-xs mt-1">{errors.client}</p>}
          </div>

          {/* Billing Field */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-sm font-medium text-blue-100">Billing Details</label>
            <input
              type="text"
              name="billing"
              value={formData.billing}
              onChange={handleChange}
              placeholder="Milestone 1 Payment"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-blue-200/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
            />
            {errors.billing && <p className="text-rose-400 text-xs mt-1">{errors.billing}</p>}
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full md:w-auto px-8 py-3 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl transition-all"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full md:w-auto flex-1 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl shadow-[0_0_15px_rgba(37,99,235,0.5)] hover:shadow-[0_0_25px_rgba(37,99,235,0.7)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (mode === 'edit' ? 'Updating...' : 'Recording...') : (mode === 'edit' ? 'Update Cash Flow' : 'Record Cash Flow')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectCashFlowForecastingEntryForm;
