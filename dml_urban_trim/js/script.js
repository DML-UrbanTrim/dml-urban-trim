/* =========================================================
   DML URBAN TRIM
   MAIN WEBSITE JAVASCRIPT
   ========================================================= */


/* =========================================================
   AUTH LOADER
   ========================================================= */

if (!window.dmlAuthReady && !window.dmlAuthLoader) {

  const loadScript = source => new Promise((resolve, reject) => {

    const script = document.createElement("script");

    script.src = source;

    script.onload = resolve;

    script.onerror = reject;

    document.head.appendChild(script);

  });


  window.dmlAuthLoader = loadScript(
    "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"
  )
    .then(() => loadScript("js/supabase-config.js"))
    .then(() => loadScript("js/auth.js"))
    .catch(error => {

      console.warn(
        "Account controls could not be loaded:",
        error
      );

    });

}


/* =========================================================
   MOBILE MENU
   ========================================================= */

const menuToggle =
  document.querySelector(".menu-toggle");

const siteNav =
  document.querySelector(".site-nav");


if (menuToggle && siteNav) {

  menuToggle.addEventListener("click", () => {

    const open =
      siteNav.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      String(open)
    );

  });


  siteNav.querySelectorAll("a").forEach(link => {

    link.addEventListener("click", () => {

      siteNav.classList.remove("open");

      menuToggle.setAttribute(
        "aria-expanded",
        "false"
      );

    });

  });

}


/* =========================================================
   SCROLL REVEAL
   ========================================================= */

if ("IntersectionObserver" in window) {

  const observer =
    new IntersectionObserver(
      entries => {

        entries.forEach(entry => {

          if (entry.isIntersecting) {

            entry.target.classList.add("visible");

            observer.unobserve(
              entry.target
            );

          }

        });

      },
      {
        threshold: 0.12
      }
    );


  document
    .querySelectorAll(".reveal")
    .forEach(element => {

      observer.observe(element);

    });

}


/* =========================================================
   FOOTER YEAR
   ========================================================= */

const yearElement =
  document.querySelector(".year");


if (yearElement) {

  yearElement.textContent =
    new Date().getFullYear();

}


/* =========================================================
   BOOKING PAGE
   ========================================================= */

const bookingForm =
  document.getElementById("bookingForm");


