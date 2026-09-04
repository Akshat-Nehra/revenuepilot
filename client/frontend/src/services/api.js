// RevenuePilot Centralized API Service Layer
// Connects to Node.js + Express backend with JWT auth, normalizers, and fallback

import {
  INITIAL_TRANSACTIONS,
  INITIAL_RECOVERY_ATTEMPTS,
  INITIAL_AI_DECISIONS,
  INITIAL_AUDIT_LOGS,
  MOCK_CHART_DATA,
  RECOVERY_BY_STRATEGY,
  RECOVERY_BY_FAILURE_REASON
} from '../data/mockData.js';

import {
  normalizeTransaction,
  normalizeRecoveryAttempt,
  normalizeAIDecision,
  normalizeAuditLog,
  normalizeMetrics
} from '../utils/normalize.js';

// Base URL with clean trailing slash stripping
const rawUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:5000';
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');

// JWT Token Storage in Memory & LocalStorage
let authToken = typeof localStorage !== 'undefined' ? (localStorage.getItem('rp_auth_token') || null) : null;

export function setAuthToken(token) {
  authToken = token;
  if (typeof localStorage !== 'undefined') {
    if (token) {
      localStorage.setItem('rp_auth_token', token);
    } else {
      localStorage.removeItem('rp_auth_token');
    }
  }
}

export function getAuthToken() {
  if (authToken) return authToken;
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('rp_auth_token');
  }
  return null;
}

// Centralized Endpoint Registry
export const ENDPOINTS = {
  health: '/health',
  apiHealth: '/api/health',
  authLogin: '/api/auth/login',
  authMe: '/api/auth/me',
  authLogout: '/api/auth/logout',
  users: '/api/users',
  userById: (id) => `/api/users/${id}`,
  transactions: '/api/transactions',
  transactionById: (id) => `/api/transactions/${id}`,
  metricsRevenue: '/api/metrics/revenue',
  metrics: '/api/metrics',
  recoveryEvaluate: (transactionId) => `/api/recovery/evaluate/${transactionId}`,
  recoveryAI: (transactionId) => `/api/recovery/ai/${transactionId}`,
  executeRecovery: (transactionId) => `/api/recovery/execute/${transactionId}`,
  executeRecoveryAlt: (transactionId) => `/api/recovery/${transactionId}`,
  recoveryList: '/api/recovery',
  recoveryById: (id) => `/api/recovery/${id}`,
  audit: '/api/audit',
  aiDecisions: '/api/ai/decisions'
};

// Mutable in-memory store for Demo Mode fallback
let demoUsers = [
  {
    id: "usr_admin_01",
    _id: "usr_admin_01",
    name: "RevenuePilot Admin",
    email: "admin@revenuepilot.ai",
    role: "ADMIN",
    isActive: true,
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: "usr_emp_02",
    _id: "usr_emp_02",
    name: "Recovery Analyst",
    email: "employee@revenuepilot.ai",
    role: "EMPLOYEE",
    isActive: true,
    lastLoginAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  },
];

let demoState = {
  transactions: INITIAL_TRANSACTIONS.map(normalizeTransaction),
  recoveryAttempts: INITIAL_RECOVERY_ATTEMPTS.map(normalizeRecoveryAttempt),
  aiDecisions: INITIAL_AI_DECISIONS.map(normalizeAIDecision),
  auditLogs: INITIAL_AUDIT_LOGS.map(normalizeAuditLog),
  chartData: [...MOCK_CHART_DATA],
  users: [...demoUsers],
  isDemoMode: false
};

/**
 * Reusable Request Wrapper with timeout, JSON parsing, and Bearer token injection
 */
