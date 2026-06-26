import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", cancelText = "Cancel" }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3 text-white">
            <div className="p-2 bg-blue-500/20 rounded-full">
              <AlertCircle className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold tracking-wide">{title}</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-300 text-sm mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button 
            onClick={onClose} 
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors text-sm font-medium"
          >
            {cancelText}
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }} 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors text-sm font-medium shadow-lg shadow-blue-500/20"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