if (bookingForm) {

  /* -------------------------------------------------------
     ELEMENTS
     ------------------------------------------------------- */

  const serviceChoices =
    bookingForm.querySelectorAll(
      ".service-choice"
    );


  const dateInput =
    document.getElementById(
      "bookingDate"
    );


  const timeInput =
    document.getElementById(
      "bookingTime"
    );


  const summaryService =
    document.getElementById(
      "summaryService"
    );


  const summaryServiceLine =
    document.getElementById(
      "summaryServiceLine"
    );


  const summaryDate =
    document.getElementById(
      "summaryDate"
    );


  const summaryTime =
    document.getElementById(
      "summaryTime"
    );


  const summaryPrice =
    document.getElementById(
      "summaryPrice"
    );


  const summaryStatus =
    document.getElementById(
      "summaryStatus"
    );


  const bookingSummary =
    document.getElementById(
      "bookingSummary"
    );


  const bookingMessage =
    document.getElementById(
      "bookingMessage"
    );


  const submitButton =
    bookingForm.querySelector(
      ".booking-submit"
    );


  const customerName =
    document.getElementById(
      "customerName"
    );


  const customerPhone =
    document.getElementById(
      "customerPhone"
    );


  const customerEmail =
    document.getElementById(
      "customerEmail"
    );


  const customerAddress =
    document.getElementById(
      "customerAddress"
    );


  const bookingNote =
    document.getElementById(
      "bookingNote"
    );


  const tintColorGroup =
    document.getElementById(
      "tintColorGroup"
    );


  const tintColorInput =
    document.getElementById(
      "tintColor"
    );


  /* -------------------------------------------------------
     SELECTED SERVICE
     ------------------------------------------------------- */

  let selectedService = "";

  let selectedPrice = 0;


  /* =======================================================
     DATE
     ======================================================= */

  const today =
    new Date();


  const localToday =
    new Date(
      today.getTime() -
      today.getTimezoneOffset() * 60000
    )
      .toISOString()
      .split("T")[0];


  if (dateInput) {

    dateInput.min =
      localToday;

  }


  /* =======================================================
     DATE FORMAT
     ======================================================= */

  function formatDate(value) {

    if (!value) {

      return "Not selected";

    }


    const date =
      new Date(
        `${value}T00:00:00`
      );


    if (Number.isNaN(date.getTime())) {

      return "Not selected";

    }


    return date.toLocaleDateString(
      "en-NG",
      {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric"
      }
    );

  }


  /* =======================================================
     BOOKING SUMMARY
     ======================================================= */

  function updateSummary() {

    if (!selectedService) {

      summaryService.textContent =
        "Choose a service";


      summaryServiceLine.textContent =
        "Not selected";


      summaryPrice.textContent =
        "Not selected";

    } else {

      summaryService.textContent =
        selectedService;


      summaryServiceLine.textContent =
        selectedService;


      if (selectedPrice > 0) {

        summaryPrice.textContent =
          `₦${selectedPrice.toLocaleString("en-NG")}`;

      } else {

        summaryPrice.textContent =
          "Contact for price";

      }

    }


    if (dateInput) {

      summaryDate.textContent =
        formatDate(
          dateInput.value
        );

    }


    if (timeInput) {

      summaryTime.textContent =
        timeInput.value ||
        "Not selected";

    }


    const ready =
      Boolean(
        selectedService &&
        dateInput?.value &&
        timeInput?.value
      );


    if (!selectedService) {

      summaryStatus.textContent =
        "Choose Haircut or Hair Tinting to continue.";

    } else if (ready) {

      summaryStatus.textContent =
        "Your preferred slot is selected. Complete your details below.";

    } else {

      summaryStatus.textContent =
        "Select your date and time to continue.";

    }


    if (bookingSummary) {

      bookingSummary.classList.toggle(
        "is-ready",
        ready
      );

    }

  }


  /* =======================================================
     SERVICE SELECTION
     ======================================================= */

  serviceChoices.forEach(choice => {

    choice.addEventListener(
      "click",
      () => {

        serviceChoices.forEach(item => {

          item.classList.remove(
            "selected"
          );


          item.setAttribute(
            "aria-pressed",
            "false"
          );

        });


        choice.classList.add(
          "selected"
        );


        choice.setAttribute(
          "aria-pressed",
          "true"
        );


        selectedService =
          choice.dataset.service ||
          "";


        selectedPrice =
          Number(
            choice.dataset.price
          ) || 0;


        const isTinting =
          selectedService ===
          "Hair Tinting";


        if (tintColorGroup) {

          tintColorGroup.hidden =
            !isTinting;

        }


        if (tintColorInput) {

          tintColorInput.required =
            isTinting;


          if (!isTinting) {

            tintColorInput.value =
              "";

          }

        }


        if (bookingMessage) {

          bookingMessage.textContent =
            "";

        }


        updateSummary();

      }
    );

  });


  /* =======================================================
     DATE / TIME CHANGES
     ======================================================= */

  if (dateInput) {

    dateInput.addEventListener(
      "change",
      updateSummary
    );

  }


  if (timeInput) {

    timeInput.addEventListener(
      "change",
      updateSummary
    );

  }


  /* =======================================================
     PAYSTACK - HAIRCUT PAYMENT
     ======================================================= */

  async function startHaircutPayment() {

    if (!window.dmlSupabase) {

      throw new Error(
        "Please sign in before continuing to payment."
      );

    }


    const {
      data: sessionData
    } =
      await window.dmlSupabase.auth.getSession();


    const session =
      sessionData?.session;


    if (!session) {

      window.location.assign(
        "account.html?next=booking.html"
      );


      throw new Error(
        "Please sign in before continuing to payment."
      );

    }


    const response =
      await fetch(
        "/api/paystack",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${session.access_token}`
          },

          body: JSON.stringify({

            service:
              "Haircut",

            amount:
              7000,

            email:
              customerEmail
                ? customerEmail.value.trim()
                : "",

            name:
              customerName
                ? customerName.value.trim()
                : "",

            phone:
              customerPhone
                ? customerPhone.value.trim()
                : "",

            address:
              customerAddress
                ? customerAddress.value.trim()
                : "",

            date:
              dateInput
                ? dateInput.value
                : "",

            time:
              timeInput
                ? timeInput.value
                : "",

            note:
              bookingNote
                ? bookingNote.value.trim()
                : ""

          })

        }
      );


    let data;


    try {

      data =
        await response.json();

    } catch {

      throw new Error(
        "The payment server returned an invalid response."
      );

    }


    if (
      !response.ok ||
      !data.accessCode ||
      !data.reference
    ) {

      throw new Error(
        data.message ||
        "Unable to start payment. Please try again."
      );

    }


    if (
      typeof PaystackPop ===
      "undefined"
    ) {

      throw new Error(
        "Paystack could not be loaded. Please refresh the page and try again."
      );

    }


    const popup =
      new PaystackPop();


    popup.resumeTransaction(
      data.accessCode
    );


    watchForPaymentConfirmation(
      data.reference
    );

  }


  /* =======================================================
     PAYSTACK PAYMENT STATUS
     ======================================================= */

  function watchForPaymentConfirmation(
    reference
  ) {

    const startedAt =
      Date.now();


    const timeoutMs =
      5 * 60 * 1000;


    const checkPayment =
      async () => {

        try {

          const response =
            await fetch(
              `/api/paystack-verify?reference=${encodeURIComponent(reference)}`
            );


          if (response.ok) {

            window.location.assign(
              `payment-success.html?reference=${encodeURIComponent(reference)}`
            );


            return;

          }

        } catch (error) {

          console.warn(
            "Payment confirmation check failed:",
            error
          );

        }


        if (
          Date.now() -
          startedAt <
          timeoutMs
        ) {

          window.setTimeout(
            checkPayment,
            3000
          );

        }

      };


    window.setTimeout(
      checkPayment,
      3000
    );

  }


  /* =======================================================
     FORM SUBMISSION
     ======================================================= */

  bookingForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      if (bookingMessage) {

        bookingMessage.textContent =
          "";

      }


      /* ---------------------------------------------------
         SERVICE CHECK
         --------------------------------------------------- */

      if (!selectedService) {

        bookingMessage.textContent =
          "Please select Haircut or Hair Tinting first.";

        return;

      }


      /* ---------------------------------------------------
         FORM VALIDATION
         --------------------------------------------------- */

      if (
        !bookingForm.checkValidity()
      ) {

        bookingForm.reportValidity();

        return;

      }


      /* ===================================================
         HAIR TINTING
         =================================================== */

      if (
        selectedService ===
        "Hair Tinting"
      ) {

        const tintColor =
          tintColorInput
            ? tintColorInput.value.trim()
            : "";


        const address =
          customerAddress
            ? customerAddress.value.trim()
            : "";


        const name =
          customerName
            ? customerName.value.trim()
            : "";


        const phone =
          customerPhone
            ? customerPhone.value.trim()
            : "";


        const email =
          customerEmail
            ? customerEmail.value.trim()
            : "";


        const date =
          dateInput
            ? dateInput.value
            : "";


        const time =
          timeInput
            ? timeInput.value
            : "";


        const note =
          bookingNote
            ? bookingNote.value.trim()
            : "";


        /* -------------------------------------------------
           CHECK SUPABASE
           ------------------------------------------------- */

        if (!window.dmlSupabase) {

          bookingMessage.textContent =
            "Please sign in before making a booking.";

          return;

        }


        /* -------------------------------------------------
           GET CUSTOMER SESSION
           ------------------------------------------------- */

        const {
          data: tintSessionData
        } =
          await window.dmlSupabase.auth.getSession();


        const tintSession =
          tintSessionData?.session;


        if (!tintSession) {

          window.location.assign(
            "account.html?next=booking.html"
          );

          return;

        }


        /* -------------------------------------------------
           SEND TINTING REQUEST TO SERVER
           ------------------------------------------------- */

        if (submitButton) {

          submitButton.disabled =
            true;

          submitButton.classList.add(
            "is-loading"
          );

        }


        const buttonArrow =
          submitButton
            ? submitButton.querySelector("span")
            : null;


        if (buttonArrow) {

          buttonArrow.textContent =
            "…";

        }


        if (bookingMessage) {

          bookingMessage.textContent =
            "Preparing your tinting request…";

        }


        let quoteData;


        try {

          const quoteResponse =
            await fetch(
              "/api/tinting-request",
              {
                method: "POST",

                headers: {

                  "Content-Type":
                    "application/json",

                  Authorization:
                    `Bearer ${tintSession.access_token}`

                },

                body: JSON.stringify({

                  name,

                  phone,

                  email,

                  address,

                  tintColor,

                  date,

                  time,

                  note

                })

              }
            );


          try {

            quoteData =
              await quoteResponse.json();

          } catch {

            throw new Error(
              "The tinting server returned an invalid response."
            );

          }


          if (!quoteResponse.ok) {

            throw new Error(
              quoteData.message ||
              "Unable to send your tinting request."
            );

          }


          if (!quoteData.reference) {

            throw new Error(
              "The tinting request was created without a booking reference."
            );

          }

        } catch (error) {

          console.error(
            "Tinting request error:",
            error
          );


          if (bookingMessage) {

            bookingMessage.textContent =
              error.message ||
              "Unable to send your tinting request.";

          }


          if (submitButton) {

            submitButton.disabled =
              false;

            submitButton.classList.remove(
              "is-loading"
            );

          }


          if (buttonArrow) {

            buttonArrow.textContent =
              "→";

          }


          return;

        }


        /* -------------------------------------------------
           CREATE WHATSAPP MESSAGE
           ------------------------------------------------- */

        const whatsappMessage = [

          "Hey DML Urban Trim 💈",

          "",

          "I would like to book a Hair Tinting appointment.",

          "",

          `Name: ${name}`,

          `Phone: ${phone}`,

          `Email: ${email}`,

          `Color I want: ${tintColor}`,

          `Booking reference: ${quoteData.reference}`,

          `Location: ${address}`,

          `Date: ${formatDate(date)}`,

          `Time: ${time}`,

          note
            ? `Note: ${note}`
            : ""

        ]
          .filter(Boolean)
          .join("\n");


        /* -------------------------------------------------
           CREATE WHATSAPP URL
           ------------------------------------------------- */

        const whatsappUrl =
          `https://wa.me/2347051679159?text=${encodeURIComponent(
            whatsappMessage
          )}`;


        /* -------------------------------------------------
           OPEN WHATSAPP
           ------------------------------------------------- */

        window.open(
          whatsappUrl,
          "_blank",
          "noopener,noreferrer"
        );


        /* -------------------------------------------------
           SHOW SUCCESS MESSAGE
           ------------------------------------------------- */

        if (bookingMessage) {

          bookingMessage.textContent =
            "Your tinting request has been sent. Opening WhatsApp…";

        }


        /* -------------------------------------------------
           GO TO QUOTE PENDING PAGE
           ------------------------------------------------- */

        window.setTimeout(() => {

          window.location.assign(
            `quote-pending.html?reference=${encodeURIComponent(
              quoteData.reference
            )}`
          );

        }, 700);


        return;

      }


      /* ===================================================
         HAIRCUT PAYMENT
         =================================================== */

      if (submitButton) {

        submitButton.disabled =
          true;


        submitButton.classList.add(
          "is-loading"
        );

      }


      const buttonArrow =
        submitButton
          ? submitButton.querySelector("span")
          : null;


      if (buttonArrow) {

        buttonArrow.textContent =
          "…";

      }


      if (bookingMessage) {

        bookingMessage.textContent =
          "Preparing your secure payment…";

      }


      try {

        await startHaircutPayment();


        if (bookingMessage) {

          bookingMessage.textContent =
            "";

        }

      } catch (error) {

        console.error(
          "Payment initialization error:",
          error
        );


        if (bookingMessage) {

          bookingMessage.textContent =
            error.message ||
            "Unable to start payment. Please try again.";

        }

      } finally {

        if (submitButton) {

          submitButton.disabled =
            false;


          submitButton.classList.remove(
            "is-loading"
          );

        }


        if (buttonArrow) {

          buttonArrow.textContent =
            "→";

        }

      }

    }
  );


  /* =======================================================
     INITIAL SUMMARY
     ======================================================= */

  updateSummary();

}