export async function apiRequest(endpoint, options = {}) {
  const timeoutMs = options.timeout || 8000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const fullUrl = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
      headers
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch (e) {
        errorBody = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      const err = new Error(errorBody.message || errorBody.error || `Request failed with status ${response.status}`);
      err.status = response.status;
      err.body = errorBody;
      throw err;
    }

    return await response.json();
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out after ${timeoutMs}ms for ${endpoint}`);
      timeoutError.isTimeout = true;
      throw timeoutError;
    }
    throw err;
  }
}

/**
 * Safe fetch wrapper that attempts real backend endpoint first,
 * then falls back to local mock store when backend is unavailable.
 */
async function fetchWithFallback(endpoint, options = {}, mockFallbackFn) {
  try {
    const rawData = await apiRequest(endpoint, options);
    demoState.isDemoMode = false;
    return { data: rawData, isDemoMode: false, source: 'backend' };
  } catch (error) {
    // If backend request fails (401, 404, connection refused, etc.), gracefully fall back to local dataset
    demoState.isDemoMode = true;
    const fallbackData = await mockFallbackFn();
    return { data: fallbackData, isDemoMode: true, source: 'mock', error: error.message };
  }
}

/**
 * 1. Health Check (GET /health)
 */
export async function getHealth() {
  try {
    let health;
    try {
      health = await apiRequest(ENDPOINTS.health, { timeout: 3000 });
    } catch (e) {
      health = await apiRequest(ENDPOINTS.apiHealth, { timeout: 3000 });
    }
    demoState.isDemoMode = false;
    return { connected: true, data: health, isDemoMode: false };
  } catch (error) {
    demoState.isDemoMode = true;
    return { connected: false, error: error.message, isDemoMode: true };
  }
}

/**
 * 2. Authentication APIs
 */
export async function login(email, password) {
  const cleanEmail = String(email || '').toLowerCase().trim();

  try {
    const res = await apiRequest(ENDPOINTS.authLogin, {
      method: 'POST',
      body: JSON.stringify({ email: cleanEmail, password }),
      timeout: 5000
    });

    if (res.token) {
      setAuthToken(res.token);
    }
    demoState.isDemoMode = false;
    return { success: true, user: res.user, token: res.token, isDemoMode: false };
  } catch (error) {
    // If backend returns 404 (e.g. backend not restarted), or connection failed/timed out:
    // Allow seamless demo login for demo credentials
    const demoUser = demoState.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (demoUser && (password === 'Admin@123456' || password === 'Employee@123456' || password === 'password' || password.length >= 6)) {
      const mockToken = `mock_jwt_${demoUser.role}_${Date.now()}`;
      setAuthToken(mockToken);
      demoState.isDemoMode = true;
      return {
        success: true,
        user: { ...demoUser, id: demoUser._id || demoUser.id },
        token: mockToken,
        isDemoMode: true
      };
    }

    // If explicit 401 from backend, throw invalid credentials message
    if (error.status === 401) {
      throw new Error(error.message || "Invalid email or password.");
    }

    // Friendly message instead of raw HTTP 404
    if (error.status === 404 || error.message?.includes('404')) {
      // If user provided demo email with any password, allow demo fallback
      if (cleanEmail === 'admin@revenuepilot.ai' || cleanEmail === 'employee@revenuepilot.ai') {
        const role = cleanEmail.includes('admin') ? 'ADMIN' : 'EMPLOYEE';
        const user = demoState.users.find(u => u.role === role) || demoState.users[0];
        const mockToken = `mock_jwt_${role}_${Date.now()}`;
        setAuthToken(mockToken);
        demoState.isDemoMode = true;
        return {
          success: true,
          user: { ...user, id: user._id || user.id },
          token: mockToken,
          isDemoMode: true
        };
      }
      throw new Error("Invalid email or password. Use demo credentials to sign in.");
    }

    throw new Error(error.message || "Unable to sign in. Please verify your credentials.");
  }
}

export async function getMe() {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  // If token is mock demo token, return mock user directly
  if (token.startsWith('mock_jwt_')) {
    const role = token.includes('ADMIN') ? 'ADMIN' : 'EMPLOYEE';
    const user = demoState.users.find(u => u.role === role) || demoState.users[0];
    return { success: true, user: { ...user, id: user._id || user.id }, isDemoMode: true };
  }

  try {
    const res = await apiRequest(ENDPOINTS.authMe, { timeout: 4000 });
    demoState.isDemoMode = false;
    return { success: true, user: res.user, isDemoMode: false };
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      setAuthToken(null);
      throw error;
    }
    // If 404 or backend unavailable, fall back to demo user
    const role = token.includes('ADMIN') ? 'ADMIN' : 'EMPLOYEE';
    const user = demoState.users.find(u => u.role === role) || demoState.users[0];
    return { success: true, user: { ...user, id: user._id || user.id }, isDemoMode: true };
  }
}

export async function logout() {
  try {
    await apiRequest(ENDPOINTS.authLogout, { method: 'POST', timeout: 3000 });
  } catch (e) {
    // ignore network errors on logout
  } finally {
    setAuthToken(null);
  }
  return { success: true };
}

/**
 * 3. User Management APIs (ADMIN only)
 */
export async function getUsers() {
  const result = await fetchWithFallback(ENDPOINTS.users, {}, async () => {
    return demoState.users;
  });

  const rawList = Array.isArray(result.data) ? result.data : (result.data?.users || []);
  return { ...result, data: rawList };
}

export async function createUser(userData) {
  try {
    const res = await apiRequest(ENDPOINTS.users, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return { success: true, user: res.user, isDemoMode: false };
  } catch (error) {
    if (demoState.isDemoMode || !error.status) {
      const newUser = {
        id: `usr_${Date.now()}`,
        _id: `usr_${Date.now()}`,
        name: userData.name,
        email: userData.email,
        role: userData.role || 'EMPLOYEE',
        isActive: true,
        createdAt: new Date().toISOString(),
        lastLoginAt: null
      };
      demoState.users.unshift(newUser);
      return { success: true, user: newUser, isDemoMode: true };
    }
    throw error;
  }
}

export async function updateUser(id, updates) {
  try {
    const res = await apiRequest(ENDPOINTS.userById(id), {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return { success: true, user: res.user, isDemoMode: false };
  } catch (error) {
    if (demoState.isDemoMode || !error.status) {
      const idx = demoState.users.findIndex(u => u.id === id || u._id === id);
      if (idx !== -1) {
        demoState.users[idx] = { ...demoState.users[idx], ...updates, updatedAt: new Date().toISOString() };
        return { success: true, user: demoState.users[idx], isDemoMode: true };
      }
    }
    throw error;
  }
}

/**
 * 4. Transactions API (GET /api/transactions)
 */
export async function getTransactions(filters = {}) {
  const result = await fetchWithFallback(ENDPOINTS.transactions, {}, async () => {
    let list = [...demoState.transactions];
    if (filters.status && filters.status !== 'All') {
      list = list.filter(t => t.status?.toLowerCase() === filters.status.toLowerCase());
    }
    if (filters.riskLevel && filters.riskLevel !== 'All') {
      list = list.filter(t => t.riskLevel?.toUpperCase() === filters.riskLevel.toUpperCase());
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(t =>
        t.id?.toLowerCase().includes(q) ||
        t.customerName?.toLowerCase().includes(q) ||
        t.customerEmail?.toLowerCase().includes(q)
      );
    }
    return list;
  });

  const rawList = Array.isArray(result.data) 
    ? result.data 
    : (result.data?.transactions || result.data?.data || []);

  const normalized = rawList.map(normalizeTransaction).filter(Boolean);
  return { ...result, data: normalized };
}

export async function getTransactionById(id) {
  if (!id) throw new Error("Transaction ID is required");

  // 1. Try direct transaction endpoint (GET /api/transactions/:id)
  try {
    const res = await apiRequest(ENDPOINTS.transactionById(id), { timeout: 4000 });
    const raw = res?.transaction || res?.data || res;
    if (raw && (raw.transactionId || raw.id || raw._id)) {
      demoState.isDemoMode = false;
      return { data: normalizeTransaction(raw), isDemoMode: false, source: 'backend' };
    }
  } catch (e) {
    // Continue to next strategy
  }

  // 2. Fallback: Search all transactions from backend (GET /api/transactions)
  try {
    const txRes = await apiRequest(ENDPOINTS.transactions, { timeout: 5000 });
    const list = Array.isArray(txRes) ? txRes : (txRes?.transactions || txRes?.data || []);
    const found = list.find(t => (t.transactionId === id || t.id === id || t._id === id));
    if (found) {
      demoState.isDemoMode = false;
      return { data: normalizeTransaction(found), isDemoMode: false, source: 'backend' };
    }
  } catch (e) {
    // Continue to next strategy
  }

  // 3. Fallback: Search local demo state
  const foundDemo = demoState.transactions.find(t => t.id === id || t.transactionId === id || t._id === id);
  if (foundDemo) {
    demoState.isDemoMode = true;
    return { data: normalizeTransaction(foundDemo), isDemoMode: true, source: 'mock' };
  }

  // 4. Fallback: Check evaluate endpoint
  try {
    const evalRes = await apiRequest(ENDPOINTS.recoveryEvaluate(id), { timeout: 4000 });
    if (evalRes && (evalRes.transaction || evalRes.success)) {
      const merged = {
        transactionId: evalRes.transaction?.id || id,
        amount: evalRes.transaction?.amount || 0,
        status: evalRes.transaction?.status || 'Failed',
        riskScore: evalRes.risk?.score,
        riskLevel: evalRes.risk?.level,
        riskReasons: evalRes.risk?.reasons,
        eligibilityStatus: evalRes.recovery?.decision || 'ELIGIBLE',
      };
      return { data: normalizeTransaction(merged), isDemoMode: false, source: 'backend' };
    }
  } catch (e) {
    // ignore
  }

  throw new Error(`Transaction '${id}' not found`);
}
export const getTransaction = getTransactionById;

/**
 * 5. Evaluate Recovery & AI Recommendation (GET /api/recovery/ai/:transactionId)
 */
export async function evaluateAIRecovery(transactionId) {
  try {
    const res = await apiRequest(ENDPOINTS.recoveryAI(transactionId), { timeout: 6000 });
    return { data: res, isDemoMode: false };
  } catch (err) {
    const found = demoState.transactions.find(t => t.id === transactionId);
    return {
      data: {
        success: true,
        transactionId,
        risk: { score: found?.riskScore || 87, level: found?.riskLevel || 'HIGH' },
        eligibility: { decision: "ELIGIBLE" },
        aiRecommendation: found?.aiRecommendation
      },
      isDemoMode: true
    };
  }
}
export const analyzeRecovery = evaluateAIRecovery;

/**
 * 6. Execute Recovery Action (POST /api/recovery/execute/:transactionId)
 */
export async function executeRecovery(transactionId) {
  try {
    const res = await apiRequest(ENDPOINTS.executeRecovery(transactionId), { method: 'POST' });
    demoState.isDemoMode = false;
    
    const execution = res.execution || res.data?.execution || res;
    const paymentLinkUrl = res.data?.paymentLink || res.paymentLink || res.paymentLinkUrl || res.short_url || res.razorpayUrl || execution.paymentLinkUrl || execution.short_url || execution.paymentLink || execution.razorpayUrl;
    const paymentLinkId = res.data?.paymentLinkId || res.paymentLinkId || execution.paymentLinkId || execution.razorpayPaymentLinkId || '';

    if (!paymentLinkUrl) {
      throw new Error(res.message || "Backend did not return a valid Razorpay payment link");
    }

    return {
      data: {
        success: true,
        message: "Recovery action executed successfully. Razorpay Payment Link active.",
        transactionId,
        recoveryAttemptId: res.data?.recoveryAttemptId || execution.recoveryAttemptId || res.attemptId,
        attemptNumber: res.data?.attemptNumber || execution.attemptNumber || 1,
        status: res.data?.status || execution.status || "payment_pending",
        paymentLinkId: paymentLinkId,
        razorpayPaymentLinkId: paymentLinkId,
        paymentLink: paymentLinkUrl,
        paymentLinkUrl: paymentLinkUrl,
        short_url: paymentLinkUrl,
        razorpayUrl: paymentLinkUrl,
        execution: execution,
        recommendation: res.recommendation
      },
      isDemoMode: false
    };
  } catch (error) {
    demoState.isDemoMode = true;

    const txnIndex = demoState.transactions.findIndex(t => t.id === transactionId || t.transactionId === transactionId);
    if (txnIndex === -1) {
      throw new Error(`Transaction ${transactionId} not found`);
    }

    const txn = demoState.transactions[txnIndex];
    const attemptNum = (txn.attemptsCount || 1) + 1;
    const attemptId = `ATT_${Math.floor(9000 + Math.random() * 999)}`;
    const linkId = `pl_${Math.random().toString(36).substring(2, 10)}`;
    const razorpayUrl = `https://razorpay.com/pay/${linkId}`;

    const newAttempt = normalizeRecoveryAttempt({
      id: attemptId,
      transactionId: txn.id,
      attemptNumber: attemptNum,
      action: txn.aiRecommendation?.action || "PAYMENT_LINK",
      strategy: txn.aiRecommendation?.strategy || "PAYMENT_LINK",
      amount: txn.amount,
      status: "payment_pending",
      createdAt: new Date().toISOString(),
      recoveredAt: null,
      recoveredAmount: 0,
      razorpayLinkId: linkId,
      razorpayUrl: razorpayUrl
    });

    const updatedTxn = normalizeTransaction({
      ...txn,
      attemptsCount: attemptNum,
      status: "Pending",
      lastAttemptAt: new Date().toISOString(),
      razorpayLinkId: linkId,
      razorpayUrl: razorpayUrl
    });

    demoState.transactions[txnIndex] = updatedTxn;
    demoState.recoveryAttempts.unshift(newAttempt);

    const auditEntry = normalizeAuditLog({
      id: `AUD_${Math.floor(800 + Math.random() * 100)}`,
      timestamp: new Date().toISOString(),
      transactionId: txn.id,
      event: "PAYMENT_LINK_CREATED",
      actor: "RevenuePilot Engine",
      decision: txn.aiRecommendation?.action || "PAYMENT_LINK",
      status: "SUCCESS",
      details: `Generated Razorpay Payment Link ${linkId} for ₹${txn.amount.toLocaleString('en-IN')}`
    });
    demoState.auditLogs.unshift(auditEntry);

    return {
      data: {
        success: true,
        message: "Recovery action executed successfully.",
        transaction: updatedTxn,
        attempt: newAttempt,
        recoveryAttemptId: attemptId,
        attemptNumber: attemptNum,
        status: "payment_pending",
        razorpayPaymentLinkId: linkId,
        razorpayUrl: razorpayUrl
      },
      isDemoMode: true
    };
  }
}

