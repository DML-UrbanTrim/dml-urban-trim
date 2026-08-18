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

The real booking database/availability layer will be added separately so a paid transaction is not mistaken for a confirmed appointment until the availability system is in place.


LOCAL TESTING
1. Install Node.js if it is not already installed.
2. Put your Paystack keys in the .env environment variables when you deploy/run the payment server.
3. On Windows, double-click start-local.bat.
4. Open http://localhost:3000 (do not open booking.html directly).

HAIR TINTING
Hair Tinting sends the customer's booking details to DML Urban Trim on WhatsApp at 07051679159 for a custom quote.
