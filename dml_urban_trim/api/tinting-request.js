const crypto = require("crypto");
const { getAuthenticatedUser, database } = require("./_auth");

const clean = (value, max = 500) => typeof value === "string" ? value.trim().slice(0, max) : "";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const user = await getAuthenticatedUser(req);
    if (!user?.id || !user.email) return res.status(401).json({ message: "Please sign in before requesting a quote." });

    const body = req.body || {};
    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 300);
    const tintColor = clean(body.tintColor, 120);
    const date = clean(body.date, 10);
    const time = clean(body.time, 30);
    if (!name || !phone || !address || !tintColor || !date || !time) {
      return res.status(400).json({ message: "Please complete all required quote details." });
    }

    const reference = `dml_tint_${crypto.randomUUID().replace(/-/g, "")}`;
    await database("appointments", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        reference,
        user_id: user.id,
        service: "Hair Tinting",
        customer_name: name,
        customer_email: user.email,
        customer_phone: phone,
        address,
        tint_color: tintColor,
        appointment_date: date,
        appointment_time: time,
        note: clean(body.note),
        amount: 0,
        status: "quote_pending"
      })
    });

    return res.status(201).json({ reference });
  } catch (error) {
    console.error("Tinting request error:", error);
    return res.status(500).json({ message: "Unable to save your quote request." });
  }
};
