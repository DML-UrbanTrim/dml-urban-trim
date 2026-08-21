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


/* ================================
   SCROLL REVEAL
================================ */

const observer = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12 }
);

document.querySelectorAll(".reveal").forEach(element => {
  observer.observe(element);
});


/* ================================
   FOOTER YEAR
================================ */

const yearElement = document.querySelector(".year");

if (yearElement) {
  yearElement.textContent = new Date().getFullYear();
}


/* ================================
   BOOKING PAGE
================================ */

const bookingForm = document.getElementById("bookingForm");

if (bookingForm) {

  const serviceChoices =
    bookingForm.querySelectorAll(".service-choice");

  const dateInput =
    document.getElementById("bookingDate");

  const timeInput =
    document.getElementById("bookingTime");

  const summaryService =
    document.getElementById("summaryService");

  const summaryServiceLine =
    document.getElementById("summaryServiceLine");

  const summaryDate =
    document.getElementById("summaryDate");

  const summaryTime =
    document.getElementById("summaryTime");

  const summaryPrice =
    document.getElementById("summaryPrice");

  const summaryStatus =
    document.getElementById("summaryStatus");

  const bookingSummary =
    document.getElementById("bookingSummary");

  const bookingMessage =
    document.getElementById("bookingMessage");

  const submitButton =
    bookingForm.querySelector(".booking-submit");

  const customerName =
    document.getElementById("customerName");

  const customerPhone =
    document.getElementById("customerPhone");

  const customerEmail =
    document.getElementById("customerEmail");

  const customerAddress =
    document.getElementById("customerAddress");

  const customerLatitude =
    document.getElementById("customerLatitude");

  const customerLongitude =
    document.getElementById("customerLongitude");

  const bookingNote =
    document.getElementById("bookingNote");

  const tintColorGroup =
    document.getElementById("tintColorGroup");

  const tintColorInput =
    document.getElementById("tintColor");

  const useLocationButton =
    document.getElementById("useLocationButton");

  const locationStatus =
    document.getElementById("locationStatus");

  const bookingMapElement =
    document.getElementById("bookingMap");


  let selectedService = "";
  let selectedPrice = null;

  let bookingMap = null;
  let locationMarker = null;

  function isInOgbomoshoServiceArea(latitude, longitude) {

    const toRadians = value => value * Math.PI / 180;
    const latitudeDifference = toRadians(latitude - ogbomoshoCenter[0]);
    const longitudeDifference = toRadians(longitude - ogbomoshoCenter[1]);
    const a =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(toRadians(ogbomoshoCenter[0])) *
      Math.cos(toRadians(latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;
    const distance = 2 * 6371 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      distance <= serviceRadiusKm;
  }

  // Ogbomosho city centre. Increase this only if you expand your service area.
  const ogbomoshoCenter = [8.133, 4.244];
  const serviceRadiusKm = 20;

  function distanceFromOgbomosho(latitude, longitude) {

    const toRadians = value => value * Math.PI / 180;
    const earthRadiusKm = 6371;
    const latitudeDifference = toRadians(latitude - ogbomoshoCenter[0]);
    const longitudeDifference = toRadians(longitude - ogbomoshoCenter[1]);
    const a =
      Math.sin(latitudeDifference / 2) ** 2 +
      Math.cos(toRadians(ogbomoshoCenter[0])) *
      Math.cos(toRadians(latitude)) *
      Math.sin(longitudeDifference / 2) ** 2;

    return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function isInOgbomoshoServiceArea(latitude, longitude) {

    return Number.isFinite(latitude) &&
      Number.isFinite(longitude) &&
      distanceFromOgbomosho(latitude, longitude) <= serviceRadiusKm;
  }


  /* ================================
     DATE
  ================================= */

  const today = new Date();

  const localToday = new Date(
    today.getTime() -
    today.getTimezoneOffset() * 60000
  )
    .toISOString()
    .split("T")[0];

  if (dateInput) {
    dateInput.min = localToday;
  }


  /* ================================
     DATE FORMAT
  ================================= */

  function formatDate(value) {

    if (!value) {
      return "Not selected";
    }

    const date = new Date(
      value + "T00:00:00"
    );

    return date.toLocaleDateString("en-NG", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }


  /* ================================
     BOOKING SUMMARY
  ================================= */

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

      summaryPrice.textContent =
        selectedPrice > 0
          ? `₦${selectedPrice.toLocaleString("en-NG")}`
          : "Contact for price";
    }


    summaryDate.textContent =
      formatDate(dateInput.value);

    summaryTime.textContent =
      timeInput.value || "Not selected";


    const ready = Boolean(
      selectedService &&
      dateInput.value &&
      timeInput.value
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


    bookingSummary.classList.toggle(
      "is-ready",
      ready
    );
  }


  /* ================================
     SERVICE SELECTION
  ================================= */

  serviceChoices.forEach(choice => {

    choice.addEventListener("click", () => {

      serviceChoices.forEach(item => {

        item.classList.remove("selected");

        item.setAttribute(
          "aria-pressed",
          "false"
        );
      });


      choice.classList.add("selected");

      choice.setAttribute(
        "aria-pressed",
        "true"
      );


      selectedService =
        choice.dataset.service;

      selectedPrice =
        Number(choice.dataset.price) || 0;


      const isTinting =
        selectedService === "Hair Tinting";


      if (tintColorGroup) {
        tintColorGroup.hidden = !isTinting;
      }

      if (tintColorInput) {
        tintColorInput.required =
          isTinting;

        if (!isTinting) {
          tintColorInput.value = "";
        }
      }


      bookingMessage.textContent = "";

      updateSummary();
    });
  });


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


  /* ================================
     MAP
  ================================= */

  function setLocation(
    latitude,
    longitude,
    source = "map"
  ) {

    if (!bookingMap) {
      return;
    }

    if (!isInOgbomoshoServiceArea(latitude, longitude)) {

      locationStatus.textContent =
        "We currently serve Ogbomosho only. Please select a location within Ogbomosho.";

      return;
    }


    const latLng = [
      latitude,
      longitude
    ];


    if (locationMarker) {

      locationMarker.setLatLng(
        latLng
      );

    } else {

      locationMarker =
        L.marker(latLng, {
          draggable: true
        }).addTo(bookingMap);


      locationMarker.on(
        "dragend",
        () => {

          const position =
            locationMarker.getLatLng();

          saveCoordinates(
            position.lat,
            position.lng
          );

          reverseGeocode(
            position.lat,
            position.lng
          );
        }
      );
    }


    bookingMap.setView(
      latLng,
      17
    );


    saveCoordinates(
      latitude,
      longitude
    );


    reverseGeocode(
      latitude,
      longitude
    );


    if (source === "current") {

      locationStatus.textContent =
        "Your current location has been selected.";

    } else {

      locationStatus.textContent =
        "Location selected. You can drag the pin to adjust it.";
    }
  }


  function saveCoordinates(
    latitude,
    longitude
  ) {

    if (customerLatitude) {
      customerLatitude.value =
        latitude.toFixed(7);
    }

    if (customerLongitude) {
      customerLongitude.value =
        longitude.toFixed(7);
    }
  }


  /* ================================
     REVERSE GEOCODING
  ================================= */

  async function reverseGeocode(
    latitude,
    longitude
  ) {

    try {

      locationStatus.textContent =
        "Finding the address...";


      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}`
      );


      if (!response.ok) {
        throw new Error(
          "Unable to find address"
        );
      }


      const data =
        await response.json();


      if (
        data &&
        data.display_name
      ) {

        customerAddress.value =
          data.display_name;

        locationStatus.textContent =
          "Location selected successfully. You can edit the address if needed.";

      } else {

        locationStatus.textContent =
          "Location selected. Please enter the address manually.";
      }

    } catch (error) {

      console.error(
        "Address lookup error:",
        error
      );

      locationStatus.textContent =
        "Location selected. Please enter your address manually.";
    }
  }


  /* ================================
     INITIALIZE MAP
  ================================= */

  function initializeMap() {

    if (!bookingMapElement) {
      return;
    }


    if (
      typeof L === "undefined"
    ) {

      locationStatus.textContent =
        "Map could not be loaded. Please refresh the page.";

      return;
    }


    bookingMap = L.map(
      bookingMapElement
    ).setView(
      ogbomoshoCenter,
      13
    );


    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; OpenStreetMap contributors'
      }
    ).addTo(
      bookingMap
    );


    locationStatus.textContent =
      "Click anywhere on the map to select your exact location.";


    bookingMap.on(
      "click",
      event => {

        setLocation(
          event.latlng.lat,
          event.latlng.lng
        );
      }
    );
  }


  initializeMap();


  /* ================================
     CURRENT LOCATION BUTTON
  ================================= */

  if (useLocationButton) {

    useLocationButton.addEventListener(
      "click",
      () => {

        if (
          !navigator.geolocation
        ) {

          locationStatus.textContent =
            "Your browser does not support location services.";

          return;
        }


        useLocationButton.disabled =
          true;

        locationStatus.textContent =
          "Getting your current location...";


        navigator.geolocation.getCurrentPosition(

          position => {

            const latitude =
              position.coords.latitude;

            const longitude =
              position.coords.longitude;


            setLocation(
              latitude,
              longitude,
              "current"
            );


            useLocationButton.disabled =
              false;
          },


          error => {

            console.error(
              "Geolocation error:",
              error
            );


            useLocationButton.disabled =
              false;


            if (
              error.code === 1
            ) {

              locationStatus.textContent =
                "Location permission was denied. Please allow location access in your browser.";

            } else if (
              error.code === 2
            ) {

              locationStatus.textContent =
                "Your location could not be determined. Please select your location on the map.";

            } else if (
              error.code === 3
            ) {

              locationStatus.textContent =
                "Location request timed out. Please try again.";

            } else {

              locationStatus.textContent =
                "Unable to get your location. Please select it on the map.";
            }
          },

          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      }
    );
  }


  /* ================================
     PAYSTACK
  ================================= */

  async function startHaircutPayment() {

    const response =
      await fetch(
        "/api/paystack",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            service: "Haircut",

            amount: 7000,

            email:
              customerEmail.value.trim(),

            name:
              customerName.value.trim(),

            phone:
              customerPhone.value.trim(),

            address:
              customerAddress.value.trim(),

            latitude:
              customerLatitude
                ? customerLatitude.value
                : "",

            longitude:
              customerLongitude
                ? customerLongitude.value
                : "",

            date:
              dateInput.value,

            time:
              timeInput.value,

            note:
              bookingNote.value.trim()
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


    if (typeof PaystackPop === "undefined") {
      throw new Error("Paystack could not be loaded. Please refresh the page and try again.");
    }

    const popup = new PaystackPop();
    popup.resumeTransaction(data.accessCode);
    watchForPaymentConfirmation(data.reference);
  }


  /* ================================
     PAYSTACK PAYMENT STATUS
  ================================= */

  function watchForPaymentConfirmation(reference) {

    const startedAt = Date.now();
    const timeoutMs = 5 * 60 * 1000;

    const checkPayment = async () => {

      try {

        const response = await fetch(
          `/api/paystack-verify?reference=${encodeURIComponent(reference)}`
        );

        if (response.ok) {

          window.location.assign(
            `payment-success.html?reference=${encodeURIComponent(reference)}`
          );

          return;
        }

      } catch (error) {

        // A temporary network error should not interrupt the checkout popup.
        console.warn("Payment confirmation check failed:", error);
      }

      if (Date.now() - startedAt < timeoutMs) {
        window.setTimeout(checkPayment, 3000);
      }
    };

    window.setTimeout(checkPayment, 3000);
  }


  /* ================================
     FORM SUBMISSION
  ================================= */

  bookingForm.addEventListener(
    "submit",
    async event => {

      event.preventDefault();


      bookingMessage.textContent =
        "";


      if (!selectedService) {

        bookingMessage.textContent =
          "Please select Haircut or Hair Tinting first.";

        return;
      }


      if (
        !bookingForm.checkValidity()
      ) {

        bookingForm.reportValidity();

        return;
      }


      /*
       * Require a map location.
       */

      if (
        !customerLatitude.value ||
        !customerLongitude.value
      ) {

        bookingMessage.textContent =
          "Please select your exact location on the map or use the current location button.";

        return;
      }

      if (!isInOgbomoshoServiceArea(
        Number(customerLatitude.value),
        Number(customerLongitude.value)
      )) {

        bookingMessage.textContent =
          "We currently serve Ogbomosho only. Please select a location within Ogbomosho.";

        return;
      }


      /* ================================
         HAIR TINTING
      ================================= */

      if (
        selectedService ===
        "Hair Tinting"
      ) {

        const tintColor =
          tintColorInput.value.trim();

        const address =
          customerAddress.value.trim();

        const latitude =
          customerLatitude.value;

        const longitude =
          customerLongitude.value;


        const message = [

          "Hello DML Urban Trim 👋",

          "",

          "I would like to book a Hair Tinting appointment.",

          "",

          `Color I want: ${tintColor}`,

          `Location: ${address}`,

          `Map coordinates: ${latitude}, ${longitude}`,

          `Date: ${formatDate(dateInput.value)}`,

          `Time: ${timeInput.value}`

        ].join("\n");


        const whatsappUrl =
          `https://wa.me/2347051679159?text=${encodeURIComponent(message)}`;


        window.location.href =
          whatsappUrl;


        return;
      }


      /* ================================
         HAIRCUT PAYMENT
      ================================= */

      submitButton.disabled =
        true;

      submitButton.classList.add(
        "is-loading"
      );


      const buttonArrow =
        submitButton.querySelector(
          "span"
        );


      if (buttonArrow) {

        buttonArrow.textContent =
          "…";
      }


      bookingMessage.textContent =
        "Preparing your secure payment…";


      try {

        await startHaircutPayment();
        bookingMessage.textContent = "";

      } catch (error) {

        console.error(
          "Payment initialization error:",
          error
        );


        bookingMessage.textContent =
          error.message ||
          "Unable to start payment. Please try again.";

      } finally {

        submitButton.disabled =
          false;

        submitButton.classList.remove(
          "is-loading"
        );


        if (buttonArrow) {

          buttonArrow.textContent =
            "→";
        }
      }
    }
  );


  /* ================================
     INITIAL SUMMARY
  ================================= */

  updateSummary();
}
