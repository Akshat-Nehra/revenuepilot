// RevenuePilot Realistic Fallback Mock Store
// All dates are dynamically computed from current time to ensure no future fake timestamps

const now = new Date();
const hoursAgo = (h) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();

export const INITIAL_TRANSACTIONS = [
  {
    id: "TXN_00487",
    customerName: "Rahul Sharma",
    customerEmail: "rahul.sharma@example.com",
    amount: 20532,
    failureReason: "Insufficient Funds",
    riskScore: 87,
    riskLevel: "HIGH",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: hoursAgo(2),
    status: "Pending",
    createdAt: hoursAgo(4),
    attemptsCount: 1,
    aiAnalysis: "Customer payment failed due to insufficient funds on recurring subscription. Customer has previously completed 4 successful payments and retains a high lifetime value. High probability of payment recovery via automated retry & payment link.",
    aiRecommendation: {
      action: "PAYMENT_RETRY",
      strategy: "PAYMENT_LINK",
      confidence: 87,
      urgency: "HIGH",
      reason: "Customer abandoned checkout due to transient balance issue and has high probability of completing payment after receiving direct SMS/WhatsApp Razorpay link."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Active plan, non-fraudulent account" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Failed within 48-hour recovery SLA" },
      { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt 1 of 3 allowed max" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Last attempt > 2 hours ago" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Amount ₹20,532 <= Max threshold ₹50,000" }
    ],
    razorpayLinkId: "pl_L01abc987xyz",
    razorpayUrl: "https://razorpay.com/pay/pl_L01abc987xyz"
  },
  {
    id: "TXN_00486",
    customerName: "Priya Singh",
    customerEmail: "priya.singh@techcorp.in",
    amount: 12400,
    failureReason: "Card Expired",
    riskScore: 61,
    riskLevel: "MEDIUM",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: hoursAgo(5),
    status: "Recovered",
    createdAt: hoursAgo(7),
    attemptsCount: 1,
    aiAnalysis: "Card expired during automated billing run. AI initiated automated reminder with updated card entry link. Customer updated card and paid immediately.",
    aiRecommendation: {
      action: "SEND_REMINDER",
      strategy: "PAYMENT_LINK",
      confidence: 92,
      urgency: "MEDIUM",
      reason: "Card expiration detected. Prompting card update link yields 92% recovery rate."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Valid subscription" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Within 24h of failure" },
      { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt 1 of 3" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Cleared" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Passed policy check" }
    ],
    razorpayLinkId: "pl_Pri876xyz123",
    razorpayUrl: "https://razorpay.com/pay/pl_Pri876xyz123"
  },
  {
    id: "TXN_00485",
    customerName: "Amit Kumar",
    customerEmail: "amit.k@designstudio.io",
    amount: 8900,
    failureReason: "Bank Server Down",
    riskScore: 89,
    riskLevel: "HIGH",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: hoursAgo(8),
    status: "Failed",
    createdAt: hoursAgo(11),
    attemptsCount: 2,
    aiAnalysis: "Bank gateway timeout occurred twice. Customer card issuer declined fallback attempt.",
    aiRecommendation: {
      action: "PAYMENT_LINK",
      strategy: "PAYMENT_LINK",
      confidence: 74,
      urgency: "HIGH",
      reason: "Issuing bank experienced downtime during scheduled collection. Recommended UPI / Netbanking alternative."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Valid account" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Within window" },
      { id: "g3", name: "Attempt limit not exceeded", status: "FAILED", detail: "Max retries reached for card route" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Interval honored" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Passed" }
    ],
    razorpayLinkId: "pl_Amt543qwe098",
    razorpayUrl: "https://razorpay.com/pay/pl_Amt543qwe098"
  },
  {
    id: "TXN_00484",
    customerName: "Sneha Reddy",
    customerEmail: "sneha.reddy@fintech.co",
    amount: 34500,
    failureReason: "Authentication Failed",
    riskScore: 78,
    riskLevel: "HIGH",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: hoursAgo(6),
    status: "Pending",
    createdAt: hoursAgo(8),
    attemptsCount: 1,
    aiAnalysis: "3DS authentication timed out on mobile device. Customer was on weak network connection.",
    aiRecommendation: {
      action: "PAYMENT_RETRY",
      strategy: "SEND_REMINDER",
      confidence: 85,
      urgency: "HIGH",
      reason: "Customer initiated 3DS challenge but dropped off before OTP. WhatsApp prompt with pre-filled checkout link recommended."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Verified user" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Fresh failure" },
      { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt 1 of 3" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Cleared" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Passed threshold" }
    ],
    razorpayLinkId: "pl_Sne890lkj456",
    razorpayUrl: "https://razorpay.com/pay/pl_Sne890lkj456"
  },
  {
    id: "TXN_00483",
    customerName: "Vikram Malhotra",
    customerEmail: "v.malhotra@enterprises.com",
    amount: 54000,
    failureReason: "Network Timeout",
    riskScore: 32,
    riskLevel: "LOW",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: hoursAgo(10),
    status: "Recovered",
    createdAt: hoursAgo(12),
    attemptsCount: 1,
    aiAnalysis: "Razorpay webhooks registered temporary gateway drop. Smart retry mechanism executed after 30 mins successfully.",
    aiRecommendation: {
      action: "PAYMENT_RETRY",
      strategy: "PAYMENT_RETRY",
      confidence: 95,
      urgency: "LOW",
      reason: "Low risk enterprise account. Gateway drop confirmed resolve. Direct API retry succeeded."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Enterprise tier" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Immediate recovery" },
      { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt 1" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Passed" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Approved for high value" }
    ],
    razorpayLinkId: "pl_Vik123mnb789",
    razorpayUrl: "https://razorpay.com/pay/pl_Vik123mnb789"
  },
  {
    id: "TXN_00482",
    customerName: "Ananya Deshmukh",
    customerEmail: "ananya@startup.in",
    amount: 15800,
    failureReason: "Insufficient Funds",
    riskScore: 65,
    riskLevel: "MEDIUM",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: daysAgo(1),
    status: "Pending",
    createdAt: daysAgo(1),
    attemptsCount: 1,
    aiAnalysis: "First of the month salary transfer pending. Retry scheduled for optimal payroll window.",
    aiRecommendation: {
      action: "SEND_REMINDER",
      strategy: "SEND_REMINDER",
      confidence: 81,
      urgency: "MEDIUM",
      reason: "Payday calendar model suggests retry on 3rd of month with gentle email reminder."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Verified plan" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Within 72h window" },
      { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt 1" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Cleared" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Passed" }
    ],
    razorpayLinkId: "pl_Ana456poi098",
    razorpayUrl: "https://razorpay.com/pay/pl_Ana456poi098"
  },
  {
    id: "TXN_00481",
    customerName: "Karan Patel",
    customerEmail: "karan.p@cloudservices.com",
    amount: 42100,
    failureReason: "Bank Server Down",
    riskScore: 84,
    riskLevel: "HIGH",
    eligibilityStatus: "ELIGIBLE",
    lastAttemptAt: daysAgo(2),
    status: "Recovered",
    createdAt: daysAgo(2),
    attemptsCount: 2,
    aiAnalysis: "HDFC gateway outage caused initial rejection. Automated UPI payment link dispatched via SMS.",
    aiRecommendation: {
      action: "PAYMENT_LINK",
      strategy: "PAYMENT_LINK",
      confidence: 89,
      urgency: "HIGH",
      reason: "Switching payment modal to instant UPI collect link recovered full transaction value."
    },
    guardrails: [
      { id: "g1", name: "Transaction eligible", status: "PASSED", detail: "Active customer" },
      { id: "g2", name: "Recovery window valid", status: "PASSED", detail: "Cleared" },
      { id: "g3", name: "Attempt limit not exceeded", status: "PASSED", detail: "Attempt 2 of 3" },
      { id: "g4", name: "No recent recovery attempt", status: "PASSED", detail: "Cleared" },
      { id: "g5", name: "Amount within recovery policy", status: "PASSED", detail: "Passed" }
    ],
    razorpayLinkId: "pl_Kar789zxc321",
    razorpayUrl: "https://razorpay.com/pay/pl_Kar789zxc321"
  }
];

