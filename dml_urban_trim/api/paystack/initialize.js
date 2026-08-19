export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }

  try {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
      return res.status(500).json({
        message: "Paystack secret key is not configured."
      });
    }

    const {
      service,
      email,
      name,
      phone,
      address,
      date,
      time,
      note
    } = req.body || {};

    if (service !== "Haircut") {
      return res.status(400).json({
        message: "Only Haircut bookings can be paid for here."
      });
    }

    if (!email || !email.includes("@")) {
      return res.status(400).json({
        message: "Please enter a valid email address."
      });
    }

    if (!name || !phone || !address || !date || !time) {
      return res.status(400).json({
        message: "Please complete all required booking details."
      });
    }

    const payload = {
      email: String(email).trim().slice(0, 160),
      amount: "700000",
      currency: "NGN",

      metadata: {
        service: "Haircut",
        customer_name: String(name).trim().slice(0, 120),
        phone: String(phone).trim().slice(0, 40),
        address: String(address).trim().slice(0, 300),
        appointment_date: String(date).trim().slice(0, 20),
        appointment_time: String(time).trim().slice(0, 30),
        note: String(note || "").trim().slice(0, 500)
      }
    };

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    const result = await response.json();

    if (!response.ok || !result.status) {
      return res.status(400).json({
        message:
          result.message ||
          "Paystack could not initialize the transaction."
      });
    }

    return res.status(200).json({
      accessCode: result.data.access_code,
      reference: result.data.reference
    });

  } catch (error) {
    console.error("Paystack initialization error:", error);

    return res.status(500).json({
      message:
        error.message ||
        "Unable to start payment. Please try again."
    });
  }
}