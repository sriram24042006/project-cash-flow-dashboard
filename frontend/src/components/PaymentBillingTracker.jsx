import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Activity, Loader2, AlertCircle } from 'lucide-react';

const PaymentBillingTracker = () => {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [inventory, setInventory] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  
  const [invForm, setInvForm] = useState({ project_id: '', Projects: '', monthly: '', inflows: '' });
  const [contractForm, setContractForm] = useState({ project_id: '', Projects: '', monthly: '', inflows: '' });
  const [customerForm, setCustomerForm] = useState({ project_id: '', Projects: '', monthly: '', inflows: '' });

  const fetchInventory = async () => {
    try {
      const res = await api.getInventory();
      if (res.data?.success) setInventory(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchContracts = async () => {
    try {
      const res = await api.getContracts();
      if (res.data?.success) setContracts(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.getCustomers();
      if (res.data?.success) setCustomers(res.data.data);
    } catch (e) { console.error(e); }
  };

  const fetchProjectsList = async () => {
    try {
      const res = await api.getProjects({ limit: 1000 }); // Fetch all
      if (res.data?.success) setProjectsList(res.data.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    fetchProjectsList();
    fetchInventory();
    fetchContracts();
    fetchCustomers();
  }, []);

  const handleInvSubmit = async (e) => {
    e.preventDefault();
    if (!invForm.project_id) return alert('Please select a project');
    try {
      await api.createInventory(invForm);
      setInvForm({ project_id: '', Projects: '', monthly: '', inflows: '' });
      fetchInventory();
    } catch (e) { console.error(e); }
  };

  const handleContractSubmit = async (e) => {
    e.preventDefault();
    if (!contractForm.project_id) return alert('Please select a project');
    try {
      await api.createContracts(contractForm);
      setContractForm({ project_id: '', Projects: '', monthly: '', inflows: '' });
      fetchContracts();
    } catch (e) { console.error(e); }
  };

  const handleCustomerSubmit = async (e) => {
    e.preventDefault();
    if (!customerForm.project_id) return alert('Please select a project');
    try {
      await api.createCustomer(customerForm);
      setCustomerForm({ project_id: '', Projects: '', monthly: '', inflows: '' });
      fetchCustomers();
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await api.getSummaryReport();
        if (response.data.success) {
          setReport(response.data);
        } else {
          setError('Failed to load metrics');
        }
      } catch (err) {
        setError('Network error loading metrics');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl h-full flex items-center justify-center min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-2xl h-full flex flex-col items-center justify-center text-rose-300 min-h-[300px]">
        <AlertCircle className="w-8 h-8 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  const totals = report?.totals || { totalMilestonesInflow: 0, totalOutflows: 0, netLiquidityPosition: 0 };
  const isPositive = totals.netLiquidityPosition >= 0;

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-wide">Executive Metrics</h2>
          <p className="text-sm text-blue-200 mt-1">Real-time liquidity outlook tracker</p>
        </div>
        <div className={`p-3 rounded-2xl ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
          <Activity className="w-6 h-6" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1">
        {/* Total Inflows Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:bg-white/10 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div>
            <div className="flex items-center text-emerald-300 mb-2">
              <DollarSign className="w-5 h-5 mr-1" />
              <h3 className="font-medium text-sm tracking-wider uppercase">Gross Inflows</h3>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">
              ${totals.totalMilestonesInflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-200/70 bg-emerald-500/10 w-fit px-2 py-1 rounded-md">
            <TrendingUp className="w-3 h-3 mr-1" /> Client Milestones
          </div>
        </div>

        {/* Total Outflows Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group hover:bg-white/10 transition-colors">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all"></div>
          <div>
            <div className="flex items-center text-rose-300 mb-2">
              <CreditCard className="w-5 h-5 mr-1" />
              <h3 className="font-medium text-sm tracking-wider uppercase">Gross Outflows</h3>
            </div>
            <p className="text-3xl font-bold text-white tracking-tight">
              ${totals.totalOutflows.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-rose-200/70 bg-rose-500/10 w-fit px-2 py-1 rounded-md">
            <TrendingDown className="w-3 h-3 mr-1" /> Contractor Payments
          </div>
        </div>

        {/* Net Liquidity Card */}
        <div className={`border rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group transition-colors ${
          isPositive 
            ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' 
            : 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20'
        }`}>
          <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full blur-2xl transition-all ${
            isPositive ? 'bg-emerald-500/20' : 'bg-rose-500/20'
          }`}></div>
          <div>
            <div className={`flex items-center mb-2 ${isPositive ? 'text-emerald-300' : 'text-rose-300'}`}>
              <Activity className="w-5 h-5 mr-1" />
              <h3 className="font-medium text-sm tracking-wider uppercase">Net Position</h3>
            </div>
            <p className="text-4xl font-black text-white tracking-tight drop-shadow-md">
              ${Math.abs(totals.netLiquidityPosition).toLocaleString(undefined, { maximumFractionDigits: 0 })}
              {totals.netLiquidityPosition < 0 && <span className="text-xl font-medium text-rose-400 ml-1">(Deficit)</span>}
            </p>
          </div>
          <div className="mt-4 flex items-center text-xs text-white/70">
            {isPositive ? (
              <span className="flex items-center bg-emerald-500/20 text-emerald-200 px-2 py-1 rounded-md">
                <TrendingUp className="w-3 h-3 mr-1" /> Positive Outlook
              </span>
            ) : (
              <span className="flex items-center bg-rose-500/20 text-rose-200 px-2 py-1 rounded-md">
                <TrendingDown className="w-3 h-3 mr-1" /> Negative Outlook
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-white tracking-wide mb-4">Inventory / Material Procurement</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <form onSubmit={handleInvSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
            <select value={invForm.project_id} onChange={e => {
                const proj = projectsList.find(p => p.id == e.target.value);
                setInvForm({...invForm, project_id: e.target.value, Projects: proj ? proj.Projects : ''});
            }} className="bg-slate-800 border border-white/20 rounded-xl px-4 py-2 text-white flex-1" required>
              <option value="">Select a Project...</option>
              {projectsList.map(p => <option key={p.id} value={p.id}>{p.Projects}</option>)}
            </select>
            <input type="text" placeholder="YYYY-MM" value={invForm.monthly} onChange={e => setInvForm({...invForm, monthly: e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-blue-200/50 flex-1" required />
            <input type="number" placeholder="Inflows" value={invForm.inflows} onChange={e => setInvForm({...invForm, inflows: e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-blue-200/50 flex-1" required />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl px-6 py-2 transition-all">Add</button>
          </form>
          <div className="space-y-2">
            {inventory.map(item => (
              <div key={item.id} className="bg-white/5 p-4 rounded-xl text-blue-100 flex justify-between items-center">
                <span>{item.Projects} ({item.monthly})</span>
                <span className="font-semibold text-emerald-300">${Number(item.inflows).toLocaleString()}</span>
              </div>
            ))}
            {inventory.length === 0 && <div className="text-blue-200/50 text-sm">No inventory records found.</div>}
          </div>
        </div>
      </div>

      {/* Contracts Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-white tracking-wide mb-4">Contracts</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <form onSubmit={handleContractSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
            <select value={contractForm.project_id} onChange={e => {
                const proj = projectsList.find(p => p.id == e.target.value);
                setContractForm({...contractForm, project_id: e.target.value, Projects: proj ? proj.Projects : ''});
            }} className="bg-slate-800 border border-white/20 rounded-xl px-4 py-2 text-white flex-1" required>
              <option value="">Select a Project...</option>
              {projectsList.map(p => <option key={p.id} value={p.id}>{p.Projects}</option>)}
            </select>
            <input type="text" placeholder="YYYY-MM" value={contractForm.monthly} onChange={e => setContractForm({...contractForm, monthly: e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-blue-200/50 flex-1" required />
            <input type="number" placeholder="Inflows" value={contractForm.inflows} onChange={e => setContractForm({...contractForm, inflows: e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-blue-200/50 flex-1" required />
            <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl px-6 py-2 transition-all">Add</button>
          </form>
          <div className="space-y-2">
            {contracts.map(item => (
              <div key={item.id} className="bg-white/5 p-4 rounded-xl text-blue-100 flex justify-between items-center">
                <span>{item.Projects} ({item.monthly})</span>
                <span className="font-semibold text-emerald-300">${Number(item.inflows).toLocaleString()}</span>
              </div>
            ))}
            {contracts.length === 0 && <div className="text-blue-200/50 text-sm">No contract records found.</div>}
          </div>
        </div>
      </div>

      {/* Customers Section */}
      <div className="mt-8">
        <h2 className="text-2xl font-semibold text-white tracking-wide mb-4">Add Customer Inflow</h2>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <form onSubmit={handleCustomerSubmit} className="flex flex-col md:flex-row gap-4 mb-6">
            <select value={customerForm.project_id} onChange={e => {
                const proj = projectsList.find(p => p.id == e.target.value);
                setCustomerForm({...customerForm, project_id: e.target.value, Projects: proj ? proj.Projects : ''});
            }} className="bg-slate-800 border border-white/20 rounded-xl px-4 py-2 text-white flex-1" required>
              <option value="">Select a Project...</option>
              {projectsList.map(p => <option key={p.id} value={p.id}>{p.Projects}</option>)}
            </select>
            <input type="text" placeholder="YYYY-MM" value={customerForm.monthly} onChange={e => setCustomerForm({...customerForm, monthly: e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-blue-200/50 flex-1" required />
            <input type="number" placeholder="Inflows" value={customerForm.inflows} onChange={e => setCustomerForm({...customerForm, inflows: e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white placeholder-blue-200/50 flex-1" required />
            <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl px-6 py-2 transition-all">Add</button>
          </form>
          <div className="space-y-2">
            {customers.map(item => (
              <div key={item.id} className="bg-white/5 p-4 rounded-xl text-blue-100 flex justify-between items-center">
                <span>{item.Projects} ({item.monthly})</span>
                <span className="font-semibold text-emerald-300">${Number(item.inflows).toLocaleString()}</span>
              </div>
            ))}
            {customers.length === 0 && <div className="text-blue-200/50 text-sm">No customer records found.</div>}
          </div>
        </div>
      </div>

    </div>
  );
};

export default PaymentBillingTracker;