export const INITIAL_RECOVERY_ATTEMPTS = [
  {
    id: "ATT_9901",
    transactionId: "TXN_00487",
    attemptNumber: 1,
    action: "PAYMENT_LINK",
    strategy: "PAYMENT_LINK",
    amount: 20532,
    status: "payment_pending",
    createdAt: hoursAgo(2),
    recoveredAt: null,
    recoveredAmount: 0,
    razorpayLinkId: "pl_L01abc987xyz",
    razorpayUrl: "https://razorpay.com/pay/pl_L01abc987xyz"
  },
  {
    id: "ATT_9900",
    transactionId: "TXN_00486",
    attemptNumber: 1,
    action: "SEND_REMINDER",
    strategy: "PAYMENT_LINK",
    amount: 12400,
    status: "recovered",
    createdAt: hoursAgo(5),
    recoveredAt: hoursAgo(4.5),
    recoveredAmount: 12400,
    razorpayLinkId: "pl_Pri876xyz123",
    razorpayUrl: "https://razorpay.com/pay/pl_Pri876xyz123"
  },
  {
    id: "ATT_9899",
    transactionId: "TXN_00485",
    attemptNumber: 2,
    action: "PAYMENT_LINK",
    strategy: "PAYMENT_LINK",
    amount: 8900,
    status: "failed",
    createdAt: hoursAgo(8),
    recoveredAt: null,
    recoveredAmount: 0,
    razorpayLinkId: "pl_Amt543qwe098",
    razorpayUrl: "https://razorpay.com/pay/pl_Amt543qwe098"
  },
  {
    id: "ATT_9898",
    transactionId: "TXN_00483",
    attemptNumber: 1,
    action: "PAYMENT_RETRY",
    strategy: "PAYMENT_RETRY",
    amount: 54000,
    status: "recovered",
    createdAt: hoursAgo(10),
    recoveredAt: hoursAgo(9.8),
    recoveredAmount: 54000,
    razorpayLinkId: "pl_Vik123mnb789",
    razorpayUrl: "https://razorpay.com/pay/pl_Vik123mnb789"
  },
  {
    id: "ATT_9897",
    transactionId: "TXN_00481",
    attemptNumber: 2,
    action: "PAYMENT_LINK",
    strategy: "PAYMENT_LINK",
    amount: 42100,
    status: "recovered",
    createdAt: daysAgo(2),
    recoveredAt: daysAgo(2),
    recoveredAmount: 42100,
    razorpayLinkId: "pl_Kar789zxc321",
    razorpayUrl: "https://razorpay.com/pay/pl_Kar789zxc321"
  }
];

