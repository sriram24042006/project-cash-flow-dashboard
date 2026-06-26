import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../api/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from 'recharts';
import { Loader2, AlertCircle, BarChart3, TrendingUp, Download, Calendar } from 'lucide-react';

const ReportsAnalyticsDashboard = () => {
  const [rawData, setRawData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        
        const response = await api.getSummaryReport(params);
        if (response.data.success) {
          setRawData(response.data.timeSeries);
        } else {
          setError('Failed to load analytics data.');
        }
      } catch (err) {
        setError('Network error while loading analytics.');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [startDate, endDate]);

  const data = useMemo(() => {
    let filtered = rawData;
    if (startDate) {
      filtered = filtered.filter(item => item.month >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(item => item.month <= endDate);
    }

    let runningBalance = 0;
    return filtered.map(item => {
      runningBalance += item.net;
      return {
        ...item,
        cumulativeBalance: runningBalance
      };
    });
  }, [rawData, startDate, endDate]);

  const handleExportCSV = () => {
    if (data.length === 0) return;
    
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Month,Inflows,Outflows,Net Liquidity,Cumulative Balance\n";
    
    data.forEach(item => {
      const row = `"${item.month}","${item.inflow}","${item.outflow}","${item.net}","${item.cumulativeBalance}"`;
      csvContent += row + "\n";
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Analytical_Data_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Custom Tooltip for Glassmorphism UI
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/80 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-2xl">
          <p className="text-white font-semibold mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center space-x-2 text-sm my-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-slate-300 capitalize">{entry.name}:</span>
              <span className="text-white font-mono font-medium">${entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl h-[500px] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-rose-500/10 backdrop-blur-md border border-rose-500/20 rounded-3xl p-6 md:p-8 shadow-2xl h-[500px] flex flex-col items-center justify-center text-rose-300">
        <AlertCircle className="w-10 h-10 mb-4" />
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
        <div className="flex items-center space-x-3 text-white">
          <Calendar className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold tracking-wide">Date Range Filters</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
          <input 
            type="month" 
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full sm:w-auto bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            title="Start Month"
          />
          <span className="text-slate-400">to</span>
          <input 
            type="month" 
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full sm:w-auto bg-black/30 border border-white/10 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            title="End Month"
          />
          <button 
            onClick={handleExportCSV}
            className="w-full sm:w-auto flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-500/20"
          >
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </button>
        </div>
      </div>

      {/* Bar Chart: Inflows vs Outflows */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-blue-500/20 rounded-xl mr-4">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">Monthly Cash Flow Comparison</h2>
            <p className="text-sm text-blue-200">Milestone inflows vs. Contractor outflows</p>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Bar dataKey="inflow" name="Inflows" fill="#34d399" radius={[4, 4, 0, 0]} barSize={40} />
              <Bar dataKey="outflow" name="Outflows" fill="#f87171" radius={[4, 4, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Area Chart: Cumulative 60-Day Forward Cash Balance */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-purple-500/20 rounded-xl mr-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">60-Day Forward Liquidity Timeline</h2>
            <p className="text-sm text-blue-200">Continuous timeline tracking projected cash balances</p>
          </div>
        </div>

        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
              <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} tickFormatter={(value) => `$${value}`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              <Area 
                type="monotone" 
                dataKey="cumulativeBalance" 
                name="Cumulative Balance" 
                stroke="#818cf8" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBalance)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* Line Chart: Monthly Net Liquidity */}
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center mb-6">
          <div className="p-2 bg-emerald-500/20 rounded-xl mr-4">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white tracking-wide">Monthly Net Liquidity — Line View</h2>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
            <XAxis dataKey="month" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} />
            <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.7)' }} tickFormatter={(value) => `$${value}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line type="monotone" dataKey="net" name="Net Liquidity" stroke="#34d399" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportsAnalyticsDashboard;
