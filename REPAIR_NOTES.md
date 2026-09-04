# RevenuePilot repair notes

This version makes the real backend the default and makes local mock mode explicit.

## Key fixes
- Razorpay Payment Link creation uses the real SDK response only.
- No fake `rzp.io`/`razorpay.com/pay/...` URLs are generated anywhere in the application.
- Recovery execution fails if Razorpay does not return both `id` and `short_url`.
- Razorpay errors are returned to the frontend instead of being hidden by mock fallback.
- Local mock data is used only when `VITE_DEMO_MODE=true`.
- Transaction lookup accepts both business `transactionId` and MongoDB `_id`.
- Recovery webhook handles both `payment.captured` and `payment_link.paid` payload shapes.
- Webhook correlation uses recovery attempt ID, Payment Link ID, and transaction ID.
- Recovery state is persisted before the frontend treats execution as successful.
- AI model is configurable with `GROQ_MODEL`.
- AI confidence is normalized for display.
- Metrics no longer replace legitimate zero values with demo defaults.
- CORS no longer combines wildcard origin with credentials.

## Start

Backend:
```bash
cd server
npm install
npm run seed:users
npm run seed
npm run dev
```

Frontend:
```bash
cd client/frontend
npm install
npm run dev
```

Frontend `.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_DEMO_MODE=false
```

Backend `.env` should contain your own MongoDB, Groq, Razorpay Test Mode keys, webhook secret and JWT secret. Use `.env.example` as the template.

## Razorpay webhook

Expose the backend:
```bash
ngrok http 5000
```

Set the Razorpay Test Mode webhook URL to:
```text
https://<your-ngrok-domain>/api/webhooks/razorpay
```

Use the same webhook secret in `server/.env` as configured in Razorpay.

## Isolated Razorpay check

After login, the backend exposes:
```text
GET /api/payments/test-link
```

It creates a small test Payment Link directly through the Razorpay SDK. If this endpoint fails, the issue is Razorpay credentials/account/API configuration rather than the RevenuePilot recovery pipeline.

Do not repeatedly call this endpoint because Razorpay Test Mode has a Payment Link creation limit.
