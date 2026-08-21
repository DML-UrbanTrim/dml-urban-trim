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

  function showLoginPrompt() {
    let prompt = document.getElementById("authLoginPrompt");

    if (!prompt) {
      prompt = document.createElement("div");
      prompt.id = "authLoginPrompt";
      prompt.setAttribute("role", "status");
      Object.assign(prompt.style, {
        position: "fixed",
        right: "20px",
        bottom: "20px",
        zIndex: "9999",
        maxWidth: "340px",
        padding: "16px 18px",
        borderRadius: "10px",
        color: "#fff",
        background: "#1b1b1b",
        border: "1px solid rgba(255,255,255,.2)",
        boxShadow: "0 12px 35px rgba(0,0,0,.3)"
      });
      document.body.appendChild(prompt);
    }

    prompt.innerHTML = 'Please log in first before booking. <a href="account.html" style="color:#d6aa59;font-weight:700">Log in</a>';
    window.clearTimeout(window.dmlLoginPromptTimer);
    window.dmlLoginPromptTimer = window.setTimeout(() => prompt.remove(), 5000);
  }

  async function updateNavigation() {
    const sessionResult = await window.dmlAuthReady;
    const signedIn = Boolean(sessionResult?.data?.session);
    const nav = document.querySelector(".site-nav");

    if (nav && !nav.querySelector(".auth-login")) {
      nav.insertAdjacentHTML("beforeend", `
        <a class="nav-book auth-login" href="account.html">Log in</a>
        <a class="nav-book auth-logout" href="account.html" hidden>Log out</a>
      `);
    }

    document.querySelectorAll(".auth-login").forEach(link => {
      link.hidden = signedIn;
    });

    document.querySelectorAll(".auth-logout").forEach(link => {
      link.hidden = !signedIn;
    });

    document.addEventListener("click", event => {
      const bookingLink = event.target.closest('a[href="booking.html"], a[href$="/booking.html"], [data-requires-auth]');
      if (!bookingLink || signedIn) return;

      event.preventDefault();
      showLoginPrompt();
    });
  }

  updateNavigation();

  document.addEventListener("click", async event => {
    const button = event.target.closest(".auth-logout");
    if (!button) return;

    event.preventDefault();
    if (window.dmlSupabase) await window.dmlSupabase.auth.signOut();
    window.location.assign("index.html");
  });
})();
