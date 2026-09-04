const groq = require("../config/groq");

const generateRecoveryRecommendation = async ({
  transaction,
  risk,
  eligibility,
}) => {
  
const prompt = `
You are RevenuePilot's AI Revenue Recovery Agent.

Your job is to recommend ONE safe recovery action for a transaction that has already passed the deterministic eligibility engine.

The deterministic backend policy is authoritative. You MUST NOT override it.

ACTION SELECTION GUIDELINES:
- CREATE_PAYMENT_LINK: Choose when payment recovery should be attempted and generating a Razorpay payment link is appropriate (e.g. failed payment, card decline, technical/network failure, insufficient funds).
- SEND_REMINDER: Choose when a follow-up reminder is appropriate and immediate payment link creation is not necessary (e.g. abandoned checkout, early overdue invoice, gentle re-engagement).
- NO_ACTION: Choose when risk conditions, policy guardrails, or fraud indicators suggest no automated recovery should be attempted (or eligibility is not ELIGIBLE).

IMPORTANT RULES:
1. Never invent transaction information.
2. Never change the transaction amount.
3. Never recommend refunds or charging more than original amount.
4. Only choose one of these actions:
   - CREATE_PAYMENT_LINK
   - SEND_REMINDER
   - NO_ACTION
5. If eligibility is not ELIGIBLE, choose NO_ACTION.
6. Give a concise, professional explanation for your decision.
7. Confidence must be between 0.0 and 1.0.
8. Return JSON only.

Transaction:
${JSON.stringify(transaction, null, 2)}

Risk:
${JSON.stringify(risk, null, 2)}

Eligibility:
${JSON.stringify(eligibility, null, 2)}

Return this exact JSON structure:
{
  "action": "CREATE_PAYMENT_LINK | SEND_REMINDER | NO_ACTION",
  "strategy": "PAYMENT_LINK | SEND_REMINDER | PAYMENT_RETRY | NO_ACTION",
  "reason": "concise explanation of rationale",
  "urgency": "HIGH | MEDIUM | LOW",
  "confidence": 0.85
}
`;

const completion =
  await groq.chat.completions.create({
    model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",

    temperature: 0,

    response_format: {
      type: "json_object",
    },

    messages: [
      {
        role: "system",
        content:
          "You are a financial recovery decision assistant. Return only valid JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content =
    completion.choices[0]?.message?.content;

  if (!content) {
    throw new Error(
      "AI returned an empty response"
    );
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    console.error(
      "Invalid AI JSON:",
      content
    );

    throw new Error(
      "AI returned invalid JSON"
    );
  }
};

module.exports = {
  generateRecoveryRecommendation,
};