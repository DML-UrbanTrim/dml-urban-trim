async function updateAppointment(reference, update) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Booking database is not configured on the server.");

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/appointments?reference=eq.${encodeURIComponent(reference)}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation"
    },
    body: JSON.stringify(update)
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ message: "Method not allowed" });

  const reference = typeof req.query.reference === "string" ? req.query.reference : "";
  if (!reference.startsWith("dml_")) return res.status(400).json({ message: "Invalid payment reference." });

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    if (!secret) throw new Error("Paystack secret key is not configured on the server.");

    const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      headers: { Authorization: `Bearer ${secret}` }
    });
    const result = await response.json();
    const payment = result.data;

    if (!response.ok || !result.status || payment.status !== "success") {
      return res.status(409).json({ message: "Payment is not confirmed yet. Please wait a moment and refresh." });
    }
    if (payment.amount !== 700000 || payment.currency !== "NGN" || payment.reference !== reference) {
      return res.status(400).json({ message: "Payment details could not be verified." });
    }

    const appointments = await updateAppointment(reference, {
      status: "confirmed",
      pending_expires_at: null,
      paid_at: payment.paid_at || new Date().toISOString(),
      paystack_transaction_id: String(payment.id || "")
    });
    if (!appointments.length) return res.status(404).json({ message: "Booking record was not found." });

    return res.status(200).json({ status: "confirmed", appointment: appointments[0] });
  } catch (error) {
    console.error("Payment verification error:", error);
    return res.status(500).json({ message: error.message || "Unable to verify payment." });
  }
};
