import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Search, Bell, Menu, RotateCw, X, LogOut, Users, Sparkles, ChevronDown, Shield } from 'lucide-react';

export default function TopNavbar({ onToggleSidebar, isDemoMode, onRefresh, isRefreshing }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/transactions?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Generate User Initials
  const getInitials = (name) => {
    if (!name) return 'RP';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const sampleNotifications = [
    { id: 1, text: "Recovery attempt #1 executed for TXN_00487 (Rahul Sharma)", time: "Just now", type: "action" },
    { id: 2, text: "Payment of ₹12,400 recovered from Priya Singh via Razorpay webhook", time: "1h ago", type: "success" },
    { id: 3, text: "Guardrail safety check evaluated 5 at-risk transactions", time: "2h ago", type: "ai" }
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 md:px-8 border-b border-slate-800/80 bg-[#0B0F19]/90 backdrop-blur-md">
      
      {/* Left side: Hamburger + Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="text-white font-bold">RevenuePilot</span>
          <span>/</span>
          <span className="text-slate-300">AI Recovery Dashboard</span>
        </div>
      </div>

      {/* Center: Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transactions, customer name, email..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
        </div>
      </form>

      {/* Right side: Live/Demo Mode, Refresh, Notifications, Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        
        {/* Live Mode vs Demo Mode Badge */}
        {!isDemoMode ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE MODE
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950/30">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            DEMO MODE
          </span>
        )}

        {/* Refresh Control */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:border-slate-700 transition-colors disabled:opacity-50"
            title="Refresh All Data from Backend"
          >
            <RotateCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        )}

        {/* AI Agent Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold shadow-sm shadow-indigo-950/40">
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>AI Agent Active</span>
        </div>

        {/* Notifications Button & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl border border-slate-800 bg-slate-900/60 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-800 bg-[#0B0F19] p-4 shadow-2xl z-50 animate-fade-in">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold text-white">Live System Notifications</span>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto">
                {sampleNotifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
                    <p className="text-slate-200 leading-snug">{n.text}</p>
                    <span className="text-[10px] text-slate-500 block">{n.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Dynamic User Profile Avatar & Dropdown */}
        <div className="relative pl-2 border-l border-slate-800" ref={dropdownRef}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-800/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-md shadow-indigo-600/30">
              {getInitials(user?.name)}
            </div>
            <div className="hidden xl:block text-left text-xs">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-white leading-tight">{user?.name || 'RevenuePilot User'}</p>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
              <p className="text-[10px] text-slate-400">{user?.email || 'user@revenuepilot.ai'}</p>
            </div>
          </button>

          {/* User Profile Dropdown */}
          {showUserDropdown && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl border border-slate-800 bg-[#0B0F19] p-3 shadow-2xl z-50 animate-fade-in space-y-2 text-xs">
              <div className="p-2 border-b border-slate-800/80">
                <p className="font-bold text-white text-sm">{user?.name}</p>
                <p className="text-slate-400 text-xs font-mono truncate">{user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isAdmin
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  }`}>
                    {user?.role}
                  </span>
                  <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active Session
                  </span>
                </div>
              </div>

              {isAdmin && (
                <Link
                  to="/admin/users"
                  onClick={() => setShowUserDropdown(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>User Management</span>
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-400 hover:bg-rose-500/10 transition-colors font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
