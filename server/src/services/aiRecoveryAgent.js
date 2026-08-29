const groq = require("../config/groq");

const generateRecoveryRecommendation = async ({
  transaction,
  risk,
  eligibility,
}) => {
  
const prompt = `
You are RevenuePilot's AI Revenue Recovery Agent.

Your job is to recommend ONE safe recovery action
for a transaction that has already passed the
deterministic eligibility engine.

The deterministic backend policy is authoritative.
You MUST NOT override it.

IMPORTANT RULES:

1. Never invent transaction information.
2. Never change the transaction amount.
3. Never recommend refunds.
4. Never recommend charging more than the original amount.
5. Only choose one of these actions:
   - CREATE_PAYMENT_LINK
   - SEND_REMINDER
   - NO_ACTION
6. If eligibility is not ELIGIBLE, choose NO_ACTION.
7. Give a concise explanation.
8. Confidence must be between 0 and 1.
9. Return JSON only.

Transaction:
${JSON.stringify(transaction, null, 2)}

Risk:
${JSON.stringify(risk, null, 2)}

Eligibility:
${JSON.stringify(eligibility, null, 2)}

Return this JSON structure:

{
  "action": "CREATE_PAYMENT_LINK",
  "strategy": "PAYMENT_RETRY",
  "reason": "short explanation",
  "urgency": "LOW",
  "confidence": 0.0
}
`;

const completion =
  await groq.chat.completions.create({
    model: "openai/gpt-oss-120b",

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