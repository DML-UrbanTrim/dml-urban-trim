(function () {
  const config = window.DML_SUPABASE_CONFIG || {};

  const configured =
    config.url &&
    config.anonKey &&
    !config.url.startsWith("PASTE_") &&
    !config.anonKey.startsWith("PASTE_");

  window.dmlAuthReady = Promise.resolve(null);

  /*
   * SUPABASE
   */
  if (configured && window.supabase) {
    window.dmlSupabase = window.supabase.createClient(
      config.url,
      config.anonKey
    );

    window.dmlAuthReady =
      window.dmlSupabase.auth.getSession();
  }


  /*
   * REDIRECT GUESTS FROM PROTECTED PAGES
   */
  async function redirectGuests() {
    if (
      document.body.dataset.requireAuth !== "true"
    ) {
      return;
    }

    const sessionResult =
      await window.dmlAuthReady;

    if (
      !sessionResult ||
      !sessionResult.data ||
      !sessionResult.data.session
    ) {
      const currentPage =
        window.location.pathname
          .split("/")
          .pop();

      const next =
        encodeURIComponent(
          `${currentPage}${window.location.search}`
        );

      window.location.replace(
        `account.html?next=${next}`
      );

      return;
    }

    /*
     * If the booking form has a customer
     * email field, automatically use the
     * logged-in customer's email.
     */
    const emailInput =
      document.getElementById("customerEmail");

    if (emailInput) {
      emailInput.value =
        sessionResult.data.session.user.email || "";

      emailInput.readOnly = true;
    }
  }


  redirectGuests();


  /*
   * ADMIN CHECK
   */
  async function redirectAdmin() {
    const sessionResult =
      await window.dmlAuthReady;

    const session =
      sessionResult?.data?.session;

    const currentPage =
      window.location.pathname
        .split("/")
        .pop();

    /*
     * Do not run the admin check while
     * already on the admin page.
     */
    if (
      !session ||
      currentPage === "admin-tinting.html"
    ) {
      return;
    }

    try {
      const response = await fetch(
        "/api/admin-tinting",
        {
          headers: {
            Authorization:
              `Bearer ${session.access_token}`
          }
        }
      );

      if (response.ok) {
        window.location.replace(
          "admin-tinting.html"
        );
      }
    } catch (error) {
      console.warn(
        "Admin account check failed:",
        error
      );
    }
  }


  redirectAdmin();


  /*
   * LOGIN PROMPT
   */
  function showLoginPrompt() {
    let prompt =
      document.getElementById(
        "authLoginPrompt"
      );

    if (!prompt) {
      prompt =
        document.createElement("div");

      prompt.id =
        "authLoginPrompt";

      prompt.setAttribute(
        "role",
        "status"
      );

      Object.assign(
        prompt.style,
        {
          position: "fixed",
          right: "20px",
          bottom: "20px",
          zIndex: "9999",
          maxWidth: "340px",
          padding: "16px 18px",
          borderRadius: "10px",
          color: "#fff",
          background: "#1b1b1b",
          border:
            "1px solid rgba(255,255,255,.2)",
          boxShadow:
            "0 12px 35px rgba(0,0,0,.3)"
        }
      );

      document.body.appendChild(prompt);
    }

    prompt.innerHTML =
      'Please log in first before booking. ' +
      '<a href="account.html" ' +
      'style="color:#d6aa59;font-weight:700">' +
      'Log in</a>';

    window.clearTimeout(
      window.dmlLoginPromptTimer
    );

    window.dmlLoginPromptTimer =
      window.setTimeout(
        () => prompt.remove(),
        5000
      );
  }


  /*
   * NAVIGATION
   *
   * When logged out:
   *   Log in
   *
   * When logged in:
   *   My Bookings
   *   Log out
   *
   * My Bookings is therefore visible directly
   * from the customer's navigation.
   */
  async function updateNavigation() {
    const sessionResult =
      await window.dmlAuthReady;

    const session =
      sessionResult?.data?.session;

    const signedIn =
      Boolean(session);

    const nav =
      document.querySelector(".site-nav");

    if (!nav) {
      return;
    }


    /*
     * Add Log In if it doesn't already exist.
     */
    if (
      !nav.querySelector(
        ".auth-login"
      )
    ) {
      nav.insertAdjacentHTML(
        "beforeend",
        `
          <a
            class="nav-book auth-login"
            href="account.html"
          >
            Log in
          </a>
        `
      );
    }


    /*
     * Add My Bookings if it doesn't
     * already exist.
     */
    if (
      !nav.querySelector(
        ".auth-bookings"
      )
    ) {
      nav.insertAdjacentHTML(
        "beforeend",
        `
          <a
            class="nav-book auth-bookings"
            href="my-bookings.html"
            hidden
          >
            My Bookings
          </a>
        `
      );
    }


    /*
     * Add Log Out if it doesn't
     * already exist.
     */
    if (
      !nav.querySelector(
        ".auth-logout"
      )
    ) {
      nav.insertAdjacentHTML(
        "beforeend",
        `
          <a
            class="nav-book auth-logout"
            href="account.html"
            hidden
          >
            Log out
          </a>
        `
      );
    }


    /*
     * LOGIN
     */
    document
      .querySelectorAll(
        ".auth-login"
      )
      .forEach(link => {
        link.hidden = signedIn;
      });


    /*
     * MY BOOKINGS
     */
    document
      .querySelectorAll(
        ".auth-bookings"
      )
      .forEach(link => {
        link.hidden = !signedIn;
      });


    /*
     * LOGOUT
     */
    document
      .querySelectorAll(
        ".auth-logout"
      )
      .forEach(link => {
        link.hidden = !signedIn;
      });


    /*
     * Protect Book Now for customers
     * who are not logged in.
     */
    document.addEventListener(
      "click",
      event => {
        const bookingLink =
          event.target.closest(
            'a[href="booking.html"], ' +
            'a[href$="/booking.html"], ' +
            '[data-requires-auth]'
          );

        if (
          !bookingLink ||
          signedIn
        ) {
          return;
        }

        event.preventDefault();

        showLoginPrompt();
      }
    );
  }


  updateNavigation();


  /*
   * LOGOUT
   */
  document.addEventListener(
    "click",
    async event => {
      const button =
        event.target.closest(
          ".auth-logout"
        );

      if (!button) {
        return;
      }

      event.preventDefault();

      if (
        window.dmlSupabase
      ) {
        await window.dmlSupabase.auth.signOut();
      }

      window.location.assign(
        "index.html"
      );
    }
  );


  /*
   * KEEP NAVIGATION UPDATED WHEN
   * SUPABASE AUTH STATE CHANGES.
   */
  if (window.dmlSupabase) {
    window.dmlSupabase.auth.onAuthStateChange(
      () => {
        updateNavigation();
      }
    );
  }

})();
