const crypto = require("crypto");

const HAIRCUT_AMOUNT = 700000; // ₦7,000 in kobo

const HOLD_MINUTES = 15;

const OGBOMOSHO_CENTER = {
  latitude: 8.133,
  longitude: 4.244
};

const SERVICE_RADIUS_KM = 20;


/* =========================================
   CLEAN INPUT
========================================= */

function clean(value, max = 500) {
  return typeof value === "string"
    ? value.trim().slice(0, max)
    : "";
}


/* =========================================
   CHECK OGBOMOSHO SERVICE AREA
========================================= */

function isInOgbomoshoServiceArea(latitude, longitude) {

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return false;
  }

  const toRadians = value =>
    value * Math.PI / 180;

  const latitudeDifference =
    toRadians(
      latitude -
      OGBOMOSHO_CENTER.latitude
    );

  const longitudeDifference =
    toRadians(
      longitude -
      OGBOMOSHO_CENTER.longitude
    );

  const a =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(
      toRadians(
        OGBOMOSHO_CENTER.latitude
      )
    ) *
    Math.cos(
      toRadians(latitude)
    ) *
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


/* =========================================
   DATABASE
========================================= */

async function database(path, options = {}) {

  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Booking database is not configured on the server."
    );
  }

  const response =
    await fetch(
      `${url.replace(/\/$/, "")}/rest/v1/${path}`,
      {
        ...options,

        headers: {
          apikey: key,

          Authorization:
            `Bearer ${key}`,

          "Content-Type":
            "application/json",

          ...(options.headers || {})
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      await response.text()
    );
  }

  return response;
}


/* =========================================
   AUTHENTICATED USER
========================================= */

async function authenticatedUser(req) {

  const url =
    process.env.SUPABASE_URL;

  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  const authorization =
    req.headers.authorization;

  if (
    !url ||
    !key ||
    !authorization?.startsWith("Bearer ")
  ) {
    return null;
  }

  const response =
    await fetch(
      `${url.replace(/\/$/, "")}/auth/v1/user`,
      {
        headers: {
          apikey: key,
          Authorization: authorization
        }
      }
    );

  if (!response.ok) {
    return null;
  }

  return response.json();
}


/* =========================================
   PAYSTACK
========================================= */

