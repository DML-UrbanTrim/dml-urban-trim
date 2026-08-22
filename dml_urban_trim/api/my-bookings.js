async function getUser(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = req.headers.authorization;

  if (!url || !key || !authorization?.startsWith("Bearer ")) {
    return null;
  }

  const response = await fetch(
    `${url.replace(/\/$/, "")}/auth/v1/user`,
    {
      headers: {
        apikey: key,
        Authorization: authorization
      }
    }
  );

  return response.ok ? response.json() : null;
}


module.exports = async function handler(req, res) {

  if (req.method !== "GET") {
    return res.status(405).json({
      message: "Method not allowed"
    });
  }


  try {

    const user = await getUser(req);


    if (!user?.id) {
      return res.status(401).json({
        message: "Please sign in to view your bookings."
      });
    }


    const url =
      process.env.SUPABASE_URL.replace(/\/$/, "");

    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY;


    /*
     * IMPORTANT:
     *
     * quoted_amount is included here so that
     * when the admin sets a Hair Tinting price,
     * the customer's My Bookings page receives
     * that price.
     */

    const fields = [
      "reference",
      "service",
      "appointment_date",
      "appointment_time",
      "status",
      "amount",
      "quoted_amount",
      "created_at"
    ].join(",");


    const response = await fetch(
      `${url}/rest/v1/appointments?user_id=eq.${encodeURIComponent(
        user.id
      )}&select=${fields}&order=created_at.desc`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`
        }
      }
    );


    if (!response.ok) {
      throw new Error(
        await response.text()
      );
    }


    const appointments =
      await response.json();


    /*
     * Return the bookings exactly as they
     * are stored in the database.
     *
     * This means the customer can receive:
     *
     * - Haircut amount
     * - Hair Tinting quoted amount
     * - Booking status
     * - Appointment date
     * - Appointment time
     */

    return res.status(200).json({
      appointments
    });


  } catch (error) {

    console.error(
      "Booking history error:",
      error
    );


    return res.status(500).json({
      message:
        "Unable to load your bookings."
    });

  }

};