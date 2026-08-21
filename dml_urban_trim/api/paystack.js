const crypto = require("crypto");

const AMOUNT = 700000;
const HOLD_MINUTES = 15;
const OGBOMOSHO_CENTER = { latitude: 8.133, longitude: 4.244 };
const SERVICE_RADIUS_KM = 20;

function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function isInOgbomoshoServiceArea(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return false;

  const toRadians = value => value * Math.PI / 180;
  const latitudeDifference = toRadians(latitude - OGBOMOSHO_CENTER.latitude);
  const longitudeDifference = toRadians(longitude - OGBOMOSHO_CENTER.longitude);
  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(OGBOMOSHO_CENTER.latitude)) *
    Math.cos(toRadians(latitude)) *
    Math.sin(longitudeDifference / 2) ** 2;
  const distance = 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return distance <= SERVICE_RADIUS_KM;
}

async function database(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Booking database is not configured on the server.");

  const response = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(await response.text());
  return response;
}

async function authenticatedUser(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = req.headers.authorization;
  if (!url || !key || !authorization?.startsWith("Bearer ")) return null;

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: key, Authorization: authorization }
  });
  if (!response.ok) return null;
  return response.json();
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    const body = req.body || {};
    const email = clean(body.email, 160);
    const name = clean(body.name, 120);
    const phone = clean(body.phone, 40);
    const address = clean(body.address, 300);
    const date = clean(body.date, 10);
    const time = clean(body.time, 30);
    const latitude = Number(body.latitude);
    const longitude = Number(body.longitude);

    const user = await authenticatedUser(req);

    if (!secret) throw new Error("Paystack secret key is not configured on the server.");
    if (!user?.id || !user.email) {
      return res.status(401).json({ message: "Please sign in before booking an appointment." });
    }
    if (body.service !== "Haircut" || !email.includes("@") || !name || !phone || !address || !date || !time) {
      return res.status(400).json({ message: "Please complete all required booking details." });
    }
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
      return res.status(400).json({ message: "Please select your location on the map." });
    }
    if (!isInOgbomoshoServiceArea(latitude, longitude)) {
      return res.status(400).json({ message: "We currently serve Ogbomosho only. Please select a location within Ogbomosho." });
    }

    await database(`appointments?status=eq.pending&pending_expires_at=lt.${encodeURIComponent(new Date().toISOString())}`, { method: "DELETE" });

    const reference = `dml_${crypto.randomUUID().replace(/-/g, "")}`;
    const pendingExpiresAt = new Date(Date.now() + HOLD_MINUTES * 60 * 1000).toISOString();
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const siteUrl = (process.env.SITE_URL || `${protocol}://${req.headers.host}`).replace(/\/$/, "");
    const callbackUrl = `${siteUrl}/payment-success.html?reference=${encodeURIComponent(reference)}`;
    await database("appointments", {
      method: "POST",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify({
        reference, user_id: user.id, service: "Haircut", customer_name: name, customer_email: user.email,
        customer_phone: phone, address, latitude, longitude, appointment_date: date,
        appointment_time: time, note: clean(body.note), amount: AMOUNT,
        status: "pending", pending_expires_at: pendingExpiresAt
      })
    });

    const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        amount: String(AMOUNT),
        currency: "NGN",
        reference,
        callback_url: callbackUrl,
        metadata: { appointment_reference: reference }
      })
    });
    const result = await paystackResponse.json();

    if (!paystackResponse.ok || !result.status) {
      await database(`appointments?reference=eq.${encodeURIComponent(reference)}`, { method: "PATCH", body: JSON.stringify({ status: "payment_failed" }) });
      throw new Error(result.message || "Paystack could not initialize the transaction.");
    }

    return res.status(200).json({
      accessCode: result.data.access_code,
      authorizationUrl: result.data.authorization_url,
      reference
    });
  } catch (error) {
    console.error("Booking initialization error:", error);
    const unavailable = String(error.message).includes("duplicate key");
    return res.status(unavailable ? 409 : 500).json({ message: unavailable ? "That appointment time is no longer available." : error.message || "Unable to start payment." });
  }
};