export const INITIAL_AI_DECISIONS = [
  {
    id: "DEC_104",
    transactionId: "TXN_00487",
    riskLevel: "HIGH",
    recommendedAction: "PAYMENT_RETRY",
    strategy: "PAYMENT_LINK",
    confidence: 87,
    urgency: "HIGH",
    reason: "Customer abandoned checkout due to transient balance issue; high payment completion rate post link dispatch.",
    guardrailResult: "PASSED",
    timestamp: hoursAgo(2)
  },
  {
    id: "DEC_103",
    transactionId: "TXN_00486",
    riskLevel: "MEDIUM",
    recommendedAction: "SEND_REMINDER",
    strategy: "PAYMENT_LINK",
    confidence: 92,
    urgency: "MEDIUM",
    reason: "Card expired on auto-renewal. Prompting card update link yields high conversion.",
    guardrailResult: "PASSED",
    timestamp: hoursAgo(5)
  },
  {
    id: "DEC_102",
    transactionId: "TXN_00485",
    riskLevel: "HIGH",
    recommendedAction: "PAYMENT_LINK",
    strategy: "PAYMENT_LINK",
    confidence: 74,
    urgency: "HIGH",
    reason: "Issuing bank experienced downtime during scheduled collection. Multi-channel link recommended.",
    guardrailResult: "PASSED",
    timestamp: hoursAgo(8)
  },
  {
    id: "DEC_101",
    transactionId: "TXN_00484",
    riskLevel: "HIGH",
    recommendedAction: "PAYMENT_RETRY",
    strategy: "SEND_REMINDER",
    confidence: 85,
    urgency: "HIGH",
    reason: "3DS authentication timeout on mobile network. Immediate WhatsApp retry prompt recommended.",
    guardrailResult: "PASSED",
    timestamp: hoursAgo(6)
  },
  {
    id: "DEC_100",
    transactionId: "TXN_00483",
    riskLevel: "LOW",
    recommendedAction: "PAYMENT_RETRY",
    strategy: "PAYMENT_RETRY",
    confidence: 95,
    urgency: "LOW",
    reason: "Direct gateway timeout confirmed resolve. Automatic direct API retry authorized.",
    guardrailResult: "PASSED",
    timestamp: hoursAgo(10)
  }
];

