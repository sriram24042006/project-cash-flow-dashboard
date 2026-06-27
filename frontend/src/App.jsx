import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation, Link, Navigate } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, BarChart2, Menu, X, Wallet, ChevronRight, CreditCard, Shield } from 'lucide-react';

import ProjectCashFlowForecastingEntryForm from './components/ProjectCashFlowForecastingEntryForm';
import ProjectCashFlowForecastingDashboard from './components/ProjectCashFlowForecastingDashboard';
import PaymentBillingTracker from './components/PaymentBillingTracker';
import ReportsAnalyticsDashboard from './components/ReportsAnalyticsDashboard';
import AlertBanner from './components/AlertBanner';
import ProjectDetailView from './components/ProjectDetailView';
import LoginView from './components/LoginView';
import AdminPanel from './components/AdminPanel';
import { api } from './api/client';

const App = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [isVerifying, setIsVerifying] = useState(true);

  React.useEffect(() => {
    const verifyUser = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          api.setToken(token);
          const response = await api.verifyToken();
          if (response.data.success) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            localStorage.removeItem('token');
            api.setToken(null);
          }
        } catch (err) {
          localStorage.removeItem('token');
          api.setToken(null);
        }
      }
      setIsVerifying(false);
    };
    verifyUser();
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    api.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  let navLinks = [
    { to: '/', icon: <LayoutDashboard className="w-5 h-5 mr-3" />, label: 'Dashboard Grid' },
    { to: '/entry', icon: <PlusCircle className="w-5 h-5 mr-3" />, label: 'New Entry' },
    { to: '/payments', icon: <CreditCard className="w-5 h-5 mr-3" />, label: 'Payments Tracker' },
    { to: '/analytics', icon: <BarChart2 className="w-5 h-5 mr-3" />, label: 'Analytics & Reports' },
  ];

  if (user?.role === 'admin') {
    navLinks.push({ to: '/admin', icon: <Shield className="w-5 h-5 mr-3" />, label: 'Admin Panel' });
  }

  const Breadcrumbs = () => {
    const location = useLocation();
    const pathnames = location.pathname.split('/').filter((x) => x);
    
    return (
      <nav className="flex text-sm text-slate-400 mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link to="/" className="hover:text-white transition-colors">Dashboard</Link>
          </li>
          {pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join('/')}`;
            const isLast = index === pathnames.length - 1;
            const label = value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ');

            return (
              <li key={to}>
                <div className="flex items-center">
                  <ChevronRight className="w-4 h-4 mx-1" />
                  {isLast ? (
                    <span className="text-white font-medium">{label}</span>
                  ) : (
                    <Link to={to} className="hover:text-white transition-colors">{label}</Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    );
  };

  if (isVerifying) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  }

  return (
    <Router>
      <AlertBanner />
      <div className="flex flex-col md:flex-row min-h-screen bg-transparent relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-black/20 backdrop-blur-md border-b border-white/10 z-50">
          <div className="flex items-center text-white font-bold text-xl tracking-wide">
            <Wallet className="w-6 h-6 mr-2 text-blue-400" />
            CashFlow
          </div>
          <button onClick={toggleMobileMenu} className="text-white p-2">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Sidebar Navigation */}
        <nav className={`
          fixed md:relative top-0 left-0 h-full z-40
          w-64 bg-slate-900/40 backdrop-blur-xl border-r border-white/10 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0 pt-20' : '-translate-x-full md:translate-x-0'}
          flex flex-col
        `}>
          <div className="hidden md:flex items-center p-6 mb-4 text-white font-bold text-2xl tracking-wide border-b border-white/5">
            <Wallet className="w-8 h-8 mr-3 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
            <span>CashFlow</span>
          </div>

          <div className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => `
                  flex items-center px-4 py-3 rounded-xl transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30 shadow-[inset_0_0_20px_rgba(37,99,235,0.1)]' 
                    : 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                  }
                `}
              >
                <div className={`transition-transform group-hover:scale-110`}>
                  {link.icon}
                </div>
                <span className="font-medium text-sm tracking-wide">{link.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="p-4 border-t border-white/5 space-y-4 text-xs text-slate-400">
            {isAuthenticated ? (
              <>
                <div className="flex items-center justify-between px-2">
                    <span className="truncate max-w-[120px] text-white font-medium">{user?.username}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] ${user?.role === 'admin' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-500/20 text-slate-300'}`}>{user?.role}</span>
                </div>
                <button onClick={handleLogout} className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors flex items-center justify-center">
                    Logout
                </button>
              </>
            ) : (
              <Link to="/login" className="w-full py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors flex items-center justify-center font-medium">
                  Sign In / Sign Up
              </Link>
            )}
            <div className="text-center">&copy; 2026 CashFlow Inc.</div>
          </div>
        </nav>

        {/* Overlay for mobile when menu is open */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full max-w-7xl mx-auto">
          <Breadcrumbs />
          <Routes>
            <Route path="/" element={
              <div className="space-y-8 animate-in fade-in duration-500">
                {/* Master Data Grid */}
                <div className="min-h-[500px]">
                  <ProjectCashFlowForecastingDashboard />
                </div>
              </div>
            } />
            <Route path="/entry" element={
              <div className="max-w-3xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                <ProjectCashFlowForecastingEntryForm onProjectAdded={() => window.location.href = '/'} />
              </div>
            } />
            <Route path="/analytics" element={
              <div className="animate-in zoom-in-95 duration-500">
                <ReportsAnalyticsDashboard />
              </div>
            } />
            <Route path="/payments" element={
              <div className="animate-in fade-in duration-500 h-auto">
                <PaymentBillingTracker />
              </div>
            } />
            <Route path="/project/:id" element={
              <div className="animate-in fade-in duration-500">
                <ProjectDetailView />
              </div>
            } />
            <Route path="/admin" element={
              user?.role === 'admin' ? (
                <div className="animate-in fade-in duration-500">
                  <AdminPanel />
                </div>
              ) : (
                <div className="text-rose-400">Access Denied</div>
              )
            } />
            <Route path="/login" element={
              isAuthenticated ? <Navigate to="/" /> : (
                <div className="animate-in fade-in duration-500">
                  <LoginView onLogin={handleLogin} />
                </div>
              )
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;
