async function getAuthenticatedUser(req) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const authorization = req.headers.authorization;
  if (!url || !key || !authorization?.startsWith("Bearer ")) return null;

  const response = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
    headers: { apikey: key, Authorization: authorization }
  });
  return response.ok ? response.json() : null;
}

function isAdmin(user) {
  return Boolean(user?.email && process.env.ADMIN_EMAIL &&
    user.email.toLowerCase() === process.env.ADMIN_EMAIL.trim().toLowerCase());
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

module.exports = { getAuthenticatedUser, isAdmin, database };
