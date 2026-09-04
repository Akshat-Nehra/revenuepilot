const razorpay = require("../config/razorpay");

const createPaymentLink = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({ success: false, message: "Valid amount is required" });
    }

    const amountPaise = Math.round(amount * 100);
    const options = {
      amount: amountPaise,
      currency: "INR",
      description: String(req.body?.description || "RevenuePilot Recovery Payment").slice(0, 255),
      reference_id: `RP-DIRECT-${Date.now()}`,
      notify: { sms: false, email: false },
      reminder_enable: false,
    };

    const customer = {};
    if (req.body?.customerName) customer.name = String(req.body.customerName).trim();
    if (req.body?.customerEmail) customer.email = String(req.body.customerEmail).trim();
    if (req.body?.customerContact) customer.contact = String(req.body.customerContact).trim();
    if (Object.keys(customer).length) options.customer = customer;

    console.log("[RAZORPAY] Creating direct payment link", { amount: amountPaise, reference_id: options.reference_id });
    const paymentLink = await razorpay.paymentLink.create(options);

    if (!paymentLink?.id || !paymentLink?.short_url) {
      throw new Error("Razorpay did not return a valid payment link");
    }

    return res.status(201).json({
      success: true,
      message: "Payment link created successfully",
      paymentLink: {
        id: paymentLink.id,
        short_url: paymentLink.short_url,
        amount: paymentLink.amount,
        currency: paymentLink.currency || "INR",
        status: paymentLink.status || "created",
      },
    });
  } catch (error) {
    console.error("[RAZORPAY ERROR] Payment link creation failed", {
      message: error?.message,
      statusCode: error?.statusCode,
      code: error?.error?.code,
      description: error?.error?.description,
      field: error?.error?.field,
    });

    return res.status(Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 600 ? Number(error.statusCode) : 502).json({
      success: false,
      message: error?.error?.description || error?.message || "Failed to create payment link",
    });
  }
};

module.exports = { createPaymentLink };