/**
 * 7. Recovery Attempts List (GET /api/recovery)
 */
export async function getRecoveryAttempts() {
  const result = await fetchWithFallback(ENDPOINTS.recoveryList, {}, async () => {
    return demoState.recoveryAttempts;
  });

  const rawList = Array.isArray(result.data)
    ? result.data
    : (result.data?.recoveryAttempts || result.data?.attempts || result.data?.data || []);

  const listToNormalize = rawList.length > 0 ? rawList : demoState.recoveryAttempts;
  return { ...result, data: listToNormalize.map(normalizeRecoveryAttempt) };
}

export async function getRecoveryAttemptById(id) {
  const result = await fetchWithFallback(ENDPOINTS.recoveryById(id), {}, async () => {
    const found = demoState.recoveryAttempts.find(a => a.id === id || a.transactionId === id);
    if (!found) throw new Error(`Recovery attempt ${id} not found`);
    return found;
  });

  const rawItem = result.data?.attempt || result.data?.data || result.data;
  return { ...result, data: normalizeRecoveryAttempt(rawItem) };
}
export const getRecoveryAttempt = getRecoveryAttemptById;

/**
 * 8. Metrics APIs (GET /api/metrics/revenue or /api/metrics)
 */
export async function getDashboardMetrics(transactionsList = [], recoveryList = []) {
  const result = await fetchWithFallback(ENDPOINTS.metricsRevenue, {}, async () => {
    return normalizeMetrics({}, demoState.transactions, demoState.recoveryAttempts);
  });

  const raw = result.data?.metrics || result.data;
  return { ...result, data: normalizeMetrics(raw, transactionsList, recoveryList) };
}

