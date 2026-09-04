# RevenuePilot | Autonomous AI Revenue Recovery Platform

> Built for the **Razorpay Buildathon — AI Revenue Recovery Track**.
> RevenuePilot is an autonomous AI-driven revenue recovery and operations platform. It continuously detects at-risk revenue, evaluates decline intelligence with LLMs, verifies strict policy guardrails, generates bounded Razorpay recovery payment workflows, and monitors payment webhooks to measure recovered money in real time.

---

## 📌 Problem
SaaS businesses and subscription platforms suffer massive, preventable revenue leakage due to failed payments, bank declines, and abandoned checkouts. Manual outreach is slow and traditional automated retries are rigid, blindly blasting customers without context or safety guardrails, resulting in involuntary churn and poor recovery conversion.

## 🚀 Solution & Innovation
RevenuePilot functions as an autonomous, bounded AI RevOps recovery agent:
1. **At-Risk Detection**: Identifies failed transactions, abandoned checkouts, and overdue invoices in real-time.
2. **AI Recovery Strategy**: Groq AI analyzes customer history and failure reasons to prescribe an optimal strategy (`PAYMENT_LINK`, `PAYMENT_RETRY`, `SEND_REMINDER`, `STOP`).
3. **Deterministic Policy Guardrails**: Enforces SLA windows, attempt caps, minimum retry cooldowns, and amount thresholds before any action is executed.
4. **Autonomous Action Execution**: Creates customized Razorpay Payment Links with idempotency keys and transaction metadata.
5. **HMAC Webhook Ingestion**: Ingests `payment.captured` webhooks, marks transactions as recovered, and updates analytics.
6. **Role-Based Access Control (RBAC)**: Enforces distinct `ADMIN` and `EMPLOYEE` permissions across both backend APIs and the frontend dashboard.
7. **Immutable Audit Trail**: Records every decision, login, recovery execution, and webhook event with the acting user's ID and role.

---

## 🏗️ Architecture Flow

```
[Customer Failed Payment / Decline Event]
                    ↓
[Frontend React Dashboard (JWT Authenticated)]
                    ↓ REST API (Bearer JWT)
[Express.js Backend API + RBAC Middleware]
                    ↓
[Groq AI Recommendation Engine] → [Policy Guardrails Gate]
                    ↓
[Recovery Action Executor] → [Razorpay Payment Link API]
                    ↓
[Customer Completes Checkout via Razorpay]
                    ↓
[Razorpay Webhook (HMAC SHA256)] → [MongoDB / Metrics Update]
                    ↓
[Frontend 5s Polling / Real-time Live Updates] → [Recovered Toast + Metrics Refresh]
```

---

## 👥 Fixed Roles & Permissions (RBAC)

| Capability / Section | ADMIN | EMPLOYEE |
| :--- | :---: | :---: |
| View Dashboard & Metrics | ✅ | ✅ |
| View & Filter Transactions | ✅ | ✅ |
| Inspect Transaction Details | ✅ | ✅ |
| Run AI Recovery Analysis & View Recommendations | ✅ | ✅ |
| Evaluate Policy Guardrails | ✅ | ✅ |
| Execute Approved Recovery Actions | ✅ | ✅ |
| View Active & Historical Recovery Attempts | ✅ | ✅ |
| View System Audit Trail | ✅ | ✅ |
| **Access User Management (`/admin/users`)** | ✅ | ❌ *(403 Forbidden)* |
| **Create Employee Accounts** | ✅ | ❌ *(403 Forbidden)* |
| **Activate / Deactivate Accounts** | ✅ | ❌ *(403 Forbidden)* |
| **Modify User Roles** | ✅ | ❌ *(403 Forbidden)* |

---

## 🔑 Demo Credentials

Seed demo users into your MongoDB instance using `npm run seed:users` from `revenuepilot/server`:

