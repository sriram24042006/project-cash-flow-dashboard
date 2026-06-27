import React, { useEffect, useState } from 'react';
import { api } from '../api/client';
import { AlertTriangle, X } from 'lucide-react';

const AlertBanner = () => {
    const [alerts, setAlerts] = useState([]);
    
    // Load dismissed alerts from localStorage on initial render
    const [dismissedAlerts, setDismissedAlerts] = useState(() => {
        const saved = localStorage.getItem('dismissedCashFlowAlerts');
        return saved ? new Set(JSON.parse(saved)) : new Set();
    });

    useEffect(() => {
        const fetchAlerts = async () => {
            try {
                const response = await api.getSummaryReport();
                if (response.data.success && response.data.alerts) {
                    // Filter out alerts that have already been dismissed
                    const activeAlerts = response.data.alerts.filter(
                        a => !dismissedAlerts.has(`${a.project}-${a.message}`)
                    );
                    
                    // We only want to set state if the alerts have actually changed
                    // to prevent unnecessary re-renders, but for simplicity we'll just set it
                    setAlerts(activeAlerts);
                }
            } catch (error) {
                console.error("Failed to fetch alerts:", error);
            }
        };

        fetchAlerts();
        // Poll every 30 seconds for alerts
        const interval = setInterval(fetchAlerts, 30000);
        return () => clearInterval(interval);
    }, [dismissedAlerts]);

    const dismissAlert = (index) => {
        const alertToDismiss = alerts[index];
        const alertId = `${alertToDismiss.project}-${alertToDismiss.message}`;
        
        // Add to dismissed set and save to localStorage
        setDismissedAlerts(prev => {
            const newSet = new Set(prev);
            newSet.add(alertId);
            localStorage.setItem('dismissedCashFlowAlerts', JSON.stringify(Array.from(newSet)));
            return newSet;
        });

        // Remove from current view
        setAlerts(prev => prev.filter((_, i) => i !== index));
    };

    if (alerts.length === 0) return null;

    return (
        <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
            {alerts.map((alert, index) => (
                <div 
                    key={index} 
                    className="flex items-start p-4 bg-rose-500/90 backdrop-blur-md border border-rose-400 text-white shadow-lg rounded-xl animate-in slide-in-from-right-8 duration-300"
                >
                    <AlertTriangle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold text-sm tracking-wide mb-1">{alert.project}</p>
                        <p className="text-sm text-rose-100">{alert.message}</p>
                    </div>
                    <button 
                        onClick={() => dismissAlert(index)}
                        className="ml-3 shrink-0 p-1 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default AlertBanner;
