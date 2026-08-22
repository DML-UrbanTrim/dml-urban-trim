const crypto = require("crypto");

const AMOUNT = 700000; // ₦7,000 in kobo
const HOLD_MINUTES = 15;

const OGBOMOSHO_CENTER = {
  latitude: 8.133,
  longitude: 4.244
};

const SERVICE_RADIUS_KM = 20;

function clean(value, max = 500) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}

function isInOgbomoshoServiceArea(latitude, longitude) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return false;
  }

  const toRadians = value => value * Math.PI / 180;

  const latitudeDifference =
    toRadians(latitude - OGBOMOSHO_CENTER.latitude);

  const longitudeDifference =
    toRadians(longitude - OGBOMOSHO_CENTER.longitude);

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(toRadians(OGBOMOSHO_CENTER.latitude)) *
    Math.cos(toRadians(latitude)) *
    Math.sin(longitudeDifference / 2) ** 2;

  const distance =
    2 *
    6371 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );

  return distance <= SERVICE_RADIUS_KM;
}


/* =================================
   DATABASE
================================= */

async function database(path, options = {}) {

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Booking database is not configured on the server."
    );
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {

    const response = await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/${path}`,
      {
        ...options,

        signal: controller.signal,

        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      }
    );

    if (!response.ok) {
      throw new Error(await response.text());
    }

    return response;

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "The booking database took too long to respond. Please try again."
      );
    }

    throw error;

  } finally {

    clearTimeout(timeout);

  }
}


/* =================================
   AUTHENTICATED USER
================================= */

async function authenticatedUser(req) {

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const authorization =
    req.headers.authorization;

  if (
    !url ||
    !key ||
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 10000);

  try {

    const response = await fetch(
      `${url.replace(/\/$/, "")}/auth/v1/user`,
      {
        signal: controller.signal,

        headers: {
          apikey: key,
          Authorization: authorization
        }
      }
    );

    if (!response.ok) {
      return null;
    }

    return await response.json();

  } catch (error) {

    console.error(
      "Supabase authentication error:",
      error
    );

    return null;

  } finally {

    clearTimeout(timeout);

  }
}


/* =================================
   PAYSTACK
================================= */

async function initializePaystack({
  secret,
  email,
  reference,
  callbackUrl
}) {

  const controller = new AbortController();

  const timeout = setTimeout(() => {
    controller.abort();
  }, 15000);

  try {

    const response = await fetch(
      "https://api.paystack.co/transaction/initialize",
      {
        method: "POST",

        signal: controller.signal,

        headers: {
          Authorization: `Bearer ${secret}`,
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          email,
          amount: String(AMOUNT),
          currency: "NGN",
          reference,
          callback_url: callbackUrl,

          metadata: {
            appointment_reference: reference,
            service: "Haircut"
          }
        })
      }
    );

    let result;

    try {
      result = await response.json();
    } catch {
      throw new Error(
        "Paystack returned an invalid response."
      );
    }

    if (!response.ok || !result.status) {

      throw new Error(
        result.message ||
        "Paystack could not initialize the payment."
      );
    }

    if (!result.data?.access_code) {
      throw new Error(
        "Paystack did not return a payment access code."
      );
    }

    return result.data;

  } catch (error) {

    if (error.name === "AbortError") {
      throw new Error(
        "Paystack took too long to respond. Please try again."
      );
    }

    throw error;

  } finally {

    clearTimeout(timeout);

  }
}


/* =================================
   MAIN HANDLER
================================= */

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      message: "Method not allowed"
    });

  }

  try {

    const secret =
      process.env.PAYSTACK_SECRET_KEY;

    if (!secret) {

      return res.status(500).json({
        message:
          "Paystack secret key is not configured on the server."
      });

    }


    const body = req.body || {};


    const email =
      clean(body.email, 160);

    const name =
      clean(body.name, 120);

    const phone =
      clean(body.phone, 40);

    const address =
      clean(body.address, 300);

    const date =
      clean(body.date, 10);

    const time =
      clean(body.time, 30);

    const latitude =
      Number(body.latitude);

    const longitude =
      Number(body.longitude);


    /* =================================
       AUTHENTICATION
    ================================= */

    const user =
      await authenticatedUser(req);

    if (!user?.id || !user.email) {

      return res.status(401).json({
        message:
          "Please sign in before booking an appointment."
      });

    }


    /* =================================
       VALIDATION
    ================================= */

    if (
      body.service !== "Haircut" ||
      !email.includes("@") ||
      !name ||
      !phone ||
      !address ||
      !date ||
      !time
    ) {

      return res.status(400).json({
        message:
          "Please complete all required booking details."
      });

    }


    if (
      Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      !isInOgbomoshoServiceArea(
        latitude,
        longitude
      )
    ) {

      return res.status(400).json({
        message:
          "Your selected location is outside the Ogbomosho service area."
      });

    }


    /* =================================
       REMOVE EXPIRED PENDING BOOKINGS
    ================================= */

    try {

      await database(
        `appointments?status=eq.pending&pending_expires_at=lt.${encodeURIComponent(
          new Date().toISOString()
        )}`,
        {
          method: "DELETE"
        }
      );

    } catch (cleanupError) {

      console.warn(
        "Expired booking cleanup failed:",
        cleanupError
      );

    }


    /* =================================
       CREATE REFERENCE
    ================================= */

    const reference =
      `dml_${crypto
        .randomUUID()
        .replace(/-/g, "")}`;


    const pendingExpiresAt =
      new Date(
        Date.now() +
        HOLD_MINUTES * 60 * 1000
      ).toISOString();


    const protocol =
      req.headers["x-forwarded-proto"] ||
      "https";

    const host =
      req.headers.host;

    const siteUrl =
      (
        process.env.SITE_URL ||
        `${protocol}://${host}`
      ).replace(/\/$/, "");


    const callbackUrl =
      `${siteUrl}/payment-success.html?reference=${encodeURIComponent(
        reference
      )}`;


    /* =================================
       CREATE BOOKING
    ================================= */

    await database(
      "appointments",
      {
        method: "POST",

        headers: {
          Prefer: "return=minimal"
        },

        body: JSON.stringify({

          reference,

          user_id:
            user.id,

          service:
            "Haircut",

          customer_name:
            name,

          customer_email:
            user.email,

          customer_phone:
            phone,

          address,

          latitude:
            Number.isFinite(latitude)
              ? latitude
              : null,

          longitude:
            Number.isFinite(longitude)
              ? longitude
              : null,

          appointment_date:
            date,

          appointment_time:
            time,

          note:
            clean(body.note),

          amount:
            AMOUNT,

          status:
            "pending",

          pending_expires_at:
            pendingExpiresAt

        })
      }
    );


    /* =================================
       INITIALIZE PAYSTACK
    ================================= */

    const paystackData =
      await initializePaystack({
        secret,
        email: user.email,
        reference,
        callbackUrl
      });


    /* =================================
       SUCCESS
    ================================= */

    return res.status(200).json({

      success: true,

      accessCode:
        paystackData.access_code,

      authorizationUrl:
        paystackData.authorization_url,

      reference

    });


  } catch (error) {

    console.error(
      "Booking initialization error:",
      error
    );


    const message =
      error?.message ||
      "Unable to start payment.";


    if (
      message.toLowerCase().includes(
        "duplicate key"
      )
    ) {

      return res.status(409).json({
        message:
          "That appointment time is no longer available. Please choose another time."
      });

    }


    return res.status(500).json({
      message
    });

  }

};