const razorpay = require("../config/razorpay");

const createPaymentLink = async (req, res) => {
  try {
    const {
      amount,
      description,
      customerName,
      customerEmail,
      customerContact,
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid amount is required",
      });
    }

    const options = {
      amount: Math.round(Number(amount) * 100),
      currency: "INR",

      description:
        description || "RevenuePilot Recovery Payment",

      customer: {
        name: customerName || "RevenuePilot Customer",
        email: customerEmail || "customer@example.com",
        contact: customerContact || "9999999999",
      },

      notify: {
        sms: false,
        email: false,
      },

      reminder_enable: false,
    };

    const paymentLink = await razorpay.paymentLink.create(options);

    return res.status(201).json({
      success: true,
      message: "Payment link created successfully",

      paymentLink: {
        id: paymentLink.id,
        short_url: paymentLink.short_url,
        amount: paymentLink.amount,
        currency: paymentLink.currency,
        status: paymentLink.status,
      },
    });
  } catch (error) {
    console.error("Payment link creation error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment link",
      error:
        error.error?.description ||
        error.message ||
        "Unknown Razorpay error",
    });
  }
};

module.exports = {
  createPaymentLink,
};