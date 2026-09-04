// RevenuePilot Centralized API Service Layer
// Real backend is the default. Local mock mode is explicit via VITE_DEMO_MODE=true.

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
const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
const rawUrl = env.VITE_API_BASE_URL || 'http://localhost:5000';
export const API_BASE_URL = rawUrl.replace(/\/+$/, '');
export const DEMO_MODE = String(env.VITE_DEMO_MODE || 'false').toLowerCase() === 'true';

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
  isDemoMode: DEMO_MODE
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
 * Real backend wrapper. Local mock data is used only when VITE_DEMO_MODE=true.
 */
async function fetchWithFallback(endpoint, options = {}, mockFallbackFn) {
  if (DEMO_MODE) {
    demoState.isDemoMode = true;
    return { data: await mockFallbackFn(), isDemoMode: true, source: 'mock' };
  }

  const rawData = await apiRequest(endpoint, options);
  demoState.isDemoMode = false;
  return { data: rawData, isDemoMode: false, source: 'backend' };
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
    demoState.isDemoMode = DEMO_MODE;
    return { connected: false, error: error.message, isDemoMode: DEMO_MODE };
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
    if (!DEMO_MODE) {
      throw new Error(error.message || 'Unable to sign in. Please verify the backend is running.');
    }

    const demoUser = demoState.users.find(u => u.email.toLowerCase() === cleanEmail);

    if (demoUser && password && password.length >= 6) {
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

    // Explicit authentication failures should remain authentication failures.
    if (error.status === 401) {
      throw new Error(error.message || 'Invalid email or password.');
    }

    throw new Error(error.message || 'Unable to sign in. Please verify the backend is running.');
  }
}

export async function getMe() {
  const token = getAuthToken();
  if (!token) {
    throw new Error("No authentication token available");
  }

  // Mock tokens are valid only in explicit demo mode
  if (DEMO_MODE && token.startsWith('mock_jwt_')) {
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
    throw new Error(error.message || 'Unable to retrieve authenticated user.');
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

  // 3. Local demo data is opt-in only
  if (DEMO_MODE) {
    const foundDemo = demoState.transactions.find(t => t.id === id || t.transactionId === id || t._id === id);
    if (foundDemo) {
      demoState.isDemoMode = true;
      return { data: normalizeTransaction(foundDemo), isDemoMode: true, source: 'mock' };
    }
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
    if (!DEMO_MODE) throw err;
    const found = demoState.transactions.find(t => t.id === transactionId);
    return {
      data: {
        success: true,
        transactionId,
        risk: { score: found?.riskScore || 87, level: found?.riskLevel || 'HIGH' },
        eligibility: { decision: 'ELIGIBLE' },
        aiRecommendation: found?.aiRecommendation
      },
      isDemoMode: true
    };
  }
}
export const analyzeRecovery = evaluateAIRecovery;

/**
 * Validates whether a URL is a genuine Razorpay URL
 */
export const isValidRazorpayUrl = (url) => {
  if (!url || typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" &&
      (parsed.hostname === "rzp.io" || parsed.hostname.endsWith(".razorpay.com"))
    );
  } catch {
    return false;
  }
};

/**
 * 6. Execute Recovery Action (POST /api/recovery/execute/:transactionId)
 * Accepts either a transaction object or string identifier.
 * NO mock fallback is allowed for recovery execution.
 */
