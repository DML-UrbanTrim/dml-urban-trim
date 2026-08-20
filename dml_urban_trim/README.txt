DML Urban Trim
===============

This version keeps the existing website design and adds the first real payment layer for paid Haircut bookings.

Important:
- Haircut is ₦7,000 and is prepared for Paystack checkout.
- Hair Tinting remains quote-based because its price depends on hair size.
- Never put your Paystack secret key inside HTML or browser JavaScript.

Setup:
1. Install Node.js 18+.
2. Copy .env.example to .env.
3. Put your Paystack public and secret keys in .env.
4. Start the site with: npm start
5. Open: http://localhost:3000

Haircut slots are reserved before checkout and confirmed only after Paystack sends a verified payment webhook.

BOOKING DATABASE (SUPABASE)
1. Create a Supabase project and open its SQL Editor.
2. Run the complete contents of supabase-schema.sql.
3. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to your Vercel environment variables.
   The service-role key is server-only: never place it in HTML or browser JavaScript.
4. In your Paystack dashboard, set the webhook URL to:
   https://your-domain.com/api/paystack-webhook

The API holds a haircut time for 15 minutes while payment is pending. A verified
Paystack charge.success webhook changes the appointment to confirmed.


LOCAL TESTING
1. Install Node.js if it is not already installed.
2. Put your Paystack keys in the .env environment variables when you deploy/run the payment server.
3. On Windows, double-click start-local.bat.
4. Open http://localhost:3000 (do not open booking.html directly).

HAIR TINTING
Hair Tinting sends the customer's booking details to DML Urban Trim on WhatsApp at 07051679159 for a custom quote.
