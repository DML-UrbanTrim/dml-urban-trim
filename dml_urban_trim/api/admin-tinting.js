const {
  getAuthenticatedUser,
  isAdmin,
  database
} = require("./_auth");


module.exports = async function handler(
  req,
  res
) {

  try {

    const user =
      await getAuthenticatedUser(req);


    if (!isAdmin(user)) {

      return res.status(403).json({
        message:
          "Admin access is required."
      });
    }


    /* ================================
       GET ALL BOOKINGS
    ================================= */

    if (req.method === "GET") {

      const fields = [
        "reference",
        "customer_name",
        "customer_phone",
        "customer_email",
        "address",
        "latitude",
        "longitude",
        "service",
        "tint_color",
        "appointment_date",
        "appointment_time",
        "note",
        "status",
        "amount",
        "quoted_amount",
        "quote_set_at",
        "paid_at",
        "paystack_transaction_id",
        "created_at"
      ].join(",");


      const response =
        await database(
          `appointments?select=${fields}&order=created_at.desc`
        );


      const appointments =
        await response.json();


      return res.status(200).json({
        appointments
      });
    }


    /* ================================
       SET TINTING PRICE
    ================================= */

    if (req.method === "POST") {

      const reference =
        typeof req.body?.reference ===
        "string"
          ? req.body.reference.trim()
          : "";


      const amountNaira =
        Number(
          req.body?.amount
        );


      const amountKobo =
        Math.round(
          amountNaira * 100
        );


      /*
       * This endpoint is only for
       * Hair Tinting quote requests.
       */

      if (
        !reference.startsWith(
          "dml_tint_"
        )
      ) {

        return res.status(400).json({
          message:
            "This booking is not a Hair Tinting quote request."
        });
      }


      if (
        !Number.isFinite(
          amountNaira
        ) ||
        !Number.isInteger(
          amountKobo
        ) ||
        amountKobo < 10000
      ) {

        return res.status(400).json({
          message:
            "Enter a valid tinting price of at least ₦100."
        });
      }


      const response =
        await database(
          `appointments?reference=eq.${encodeURIComponent(reference)}&service=eq.Hair%20Tinting&status=eq.quote_pending`,
          {
            method: "PATCH",

            body: JSON.stringify({
              quoted_amount:
                amountKobo,

              amount:
                amountKobo,

              status:
                "quoted",

              quote_set_at:
                new Date().toISOString()
            })
          }
        );


      if (!response.ok) {

        throw new Error(
          await response.text()
        );
      }


      return res.status(200).json({
        message:
          "Price added. The customer can now pay from My Bookings."
      });
    }


    return res.status(405).json({
      message:
        "Method not allowed"
    });

  } catch (error) {

    console.error(
      "Admin booking error:",
      error
    );


    return res.status(500).json({
      message:
        "Unable to manage bookings."
    });
  }
};