export const INITIAL_AUDIT_LOGS = [
  {
    id: "AUD_709",
    timestamp: hoursAgo(2),
    transactionId: "TXN_00487",
    event: "PAYMENT_LINK_CREATED",
    actor: "Razorpay API Integrator",
    decision: "PAYMENT_LINK",
    status: "SUCCESS",
    details: "Generated Razorpay Payment Link ID: pl_L01abc987xyz for ₹20,532"
  },
  {
    id: "AUD_708",
    timestamp: hoursAgo(2.1),
    transactionId: "TXN_00487",
    event: "RECOVERY_ATTEMPT_CREATED",
    actor: "RevenuePilot Engine",
    decision: "PAYMENT_RETRY",
    status: "EXECUTED",
    details: "Initiated Attempt #1 for TXN_00487"
  },
  {
    id: "AUD_707",
    timestamp: hoursAgo(2.2),
    transactionId: "TXN_00487",
    event: "GUARDRAILS_EVALUATED",
    actor: "Guardrail Policy Engine",
    decision: "PASSED",
    status: "SUCCESS",
    details: "All 5 guardrail safety policies passed successfully"
  },
  {
    id: "AUD_706",
    timestamp: hoursAgo(2.3),
    transactionId: "TXN_00487",
    event: "AI_RECOMMENDATION_GENERATED",
    actor: "RevenuePilot AI Agent",
    decision: "PAYMENT_RETRY (Confidence 87%)",
    status: "SUCCESS",
    details: "Strategy selected: PAYMENT_LINK via SMS + WhatsApp"
  },
  {
    id: "AUD_705",
    timestamp: hoursAgo(4),
    transactionId: "TXN_00487",
    event: "RISK_DETECTED",
    actor: "Razorpay Webhook Monitor",
    decision: "REVENUE_AT_RISK",
    status: "DETECTED",
    details: "Payment failed for Rahul Sharma (₹20,532) - Reason: Insufficient Funds"
  },
  {
    id: "AUD_704",
    timestamp: hoursAgo(4.5),
    transactionId: "TXN_00486",
    event: "PAYMENT_CAPTURED",
    actor: "Customer (Priya Singh)",
    decision: "PAID",
    status: "SUCCESS",
    details: "Received ₹12,400 via Razorpay Payment Link pl_Pri876xyz123"
  },
  {
    id: "AUD_703",
    timestamp: hoursAgo(4.5),
    transactionId: "TXN_00486",
    event: "WEBHOOK_PROCESSED",
    actor: "Razorpay Webhook Handler",
    decision: "payment.captured",
    status: "VERIFIED",
    details: "Verified HMAC SHA256 signature for event payment.captured"
  },
  {
    id: "AUD_702",
    timestamp: hoursAgo(4.5),
    transactionId: "TXN_00486",
    event: "REVENUE_RECOVERED",
    actor: "RevenuePilot Engine",
    decision: "RECOVERED",
    status: "COMPLETED",
    details: "Updated dashboard metrics: Recovered Revenue +₹12,400"
  }
];

export const MOCK_CHART_DATA = [
  { day: "Day 1", atRisk: 42000, recovered: 18000 },
  { day: "Day 2", atRisk: 58000, recovered: 29000 },
  { day: "Day 3", atRisk: 35000, recovered: 21000 },
  { day: "Day 4", atRisk: 64000, recovered: 34000 },
  { day: "Day 5", atRisk: 49000, recovered: 28000 },
  { day: "Day 6", atRisk: 72000, recovered: 39000 },
  { day: "Today", atRisk: 84500, recovered: 42300 },
];

export const RECOVERY_BY_STRATEGY = [
  { strategy: "PAYMENT_RETRY", count: 8, amount: 68500, successRate: 75 },
  { strategy: "PAYMENT_LINK", count: 6, amount: 48200, successRate: 83 },
  { strategy: "SEND_REMINDER", count: 3, amount: 21600, successRate: 100 },
  { strategy: "STOP", count: 1, amount: 4000, successRate: 0 },
];

export const RECOVERY_BY_FAILURE_REASON = [
  { reason: "Insufficient Funds", atRisk: 112000, recovered: 52000, count: 5 },
  { reason: "Bank Server Down", atRisk: 78000, recovered: 42100, count: 3 },
  { reason: "Card Expired", atRisk: 45000, recovered: 30600, count: 4 },
  { reason: "Authentication Failed", atRisk: 34500, recovered: 12000, count: 2 },
  { reason: "Network Timeout", atRisk: 15000, recovered: 15000, count: 4 },
];