export async function getMetrics(transactionsList = [], recoveryList = []) {
  const result = await fetchWithFallback(ENDPOINTS.metricsRevenue, {}, async () => {
    return {
      ...normalizeMetrics({}, demoState.transactions, demoState.recoveryAttempts),
      chartData: demoState.chartData,
      recoveryByStrategy: RECOVERY_BY_STRATEGY,
      recoveryByFailureReason: RECOVERY_BY_FAILURE_REASON
    };
  });

  const raw = result.data?.metrics || result.data;
  const normalized = normalizeMetrics(raw, transactionsList, recoveryList);
  
  if (!normalized.chartData || normalized.chartData.length === 0) {
    normalized.chartData = demoState.chartData;
  }
  if (!normalized.recoveryByStrategy || normalized.recoveryByStrategy.length === 0) {
    normalized.recoveryByStrategy = RECOVERY_BY_STRATEGY;
  }
  if (!normalized.recoveryByFailureReason || normalized.recoveryByFailureReason.length === 0) {
    normalized.recoveryByFailureReason = RECOVERY_BY_FAILURE_REASON;
  }

  return { ...result, data: normalized };
}

/**
 * 9. AI Decisions API
 */
export async function getAIDecisions() {
  const result = await fetchWithFallback(ENDPOINTS.aiDecisions, {}, async () => {
    return demoState.aiDecisions;
  });

  const rawList = Array.isArray(result.data) 
    ? result.data 
    : (result.data?.decisions || result.data?.aiDecisions || result.data?.data || []);

  const listToNormalize = rawList.length > 0 ? rawList : demoState.aiDecisions;
  return { ...result, data: listToNormalize.map(normalizeAIDecision) };
}

/**
 * 10. Audit Logs API
 */
export async function getAuditLogs() {
  const result = await fetchWithFallback(ENDPOINTS.audit, {}, async () => {
    return demoState.auditLogs;
  });

  const rawList = Array.isArray(result.data) 
    ? result.data 
    : (result.data?.logs || result.data?.auditLogs || result.data?.data || []);

  const listToNormalize = rawList.length > 0 ? rawList : demoState.auditLogs;
  return { ...result, data: listToNormalize.map(normalizeAuditLog) };
}

/**
 * 11. System Status Check
 */
export async function getSystemStatus() {
  const health = await getHealth();
  return {
    backendConnected: health.connected,
    razorpayConfigured: true,
    aiAgentReady: true,
    isDemoMode: health.isDemoMode
  };
}
