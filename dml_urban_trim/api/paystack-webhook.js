const crypto = require("crypto");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method not allowed");

  const secret = process.env.PAYSTACK_SECRET_KEY;
  const signature = req.headers["x-paystack-signature"];
  const expected = crypto.createHmac("sha512", secret || "").update(JSON.stringify(req.body || {})).digest("hex");
  if (!secret || !signature || signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return res.status(401).send("Invalid signature");
  }

  const event = req.body || {};
  if (event.event !== "charge.success" || event.data?.amount !== 700000 || event.data?.currency !== "NGN") return res.status(200).send("Ignored");

  try {
    const url = process.env.SUPABASE_URL.replace(/\/$/, "");
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const response = await fetch(`${url}/rest/v1/appointments?reference=eq.${encodeURIComponent(event.data.reference)}`, {
      method: "PATCH",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed", pending_expires_at: null, paid_at: event.data.paid_at || new Date().toISOString(), paystack_transaction_id: String(event.data.id || "") })
    });
    if (!response.ok) throw new Error(await response.text());
    return res.status(200).send("OK");
  } catch (error) {
    console.error("Webhook update error:", error);
    return res.status(500).send("Unable to update appointment");
  }
};
