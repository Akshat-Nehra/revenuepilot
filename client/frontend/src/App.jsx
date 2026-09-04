import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import Sidebar from './components/layout/Sidebar.jsx';
import TopNavbar from './components/layout/TopNavbar.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TransactionsPage from './pages/TransactionsPage.jsx';
import TransactionDetailPage from './pages/TransactionDetailPage.jsx';
import RecoveryPage from './pages/RecoveryPage.jsx';
import AIDecisionsPage from './pages/AIDecisionsPage.jsx';
import AuditLogPage from './pages/AuditLogPage.jsx';
import MetricsPage from './pages/MetricsPage.jsx';
import UserManagementPage from './pages/UserManagementPage.jsx';
import TransactionDetailModal from './components/transactions/TransactionDetailModal.jsx';
import ExecutionModal from './components/common/ExecutionModal.jsx';
import Toast from './components/common/Toast.jsx';

import {
  getTransactions,
  getDashboardMetrics,
  getRecoveryAttempts,
  getAIDecisions,
  getAuditLogs,
  getMetrics,
  getSystemStatus,
  executeRecovery,
  getHealth
} from './services/api.js';

import { formatCurrency } from './utils/formatters.js';

function MainAppShell() {
  const { isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Data states
  const [transactions, setTransactions] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [recoveryAttempts, setRecoveryAttempts] = useState([]);
  const [aiDecisions, setAiDecisions] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [systemStatus, setSystemStatus] = useState({ backendConnected: false, isDemoMode: false });

  // Modal & Toast states
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [executingTransaction, setExecutingTransaction] = useState(null);
  const [toast, setToast] = useState(null);

  // Polling tracking ref
  const pollingRef = useRef(null);
  const pollingStartTimeRef = useRef(null);
  const previousPendingAttemptsRef = useRef(new Map());

  const loadData = useCallback(async (showFullLoader = true) => {
    if (!isAuthenticated) return;
    if (showFullLoader) setLoading(true);
    else setIsRefreshing(true);
    setError(null);

    try {
      // 1. Fetch backend health & primary datasets concurrently
      const [healthRes, txRes, attRes] = await Promise.all([
        getHealth().catch(() => ({ connected: false, isDemoMode: true })),
        getTransactions().catch(() => ({ data: [] })),
        getRecoveryAttempts().catch(() => ({ data: [] }))
      ]);

      const txList = txRes.data || [];
      const attList = attRes.data || [];

      // Set primary transactions immediately so the UI is never blank
      setTransactions(txList);
      setRecoveryAttempts(attList);

      setSystemStatus({
        backendConnected: healthRes.connected,
        razorpayConfigured: true,
        aiAgentReady: true,
        isDemoMode: healthRes.isDemoMode || txRes.isDemoMode
      });

      // 2. Fetch metrics and logs using the fresh transaction/attempt list
      const [dashRes, aiRes, auditRes, metRes] = await Promise.all([
        getDashboardMetrics(txList, attList).catch(() => ({ data: null })),
        getAIDecisions().catch(() => ({ data: [] })),
        getAuditLogs().catch(() => ({ data: [] })),
        getMetrics(txList, attList).catch(() => ({ data: null }))
      ]);

      if (dashRes?.data) setDashboardMetrics(dashRes.data);
      if (aiRes?.data) setAiDecisions(aiRes.data);
      if (auditRes?.data) setAuditLogs(auditRes.data);
      if (metRes?.data) setMetrics(metRes.data);

      // Update pending tracking map
      attList.forEach(a => {
        if (a.status === 'payment_pending' || a.status === 'pending') {
          previousPendingAttemptsRef.current.set(a.id, a);
        }
      });

    } catch (err) {
      console.error("Error loading RevenuePilot data:", err);
      setError(err.message || "Failed to load backend data");
    } finally {
      if (showFullLoader) setLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated]);

  // Initial load on mount or auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadData(true);
    }
  }, [isAuthenticated, loadData]);

  // 5-second Polling for pending recovery attempts (Task 24)
  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    pollingStartTimeRef.current = Date.now();

    pollingRef.current = setInterval(async () => {
      // Check 2-minute max polling limit
      if (Date.now() - pollingStartTimeRef.current > 120000) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
        return;
      }

      try {
        const attRes = await getRecoveryAttempts();
        const currentAttempts = attRes.data || [];

        // Check if any previously pending attempt transitioned to recovered
        let newlyRecovered = null;
        for (const att of currentAttempts) {
          const wasPending = previousPendingAttemptsRef.current.has(att.id);
          if (wasPending && att.status === 'recovered') {
            newlyRecovered = att;
            previousPendingAttemptsRef.current.delete(att.id);
            break;
          }
        }

        if (newlyRecovered) {
          // Prominent Toast when recovered
          setToast({
            message: `🎉 ${formatCurrency(newlyRecovered.recoveredAmount || newlyRecovered.amount)} successfully recovered via Razorpay webhook!`,
            type: "success"
          });
          // Refresh all data
          loadData(false);
        } else {
          setRecoveryAttempts(currentAttempts);
        }

        // If no pending attempts left, stop polling
        const hasPending = currentAttempts.some(a => a.status === 'payment_pending' || a.status === 'pending');
        if (!hasPending) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      } catch (err) {
        console.warn("Polling status check skipped:", err.message);
      }
    }, 5000);
  }, [loadData]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  // Action Handler: Execute Recovery
  const handleConfirmExecution = async (transactionId) => {
    try {
      const result = await executeRecovery(transactionId);

      // Refresh data store
      await loadData(false);

      setToast({
        message: "Recovery action executed successfully. Razorpay Payment Link dispatched.",
        type: "success"
      });

      // Start 5-second polling to watch for payment completion webhook
      startPolling();

      return result.data || result;
    } catch (err) {
      setToast({
        message: err.message || "Failed to execute recovery action",
        type: "error"
      });
      throw err;
    }
  };

  const handleOpenDetailById = (txnId) => {
    const found = transactions.find(t => t.id === txnId || t.transactionId === txnId);
    if (found) {
      setSelectedTransaction(found);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-600 selection:text-white">
      
      {/* Sidebar */}
      <Sidebar
        systemStatus={systemStatus}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 min-h-screen">
        <TopNavbar
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          isDemoMode={systemStatus?.isDemoMode}
          onRefresh={() => loadData(false)}
          isRefreshing={isRefreshing}
        />

        <main className="flex-1 px-4 md:px-8 py-6 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <DashboardPage
                    metrics={dashboardMetrics}
                    transactions={transactions}
                    recoveryAttempts={recoveryAttempts}
                    loading={loading}
                    error={error}
                    onSelectTransaction={setSelectedTransaction}
                    onExecuteRecovery={setExecutingTransaction}
                    onRetry={() => loadData(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <TransactionsPage
                    transactions={transactions}
                    loading={loading}
                    error={error}
                    onSelectTransaction={setSelectedTransaction}
                    onExecuteRecovery={setExecutingTransaction}
                    onRetry={() => loadData(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/transactions/:id"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <TransactionDetailPage
                    onRecoveryExecuted={() => {
                      loadData(false);
                      startPolling();
                    }}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recovery"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <RecoveryPage
                    recoveryAttempts={recoveryAttempts}
                    loading={loading}
                    error={error}
                    onSelectTransaction={handleOpenDetailById}
                    onRetry={() => loadData(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-decisions"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <AIDecisionsPage
                    aiDecisions={aiDecisions}
                    loading={loading}
                    error={error}
                    onSelectTransaction={handleOpenDetailById}
                    onRetry={() => loadData(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/audit-log"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <AuditLogPage
                    auditLogs={auditLogs}
                    loading={loading}
                    error={error}
                    onRetry={() => loadData(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/metrics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'EMPLOYEE']}>
                  <MetricsPage
                    metrics={metrics}
                    loading={loading}
                    error={error}
                    onRetry={() => loadData(true)}
                  />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UserManagementPage />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>

      {/* Transaction Details Modal */}
      <TransactionDetailModal
        isOpen={!!selectedTransaction}
        onClose={() => setSelectedTransaction(null)}
        transaction={selectedTransaction}
        onExecuteRecovery={(txn) => {
          setSelectedTransaction(null);
          setExecutingTransaction(txn);
        }}
      />

      {/* Execution Confirmation & Razorpay Link Modal */}
      <ExecutionModal
        isOpen={!!executingTransaction}
        onClose={() => setExecutingTransaction(null)}
        transaction={executingTransaction}
        onConfirm={handleConfirmExecution}
      />

      {/* Toast Alerts */}
      <Toast
        message={toast?.message}
        type={toast?.type}
        onClose={() => setToast(null)}
      />

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<MainAppShell />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