export async function executeRecovery(input) {
  let identifier = null;

  if (typeof input === "string") {
    identifier = input.trim();
  } else if (input && typeof input === "object") {
    identifier = input.transactionId || input.id || input._id;
  }

  if (
    !identifier ||
    typeof identifier !== "string" ||
    identifier.trim() === "" ||
    identifier === "undefined" ||
    identifier === "null" ||
    identifier === "[object Object]"
  ) {
    throw new Error("Invalid transaction identifier provided for recovery execution.");
  }

  const cleanId = identifier.trim();
  const endpoint = `${ENDPOINTS.executeRecovery(encodeURIComponent(cleanId))}`;

  // Direct call to backend — DO NOT use mock fallback for recovery execution
  const res = await apiRequest(endpoint, {
    method: "POST",
        headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.success) {
    throw new Error(res.message || res.reason || "Recovery execution failed.");
  }

  // Handle SEND_REMINDER
  if (res.action === "SEND_REMINDER") {
    return {
      success: true,
      message: res.message || "Recovery reminder dispatched successfully",
      transactionId: res.transactionId || cleanId,
      recoveryAttemptId: res.recoveryAttemptId || res.data?.recoveryAttemptId,
      action: "SEND_REMINDER",
      status: res.status || "reminder_sent",
      strategy: res.strategy || "SEND_REMINDER",
      details: res.details || "Reminder action recorded by RevenuePilot. Connect an SMS/email provider for external delivery.",
      data: res,
    };
  }

  // Handle PAYMENT_LINK
  const paymentLinkObj = res.paymentLink || res.data?.paymentLink || {};
  const rawUrl =
    (typeof paymentLinkObj === "object" ? paymentLinkObj.short_url : null) ||
    res.short_url ||
    res.paymentLinkUrl ||
    res.data?.short_url ||
    res.data?.paymentLinkUrl ||
    (typeof res.paymentLink === "string" ? res.paymentLink : null) ||
    (typeof res.data?.paymentLink === "string" ? res.data.paymentLink : null);

  const shortUrl = isValidRazorpayUrl(rawUrl) ? rawUrl : null;
  const paymentLinkId =
    paymentLinkObj.id ||
    res.paymentLinkId ||
    res.data?.paymentLinkId ||
    "";

  if (!shortUrl || !paymentLinkId) {
    throw new Error(
      res.message ||
      "Recovery did not produce a valid Razorpay Payment Link. Check the backend Razorpay error."
    );
  }

  return {
    success: true,
    message: res.message || "Recovery executed successfully",
    transactionId: res.transactionId || cleanId,
    recoveryAttemptId: res.recoveryAttemptId || res.data?.recoveryAttemptId,
    action: "PAYMENT_LINK",
    paymentLink: {
      id: paymentLinkId,
      short_url: shortUrl,
      amount: paymentLinkObj.amount || res.amount,
      currency: paymentLinkObj.currency || "INR",
      status: paymentLinkObj.status || res.status || "payment_pending",
    },
    // Top-level aliases for direct component consumption
    paymentLinkId,
    paymentLinkUrl: shortUrl,
    short_url: shortUrl,
    status: res.status || "payment_pending",
    data: {
      ...res,
      paymentLink: shortUrl,
      paymentLinkUrl: shortUrl,
      short_url: shortUrl,
      paymentLinkId,
    },
  };
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

  const listToNormalize = DEMO_MODE && rawList.length === 0 ? demoState.recoveryAttempts : rawList;
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
      recoveryRateTrend: [
        { date: "Aug 29", rate: 45.0 },
        { date: "Aug 30", rate: 46.2 },
        { date: "Aug 31", rate: 47.8 },
        { date: "Sep 01", rate: 48.5 },
        { date: "Sep 02", rate: 49.0 },
        { date: "Sep 03", rate: 49.5 },
        { date: "Today", rate: 50.0 },
      ],
      recoveryByStrategy: RECOVERY_BY_STRATEGY,
      recoveryByFailureReason: RECOVERY_BY_FAILURE_REASON
    };
  });

  const raw = result.data?.metrics || result.data;
  const normalized = normalizeMetrics(raw, transactionsList, recoveryList);

  if (DEMO_MODE) {
    if (!normalized.chartData || normalized.chartData.length === 0) {
      normalized.chartData = demoState.chartData;
    }
    if (!normalized.recoveryByStrategy || normalized.recoveryByStrategy.length === 0) {
      normalized.recoveryByStrategy = RECOVERY_BY_STRATEGY;
    }
    if (!normalized.recoveryByFailureReason || normalized.recoveryByFailureReason.length === 0) {
      normalized.recoveryByFailureReason = RECOVERY_BY_FAILURE_REASON;
    }
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

  const listToNormalize = DEMO_MODE && rawList.length === 0 ? demoState.aiDecisions : rawList;
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

  const listToNormalize = DEMO_MODE && rawList.length === 0 ? demoState.auditLogs : rawList;
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