| Role | Email | Default Password | Access Level |
| :--- | :--- | :--- | :--- |
| **ADMIN** | `admin@revenuepilot.ai` | `Admin@123456` | Full system access + User Management |
| **EMPLOYEE** | `employee@revenuepilot.ai` | `Employee@123456` | Operational access (Recovery, Metrics, Audit) |

> 💡 *Quick demo fill buttons are also embedded directly on the `/login` screen for fast evaluation.*

---

## 🛠️ Tech Stack

### Frontend:
- **Framework**: React 18 (Pure JavaScript/JSX) + Vite 5
- **Styling**: Tailwind CSS (Dark fintech aesthetic, glassmorphism, responsive)
- **Data Visualization**: Recharts (Revenue recovery area charts, recovery rate trends, strategy distributions)
- **Icons**: Lucide React
- **Routing**: React Router DOM v6 with Protected Routes & RBAC Guards
- **State & Auth**: React Auth Context with JWT Bearer token management and 5-second polling

### Backend (`revenuepilot/server`):
- **Runtime**: Node.js & Express.js
- **Database**: MongoDB & Mongoose
- **Authentication**: Stateless JWT + `bcryptjs` password hashing
- **AI Model**: Groq AI (`llama-3.3-70b-versatile`)
- **Payment & Webhooks**: Razorpay API & Webhook Verification (HMAC SHA256)

---

## ⚙️ Environment Variables

### Backend (`revenuepilot/server/.env`):
```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/revenuepilot?retryWrites=true&w=majority
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret_here
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=1d
ADMIN_DEMO_PASSWORD=Admin@123456
EMPLOYEE_DEMO_PASSWORD=Employee@123456
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env`):
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 💻 Local Setup & Execution Guide

### Step 1: Start Backend
```bash
cd c:\Users\aksha\OneDrive\Desktop\Razorpay\revenuepilot\server

# 1. Install dependencies
npm install

# 2. Seed initial demo transactions & users
npm run seed
npm run seed:users

# 3. Start backend API server
npm run dev
# Server runs on http://localhost:5000
```

### Step 2: Start Frontend
```bash
cd c:\Users\aksha\OneDrive\Desktop\Razorpay\frontend

# 1. Install dependencies
npm install

# 2. Start Vite development server
npm run dev
# Frontend opens at http://localhost:3000
```

### Step 3: Production Build Verification
```bash
# Build frontend for production
npm run build

# Preview production build locally
npm run preview
```

---

## 🧪 End-to-End Evaluation Checklist

1. **Sign In**: Navigate to `/login` → click **Quick Fill: Admin** → click **Sign In**.
2. **Dashboard Overview**: Check 5 KPI cards (**₹2,84,500** at risk, **₹1,42,300** recovered, **50.0%** recovery rate, **₹20,532** recovered today, **18** active attempts).
3. **Transaction Details**: Click on transaction `TXN_00487` (or navigate to `/transactions/TXN_00487`).
4. **AI & Guardrails**: Inspect the AI Recommendation card (strategy `PAYMENT_LINK`, 87% confidence) and the 5-point Policy Guardrails checklist (Status: `APPROVED FOR RECOVERY`).
5. **Execute Recovery**: Click **Execute Recovery** → Confirm modal → observe status change to `Waiting for Customer Payment` and inspect the generated Razorpay payment link.
6. **Webhook & Polling**: Complete test checkout on Razorpay → Webhook captures payment → Frontend 5-second polling detects status transition to `recovered` → success toast fires: `"₹20,532 successfully recovered via Razorpay webhook!"` → Metrics and Dashboard update immediately.
7. **Audit Log**: Check `/audit-log` to verify chronological entries with acting user (`admin@revenuepilot.ai` / `ADMIN`).
8. **RBAC & User Management**:
   - As **ADMIN**: Navigate to `/admin/users`, create a new employee, test activate/deactivate.
   - Click user profile avatar → **Sign Out** → Log in as **EMPLOYEE** (`employee@revenuepilot.ai`).
   - Observe that `/admin/users` is hidden in navigation, and navigating directly to `/admin/users` returns a `403 Forbidden` screen.
