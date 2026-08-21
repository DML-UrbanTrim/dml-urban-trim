(function () {
  const config = window.DML_SUPABASE_CONFIG || {};
  const configured = config.url && config.anonKey &&
    !config.url.startsWith("PASTE_") &&
    !config.anonKey.startsWith("PASTE_");

  window.dmlAuthReady = Promise.resolve(null);

  if (configured && window.supabase) {
    window.dmlSupabase = window.supabase.createClient(config.url, config.anonKey);
    window.dmlAuthReady = window.dmlSupabase.auth.getSession();
  }

  async function redirectGuests() {
    if (document.body.dataset.requireAuth !== "true") return;

    const sessionResult = await window.dmlAuthReady;
    if (!sessionResult || !sessionResult.data.session) {
      const next = encodeURIComponent(`${window.location.pathname.split("/").pop()}${window.location.search}`);
      window.location.replace(`account.html?next=${next}`);
      return;
    }

    const emailInput = document.getElementById("customerEmail");
    if (emailInput) {
      emailInput.value = sessionResult.data.session.user.email || "";
      emailInput.readOnly = true;
    }
  }

  redirectGuests();

  document.querySelectorAll(".auth-logout").forEach(button => {
    button.addEventListener("click", async event => {
      event.preventDefault();
      if (window.dmlSupabase) await window.dmlSupabase.auth.signOut();
      window.location.assign("account.html");
    });
  });
})();