module.exports = async function handler(req, res) {

  if (req.method !== "POST") {

    return res.status(405).json({
      message:
        "Method not allowed"
    });
  }


  try {

    const secret =
      process.env.PAYSTACK_SECRET_KEY;

    const body =
      req.body || {};


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


    const service =
      clean(body.service, 50);


    const reference =
      clean(body.reference, 100);


    const user =
      await authenticatedUser(req);


    /* =====================================
       BASIC CHECKS
    ===================================== */

    if (!secret) {

      throw new Error(
        "Paystack secret key is not configured on the server."
      );
    }


    if (
      !user?.id ||
      !user.email
    ) {

      return res.status(401).json({
        message:
          "Please sign in before booking an appointment."
      });
    }


    if (
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


    /* =====================================
       REMOVE EXPIRED HAIRCUT HOLDS
    ===================================== */

    await database(
      "appointments?status=eq.pending&pending_expires_at=lt." +
      encodeURIComponent(
        new Date().toISOString()
      ),
      {
        method: "DELETE"
      }
    );


    /* =====================================
       DETERMINE PAYMENT TYPE
    ===================================== */

    let amount = 0;

    let appointmentReference = "";


    /* =====================================
       HAIRCUT
    ===================================== */

    if (service === "Haircut") {

      amount =
        HAIRCUT_AMOUNT;

      appointmentReference =
        `dml_${crypto.randomUUID().replace(/-/g, "")}`;


      const pendingExpiresAt =
        new Date(
          Date.now() +
          HOLD_MINUTES * 60 * 1000
        ).toISOString();


      const protocol =
        req.headers["x-forwarded-proto"] ||
        "https";


      const siteUrl =
        (
          process.env.SITE_URL ||
          `${protocol}://${req.headers.host}`
        ).replace(/\/$/, "");


      const callbackUrl =
        `${siteUrl}/payment-success.html?reference=${encodeURIComponent(
          appointmentReference
        )}`;


      await database(
        "appointments",
        {
          method: "POST",

          headers: {
            Prefer:
              "return=minimal"
          },

          body:
            JSON.stringify({

              reference:
                appointmentReference,

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

              appointment_date:
                date,

              appointment_time:
                time,

              note:
                clean(body.note),

              amount,

              status:
                "pending",

              pending_expires_at:
                pendingExpiresAt

            })
        }
      );


      const paystackResponse =
        await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${secret}`,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                email,

                amount:
                  String(amount),

                currency:
                  "NGN",

                reference:
                  appointmentReference,

                callback_url:
                  callbackUrl,

                metadata: {
                  appointment_reference:
                    appointmentReference
                }

              })
          }
        );


      const result =
        await paystackResponse.json();


      if (
        !paystackResponse.ok ||
        !result.status
      ) {

        await database(
          `appointments?reference=eq.${encodeURIComponent(
            appointmentReference
          )}`,
          {
            method: "PATCH",

            body:
              JSON.stringify({
                status:
                  "payment_failed"
              })
          }
        );

        throw new Error(
          result.message ||
          "Paystack could not initialize the transaction."
        );
      }


      return res.status(200).json({

        accessCode:
          result.data.access_code,

        authorizationUrl:
          result.data.authorization_url,

        reference:
          appointmentReference,

        amount

      });
    }


    /* =====================================
       HAIR TINTING
    ===================================== */

    if (service === "Hair Tinting") {

      if (!reference) {

        return res.status(400).json({
          message:
            "A Hair Tinting booking reference is required."
        });
      }


      /*
       * Only allow references generated
       * by the Hair Tinting quote system.
       */

      if (
        !reference.startsWith(
          "dml_tint_"
        )
      ) {

        return res.status(400).json({
          message:
            "Invalid Hair Tinting booking reference."
        });
      }


      /*
       * Find the customer's quoted booking.
       */

      const bookingResponse =
        await database(
          `appointments?reference=eq.${encodeURIComponent(
            reference
          )}&user_id=eq.${encodeURIComponent(
            user.id
          )}&service=eq.Hair%20Tinting&select=reference,user_id,service,customer_email,amount,quoted_amount,status`,
          {
            method: "GET"
          }
        );


      const bookings =
        await bookingResponse.json();


      const booking =
        bookings?.[0];


      if (!booking) {

        return res.status(404).json({
          message:
            "Hair Tinting booking not found."
        });
      }


      /*
       * The customer MUST use the price
       * set by the admin.
       *
       * Never trust a price sent from
       * the customer's browser.
       */

      const quotedAmount =
        Number(
          booking.quoted_amount
        );


      if (
        !Number.isFinite(
          quotedAmount
        ) ||
        !Number.isInteger(
          quotedAmount
        ) ||
        quotedAmount < 10000
      ) {

        return res.status(400).json({
          message:
            "Your Hair Tinting price has not been set yet. Please wait for DML Urban Trim to confirm the price."
        });
      }


      /*
       * The booking must already have
       * been quoted by the admin.
       */

      if (
        booking.status !== "quoted"
      ) {

        return res.status(400).json({
          message:
            "Your Hair Tinting price is not ready for payment yet."
        });
      }


      amount =
        quotedAmount;


      appointmentReference =
        reference;


      const protocol =
        req.headers["x-forwarded-proto"] ||
        "https";


      const siteUrl =
        (
          process.env.SITE_URL ||
          `${protocol}://${req.headers.host}`
        ).replace(/\/$/, "");


      const callbackUrl =
        `${siteUrl}/payment-success.html?reference=${encodeURIComponent(
          appointmentReference
        )}`;


      /*
       * Start Paystack using the exact
       * amount saved by the admin.
       */

      const paystackResponse =
        await fetch(
          "https://api.paystack.co/transaction/initialize",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${secret}`,

              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({

                email:
                  booking.customer_email ||
                  user.email,

                amount:
                  String(amount),

                currency:
                  "NGN",

                reference:
                  appointmentReference,

                callback_url:
                  callbackUrl,

                metadata: {

                  appointment_reference:
                    appointmentReference,

                  service:
                    "Hair Tinting",

                  quoted_amount:
                    amount

                }

              })
          }
        );


      const result =
        await paystackResponse.json();


      if (
        !paystackResponse.ok ||
        !result.status
      ) {

        throw new Error(
          result.message ||
          "Paystack could not initialize the Hair Tinting payment."
        );
      }


      return res.status(200).json({

        accessCode:
          result.data.access_code,

        authorizationUrl:
          result.data.authorization_url,

        reference:
          appointmentReference,

        amount

      });
    }


    /* =====================================
       INVALID SERVICE
    ===================================== */

    return res.status(400).json({
      message:
        "Invalid booking service."
    });


  } catch (error) {

    console.error(
      "Booking initialization error:",
      error
    );


    const unavailable =
      String(
        error.message
      ).includes(
        "duplicate key"
      );


    return res.status(
      unavailable ? 409 : 500
    ).json({

      message:
        unavailable
          ? "That appointment time is no longer available."
          : error.message ||
            "Unable to start payment."

    });

  }

};
