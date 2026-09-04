import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { 
  LayoutDashboard, 
  Receipt, 
  RotateCcw, 
  BrainCircuit, 
  FileText, 
  BarChart3, 
  Users,
  Zap, 
  X
} from 'lucide-react';

export default function Sidebar({ systemStatus, isOpen, onClose }) {
  const { user, isAdmin } = useAuth();

  const navItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Transactions', path: '/transactions', icon: Receipt },
    { label: 'Recovery', path: '/recovery', icon: RotateCcw },
    { label: 'AI Decisions', path: '/ai-decisions', icon: BrainCircuit },
    { label: 'Audit Log', path: '/audit-log', icon: FileText },
    { label: 'Metrics', path: '/metrics', icon: BarChart3 },
    ...(isAdmin ? [{ label: 'User Management', path: '/admin/users', icon: Users }] : []),
  ];

  const isConnected = systemStatus?.backendConnected && !systemStatus?.isDemoMode;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside className={`fixed top-0 left-0 z-40 h-screen w-64 border-r border-slate-800/80 bg-[#0B0F19] transition-transform duration-300 ease-in-out flex flex-col justify-between ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div>
          {/* Brand Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-lg shadow-indigo-500/25">
                <Zap className="w-5 h-5 fill-current" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              </div>
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white font-sans flex items-center gap-1">
                  Revenue<span className="text-indigo-400">Pilot</span>
                </h1>
                <p className="text-[11px] font-medium text-slate-400 tracking-wide">AI Revenue Recovery</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="lg:hidden rounded-lg p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-md shadow-indigo-950/40'
                        : 'text-slate-400 hover:bg-slate-900/60 hover:text-slate-200'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Bottom System Status Widget */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-3 space-y-2 text-[11px]">
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] block border-b border-slate-800/80 pb-1.5">
              System Status
            </span>

            {/* Backend API Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Backend API</span>
              {isConnected ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  Connected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-amber-400 font-medium" title="Backend unreachable, using local fallback">
                  <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                  Offline (Demo)
                </span>
              )}
            </div>

            {/* Razorpay Integration Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Razorpay</span>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Configured
              </span>
            </div>

            {/* AI Agent Status */}
            <div className="flex items-center justify-between">
              <span className="text-slate-400">AI Agent</span>
              <span className="inline-flex items-center gap-1.5 text-indigo-400 font-medium">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping"></span>
                Ready
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
