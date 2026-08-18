const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_PUBLIC_KEY = process.env.PAYSTACK_PUBLIC_KEY;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".mp4": "video/mp4",
  ".txt": "text/plain; charset=utf-8"
};

function send(res, status, body, type = "application/json; charset=utf-8") {
  res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
  res.end(body);
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 100_000) req.destroy();
    });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function clean(value, max = 500) {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

async function initializePaystack(data) {
  if (!PAYSTACK_SECRET_KEY || !PAYSTACK_PUBLIC_KEY) {
    throw new Error("Paystack keys are not configured on the server yet.");
  }

  const payload = {
    email: clean(data.email, 160),
    amount: "700000",
    currency: "NGN",
    metadata: JSON.stringify({
      service: "Haircut",
      customer_name: clean(data.name, 120),
      phone: clean(data.phone, 40),
      address: clean(data.address, 300),
      appointment_date: clean(data.date, 20),
      appointment_time: clean(data.time, 30),
      note: clean(data.note, 500)
    })
  };

  if (!payload.email || !payload.email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok || !result.status) {
    throw new Error(result.message || "Paystack could not initialize the transaction.");
  }

  return {
    accessCode: result.data.access_code,
    reference: result.data.reference,
    publicKey: PAYSTACK_PUBLIC_KEY
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "POST" && req.url === "/api/paystack/initialize") {
      const data = await readJson(req);
      if (data.service !== "Haircut") {
        return send(res, 400, JSON.stringify({ message: "Only paid haircut bookings can be checked out here." }));
      }
      const payment = await initializePaystack(data);
      return send(res, 200, JSON.stringify(payment));
    }

    if (req.method !== "GET") {
      return send(res, 405, JSON.stringify({ message: "Method not allowed" }));
    }

    let requested = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
    if (requested === "/") requested = "/index.html";
    const filePath = path.normalize(path.join(ROOT, requested));
    if (!filePath.startsWith(ROOT)) return send(res, 403, "Forbidden", "text/plain; charset=utf-8");

    fs.readFile(filePath, (err, content) => {
      if (err) return send(res, 404, "Not found", "text/plain; charset=utf-8");
      send(res, 200, content, MIME[path.extname(filePath).toLowerCase()] || "application/octet-stream");
    });
  } catch (error) {
    console.error(error);
    send(res, 500, JSON.stringify({ message: error.message || "Server error" }));
  }
});

server.listen(PORT, () => console.log(`DML Urban Trim running at http://localhost:${PORT}`));
