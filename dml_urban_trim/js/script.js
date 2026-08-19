const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });

  siteNav.querySelectorAll("a").forEach(link => {
    link.addEventListener("click", () => {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    });
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => observer.observe(el));

const yearElement = document.querySelector(".year");
if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


/* Booking form interactions */
const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {
  const serviceChoices = bookingForm.querySelectorAll(".service-choice");
  const dateInput = document.getElementById("bookingDate");
  const timeInput = document.getElementById("bookingTime");

  const summaryService = document.getElementById("summaryService");
  const summaryServiceLine = document.getElementById("summaryServiceLine");
  const summaryDate = document.getElementById("summaryDate");
  const summaryTime = document.getElementById("summaryTime");
  const summaryPrice = document.getElementById("summaryPrice");
  const summaryStatus = document.getElementById("summaryStatus");
  const bookingSummary = document.getElementById("bookingSummary");
  const bookingMessage = document.getElementById("bookingMessage");

  const submitButton = bookingForm.querySelector(".booking-submit");

  const customerName = document.getElementById("customerName");
  const customerPhone = document.getElementById("customerPhone");
  const customerEmail = document.getElementById("customerEmail");
  const customerAddress = document.getElementById("customerAddress");
  const bookingNote = document.getElementById("bookingNote");

  const tintColorGroup = document.getElementById("tintColorGroup");
  const tintColorInput = document.getElementById("tintColor");

  let selectedService = "";
  let selectedPrice = null;

  const today = new Date();

  const localToday = new Date(
    today.getTime() - today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  dateInput.min = localToday;


  function formatDate(value) {
    if (!value) {
      return "Not selected";
    }

    const date = new Date(value + "T00:00:00");

    return date.toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }


  function updateSummary() {
    if (!selectedService) {
      summaryService.textContent = "Choose a service";
      summaryServiceLine.textContent = "Not selected";
      summaryPrice.textContent = "Not selected";
    } else {
      summaryService.textContent = selectedService;
      summaryServiceLine.textContent = selectedService;

      summaryPrice.textContent =
        selectedPrice > 0
          ? `₦${selectedPrice.toLocaleString("en-NG")}`
          : "Contact for price";
    }

    summaryDate.textContent = formatDate(dateInput.value);
    summaryTime.textContent = timeInput.value || "Not selected";

    const ready = Boolean(
      selectedService &&
      dateInput.value &&
      timeInput.value
    );

    summaryStatus.textContent = !selectedService
      ? "Choose Haircut or Hair Tinting to continue."
      : ready
        ? "Your preferred slot is selected. Complete your details below."
        : "Select your date and time to continue.";

    bookingSummary.classList.toggle("is-ready", ready);
  }


  serviceChoices.forEach(choice => {
    choice.addEventListener("click", () => {

      serviceChoices.forEach(item => {
        item.classList.remove("selected");
        item.setAttribute("aria-pressed", "false");
      });

      choice.classList.add("selected");
      choice.setAttribute("aria-pressed", "true");

      selectedService = choice.dataset.service;
      selectedPrice = Number(choice.dataset.price) || 0;

      const isTinting = selectedService === "Hair Tinting";

      tintColorGroup.hidden = !isTinting;
      tintColorInput.required = isTinting;

      if (!isTinting) {
        tintColorInput.value = "";
      }

      bookingMessage.textContent = "";

      updateSummary();
    });
  });


  dateInput.addEventListener("change", updateSummary);
  timeInput.addEventListener("change", updateSummary);


  async function startHaircutPayment() {

    const response = await fetch("/api/paystack/initialize", {
      method: "POST",

      headers: {
        "Content-Type": "application/json"
      },

      body: JSON.stringify({
        service: "Haircut",
        amount: 7000,
        email: customerEmail.value.trim(),
        name: customerName.value.trim(),
        phone: customerPhone.value.trim(),
        address: customerAddress.value.trim(),
        date: dateInput.value,
        time: timeInput.value,
        note: bookingNote.value.trim()
      })
    });


    let data;

    try {
      data = await response.json();
    } catch {
      throw new Error(
        "The payment server returned an invalid response."
      );
    }


    if (!response.ok || !data.accessCode) {
      throw new Error(
        data.message ||
        "Unable to start payment. Please try again."
      );
    }


    if (typeof PaystackPop === "undefined") {
      throw new Error(
        "Paystack could not be loaded. Please refresh the page and try again."
      );
    }


    const popup = new PaystackPop();

    popup.resumeTransaction(data.accessCode);
  }


  bookingForm.addEventListener("submit", async event => {

    event.preventDefault();

    bookingMessage.textContent = "";


    if (!selectedService) {
      bookingMessage.textContent =
        "Please select Haircut or Hair Tinting first.";

      return;
    }


    if (!bookingForm.checkValidity()) {
      bookingForm.reportValidity();

      return;
    }


    /*
     * HAIR TINTING
     * Sends only the requested color and location to WhatsApp.
     */
    if (selectedService === "Hair Tinting") {

      const tintColor = tintColorInput.value.trim();
      const address = customerAddress.value.trim();

      const message = [
        "Hello DML Urban Trim 👋",
        "",
        "I would like to book a Hair Tinting appointment.",
        "",
        `Color I want: ${tintColor}`,
        `Location: ${address}`
      ].join("\n");


      const whatsappUrl =
        `https://wa.me/2347051679159?text=${encodeURIComponent(message)}`;


      window.location.href = whatsappUrl;

      return;
    }


    /*
     * HAIRCUT PAYMENT
     */
    submitButton.disabled = true;
    submitButton.classList.add("is-loading");

    const buttonArrow = submitButton.querySelector("span");

    if (buttonArrow) {
      buttonArrow.textContent = "…";
    }

    bookingMessage.textContent =
      "Preparing your secure payment…";


    try {

      await startHaircutPayment();

    } catch (error) {

      console.error("Payment initialization error:", error);

      bookingMessage.textContent =
        error.message ||
        "Unable to start payment. Please try again.";

    } finally {

      submitButton.disabled = false;
      submitButton.classList.remove("is-loading");

      if (buttonArrow) {
        buttonArrow.textContent = "→";
      }
    }
  });


  updateSummary();
}