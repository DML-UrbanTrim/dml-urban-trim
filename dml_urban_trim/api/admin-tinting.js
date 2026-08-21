const { getAuthenticatedUser, isAdmin, database } = require("./_auth");

module.exports = async function handler(req, res) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!isAdmin(user)) return res.status(403).json({ message: "Admin access is required." });

    if (req.method === "GET") {
      const fields = "reference,customer_name,customer_phone,customer_email,address,tint_color,appointment_date,appointment_time,note,status,quoted_amount";
      const response = await database(`appointments?service=eq.Hair%20Tinting&select=${fields}&order=created_at.desc`);
      return res.status(200).json({ appointments: await response.json() });
    }

    if (req.method === "POST") {
      const reference = typeof req.body?.reference === "string" ? req.body.reference : "";
      const amount = Math.round(Number(req.body?.amount) * 100);
      if (!reference.startsWith("dml_tint_") || !Number.isInteger(amount) || amount < 10000) {
        return res.status(400).json({ message: "Enter a valid tinting price of at least ₦100." });
      }

      await database(`appointments?reference=eq.${encodeURIComponent(reference)}&status=eq.quote_pending`, {
        method: "PATCH",
        body: JSON.stringify({ quoted_amount: amount, amount, status: "quoted", quote_set_at: new Date().toISOString() })
      });
      return res.status(200).json({ message: "Price added. The customer can now pay from My Bookings." });
    }

    return res.status(405).json({ message: "Method not allowed" });
  } catch (error) {
    console.error("Tinting admin error:", error);
    return res.status(500).json({ message: "Unable to manage tinting requests." });
  }
};
