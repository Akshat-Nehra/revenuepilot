import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Zap, Lock, Mail, Eye, EyeOff, Loader2, ShieldCheck, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage("Please provide both email and password.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setErrorMessage(err.message || "Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#070A12] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-purple-600/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative z-10 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-600/30 mb-2 border border-indigo-400/30">
            <Zap className="w-7 h-7 fill-current" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Revenue<span className="text-indigo-400">Pilot</span>
          </h1>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">
            AI Revenue Recovery Agent
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/80 p-6 sm:p-8 backdrop-blur-xl shadow-2xl shadow-indigo-950/40 glass-panel space-y-6">
          
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-lg font-bold text-white">Sign In to Dashboard</h2>
            <p className="text-xs text-slate-400 mt-0.5">Enter your credentials to access revenue operations</p>
          </div>

          {/* Error Alert */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3.5 flex items-start gap-3 text-xs text-rose-300 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@revenuepilot.ai"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to RevenuePilot
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials Fill Helper */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block text-center">
              ⚡ Quick Demo Credentials (For Evaluation)
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => handleQuickFill("admin@revenuepilot.ai", "Admin@123456")}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="font-bold text-white text-[11px]">ADMIN</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">admin@revenuepilot.ai</p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill("employee@revenuepilot.ai", "Employee@123456")}
                className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-indigo-500/40 text-left transition-all group"
              >
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  <span className="font-bold text-white text-[11px]">EMPLOYEE</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5 truncate">employee@revenuepilot.ai</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer Security Badge */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Secure Revenue Operations Platform • JWT & RBAC Protected</span>
        </div>

      </div>
    </div>
  );
}
