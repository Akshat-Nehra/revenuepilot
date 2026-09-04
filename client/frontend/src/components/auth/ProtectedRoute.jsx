import React from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { ShieldAlert, ArrowLeft, Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center p-6 space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs font-medium">Verifying RevenuePilot security credentials...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Check role authorization
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center animate-fade-in">
        <div className="rounded-full p-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 mb-4 shadow-lg shadow-rose-950/40">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h3 className="text-xl font-bold text-white">403 — Access Restricted</h3>
        <p className="text-xs text-slate-400 max-w-md mt-2 mb-6 leading-relaxed">
          You do not have administrative permissions to view this section. Your current role is <span className="font-mono font-bold text-indigo-400">{user?.role}</span>.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-all border border-slate-700 shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    );
  }

  return children;
}
