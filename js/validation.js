/* =========================================================
   CELESTIA TRAVELS AND TOURS — js/validation.js
   Client-side form validation (Tranche 2, Mathew / UI-UX B)

   AI-ASSISTED CODE: This whole file was generated with Claude
   (Anthropic) from Mathew's task list, then reviewed by Mathew.

   Covers two forms:
     1. Inquiry form  -> about.html   (#contact-form)
     2. Booking form  -> booking.html (.booking-card)

   Data Dictionary mapping (form field -> database column):
     Inquiry: name -> Inquiry.FullName, phone -> Inquiry.MobileNumber,
              email -> Inquiry.EmailAddress, inquiry_type -> Inquiry.InquiryType,
              message -> Inquiry.Message
     Booking: full_name -> Booking.FullName, email -> Booking.EmailAddress,
              mobile -> Booking.MobileNumber, group_size -> Booking.GroupSize,
              requests -> Booking.SpecialRequests
   Max lengths follow the Data Dictionary:
     FullName 100, EmailAddress 100, MobileNumber 20.
   ========================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. VALIDATION RULES
     Each rule takes the raw value and returns an error message,
     or "" when the value is valid.
     --------------------------------------------------------- */
  var RULES = {

    // Full name: required, 2+ characters, letters/space/. ' - only
    name: function (value) {
      value = value.trim();
      if (!value) return "Please enter your full name.";
      if (value.length < 2) return "Name must be at least 2 characters.";
      if (value.length > 100) return "Name must be 100 characters or less."; // FullName VARCHAR(100)
      if (!/^[A-Za-z\u00C0-\u00FF][A-Za-z\u00C0-\u00FF .'\-]*$/.test(value)) {
        return "Name can only contain letters, spaces, periods, apostrophes and hyphens.";
      }
      return "";
    },

    // Email: required, must look like name@domain.tld
    email: function (value) {
      value = value.trim();
      if (!value) return "Please enter your email address.";
      if (value.length > 100) return "Email must be 100 characters or less."; // EmailAddress VARCHAR(100)
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        return "Enter a valid email address, e.g. name@example.com.";
      }
      return "";
    },

    // PH mobile number: +639XXXXXXXXX or 09XXXXXXXXX
    // (spaces, dashes and brackets are ignored before checking)
    phone: function (value) {
      var cleaned = value.replace(/[\s\-()]/g, "");
      if (!cleaned) return "Please enter your mobile number.";
      if (value.length > 20) return "Mobile number must be 20 characters or less."; // MobileNumber VARCHAR(20)
      if (!/^(\+63|0)9\d{9}$/.test(cleaned)) {
        return "Enter a valid PH mobile number, e.g. +63 912 345 6789.";
      }
      return "";
    },

    // Group size: whole number from 1 to 20 (matches min/max in the HTML)
    groupSize: function (value) {
      var n = Number(value);
      if (value === "" || isNaN(n)) return "Please enter your group size.";
      if (n % 1 !== 0) return "Group size must be a whole number.";
      if (n < 1) return "Group size must be at least 1 traveler.";
      if (n > 20) return "Group size cannot be more than 20 travelers.";
      return "";
    },

    // Inquiry type: a real option must be chosen (not the placeholder)
    inquiryType: function (value) {
      if (!value) return "Please choose an inquiry type.";
      return "";
    },

    // Inquiry message: required, 10 to 1000 characters
    message: function (value) {
      value = value.trim();
      if (!value) return "Please type your message.";
      if (value.length < 10) return "Message must be at least 10 characters.";
      if (value.length > 1000) return "Message must be 1000 characters or less.";
      return "";
    },

    // Special requests: optional, but capped at 500 characters
    requests: function (value) {
      if (value.trim().length > 500) return "Special requests must be 500 characters or less.";
      return "";
    }
  };

  /* ---------------------------------------------------------
     2. DATE CHECK (booking page)
     Reads the displayed schedule, e.g.
     "Sat, Nov 28 – Mon, Nov 30, 2026", and rejects past dates.
     --------------------------------------------------------- */
  var MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                 jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

  function validateTravelDate() {
    var el = document.getElementById("date-range");
    var text = el ? el.textContent : "";

    // Pattern: "<Day>, <Mon> <d> – <Day>, <Mon> <d>, <yyyy>"
    var m = text.match(/^\s*\w{3},\s*(\w{3})\s+(\d{1,2})\s*[\u2013\-]\s*\w{3},\s*(\w{3})\s+(\d{1,2}),\s*(\d{4})/);
    if (!m) return "Please choose a travel date.";

    var startMonth = MONTHS[m[1].toLowerCase()];
    var endYear = Number(m[5]);
    // If the trip starts in December and ends in January, the start year is one less
    var startYear = (startMonth > MONTHS[m[3].toLowerCase()]) ? endYear - 1 : endYear;
    var start = new Date(startYear, startMonth, Number(m[2]));

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime())) return "Please choose a valid travel date.";
    if (start < today) return "Travel date cannot be in the past.";

    // The slot banner turns red (.is-invalid) when the group does not fit / schedule is full
    var slots = document.querySelector(".slots-badge");
    if (slots && slots.classList.contains("is-invalid")) {
      return "This schedule cannot fit your group. Please choose another date.";
    }
    return "";
  }

  /* ---------------------------------------------------------
     3. ERROR DISPLAY HELPERS
     --------------------------------------------------------- */

  // Show (or clear) an error under a field and mark it for screen readers
  function setError(field, errorEl, message) {
    errorEl.textContent = message;
    if (message) {
      field.setAttribute("aria-invalid", "true");
    } else {
      field.removeAttribute("aria-invalid");
    }
  }

  // Booking page has no error <p> in its HTML, so one is created under the field.
  // It is styled in red by JS because the shared .field-error colour is for the dark contact section.
  function getBookingErrorEl(field, anchor) {
    var id = (field.id || "date") + "-error";
    var el = document.getElementById(id);
    if (!el) {
      el = document.createElement("p");
      el.id = id;
      el.className = "field-error";
      el.setAttribute("role", "alert");
      el.style.color = "var(--booking-error, #B64A3A)";
      el.style.margin = "6px 0 0";
      anchor.parentNode.insertBefore(el, anchor.nextSibling);
      field.setAttribute("aria-describedby", id);
    }
    return el;
  }

  /* ---------------------------------------------------------
     4. INQUIRY FORM (about.html)
     --------------------------------------------------------- */
  function initInquiryForm() {
    var form = document.getElementById("contact-form");
    if (!form) return; // not on this page

    var status = document.getElementById("contact-status");

    // id of input -> rule to use
    var fields = [
      { id: "contact-name",    rule: RULES.name },
      { id: "contact-phone",   rule: RULES.phone },
      { id: "contact-email",   rule: RULES.email },
      { id: "contact-type",    rule: RULES.inquiryType },
      { id: "contact-message", rule: RULES.message }
    ];

    // Validate one field; returns true when valid
    function check(item) {
      var field = document.getElementById(item.id);
      var errorEl = document.getElementById(item.id + "-error"); // already in the HTML
      var message = item.rule(field.value);
      setError(field, errorEl, message);
      return message === "";
    }

    // Re-check a field as the user leaves it / changes it, so errors clear by themselves
    fields.forEach(function (item) {
      var field = document.getElementById(item.id);
      field.addEventListener("blur", function () { check(item); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") check(item);
      });
      field.addEventListener("change", function () { check(item); });
    });

    form.addEventListener("submit", function (event) {
      event.preventDefault(); // the form has novalidate, so JS is in charge

      var firstInvalid = null;
      fields.forEach(function (item) {
        if (!check(item) && !firstInvalid) firstInvalid = document.getElementById(item.id);
      });

      if (firstInvalid) {
        if (status) status.hidden = true;
        firstInvalid.focus();
        return;
      }

      // All good: show a thank-you message and clear the form
      if (status) {
        status.textContent = "Thank you! Your inquiry was received. We will reply to your email soon.";
        status.hidden = false;
      }
      form.reset();
    });
  }

  /* ---------------------------------------------------------
     5. BOOKING FORM (booking.html)
     --------------------------------------------------------- */
  function initBookingForm() {
    var form = document.querySelector(".booking-card");
    if (!form) return; // not on this page

    var nameEl = document.getElementById("full-name");
    var emailEl = document.getElementById("email");
    var mobileEl = document.getElementById("mobile");
    var sizeEl = document.getElementById("group-size");
    var requestsEl = document.getElementById("requests");
    var dateBox = document.querySelector(".date-box");

    // Group size input sits inside .group-size, so the error goes after that wrapper
    var items = [
      { field: nameEl,     anchor: nameEl,     rule: function () { return RULES.name(nameEl.value); } },
      { field: emailEl,    anchor: emailEl,    rule: function () { return RULES.email(emailEl.value); } },
      { field: mobileEl,   anchor: mobileEl,   rule: function () { return RULES.phone(mobileEl.value); } },
      { field: sizeEl,     anchor: sizeEl.closest(".group-size"), rule: function () { return RULES.groupSize(sizeEl.value); } },
      { field: requestsEl, anchor: requestsEl, rule: function () { return RULES.requests(requestsEl.value); } }
    ];

    // The date has no input, so the "Choose Date" box is used as the anchor
    var dateItem = { field: dateBox, anchor: dateBox, rule: validateTravelDate };
    items.push(dateItem);

    function check(item) {
      // (the date box has no id, so its error element falls back to the id "date-error")
      var errorEl = getBookingErrorEl(item.field, item.anchor);
      var message = item.rule();
      errorEl.textContent = message;
      if (item.field !== dateBox) {
        if (message) item.field.setAttribute("aria-invalid", "true");
        else item.field.removeAttribute("aria-invalid");
      }
      return message === "";
    }

    // Validate everything; returns the first invalid element (or null)
    function validateAll() {
      var firstInvalid = null;
      items.forEach(function (item) {
        if (!check(item) && !firstInvalid) firstInvalid = item.field;
      });
      return firstInvalid;
    }

    // ---- GROUP SIZE  - / +  BUTTONS ---------------------------------
    // The buttons in the HTML carry data-step="-1" or "1". The number box is
    // read-only, so these buttons are the only way to change it.
    var totalAmountEl = document.getElementById("total-amount");
    var totalCalcEl = document.getElementById("total-calc");
    var priceEl = document.getElementById("pkg-price");

    // Keep "Estimated Total" in step with the group size
    function updateTotal() {
      var n = Number(sizeEl.value);
      // "₱ 12,500 / head" -> 12500 (keep digits only)
      var price = priceEl ? Number(priceEl.textContent.replace(/[^\d]/g, "")) : 0;
      if (!totalAmountEl || !totalCalcEl || !price) return;
      totalAmountEl.textContent = "₱" + (price * n).toLocaleString("en-US");
      totalCalcEl.textContent = "₱" + price.toLocaleString("en-US") + " × " +
                                n + (n === 1 ? " traveler" : " travelers");
    }

    document.querySelectorAll(".size-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var n = Number(sizeEl.value) || 1;
        n += Number(btn.getAttribute("data-step"));       // -1 or +1
        n = Math.max(1, Math.min(20, n));                 // stay between 1 and 20
        sizeEl.value = n;
        sizeEl.removeAttribute("aria-invalid");
        var sizeError = document.getElementById("group-size-error");
        if (sizeError) sizeError.textContent = "";
        updateTotal();
        refreshSchedule(); // slots banner and calendar depend on the group size
      });
    });

    // ---- NATION / TOUR PACKAGE DROPDOWN -----------------------------
    // Data copied from each nation page (name, duration, price, stops, images).
    // The dropdown in the HTML is a <details> list, so JS must do the selecting.
    var PACKAGES = {
      "Mondstadt": { dur: "3D / 2N", price: 12500, tagline: "Let the Wind Lead the Way.",
        emblem: "assets/mondstadt/watermark-sigil.png", photo: "assets/mondstadt/mondstadt_tourpackagepic.png", icon: "assets/mondstadt/anemo.png",
        stops: ["Cider Lake", "Windrise", "Grand Cathedral of Mondstadt"] },
      "Liyue": { dur: "4D / 3N", price: 15000, tagline: "Follow where the mountains call",
        emblem: "assets/liyue/watermark-sigil-1.png", photo: "assets/liyue/tour_package.jpg", icon: "assets/liyue/geo_symbol.png",
        stops: ["Liyue Harbor", "Wangshu Inn", "Mt. Aocang"] },
      "Inazuma": { dur: "4D / 3N", price: 18000, tagline: "Chase the spark of eternal thunder beyond the horizon",
        emblem: "assets/inazuma/watermark-sigil-2.png", photo: "assets/inazuma/tour_packagepic.jpg", icon: "assets/inazuma/electro_symbol.png",
        stops: ["Narukami", "Tenshukaku", "Ritou"] },
      "Sumeru": { dur: "3D / 3N", price: 14000, tagline: "Wander where wisdom grows.",
        emblem: "assets/sumeru/watermark-sigil-3.png", photo: "assets/sumeru/tour_packagepic.jpg", icon: "assets/sumeru/dendro_symbol.png",
        stops: ["Sumeru City Academy", "Gandharva Ville", "Caravan Ribat"] },
      "Fontaine": { dur: "5D / 4N", price: 20000, tagline: "Justice Flows Like Water.",
        emblem: "assets/fontaine/watermark-sigil-4.png", photo: "assets/fontaine/fontaine price card image.webp", icon: "assets/fontaine/hydro element.png",
        stops: ["Fontaine of Lucine", "Opera Epiclese", "Court of Fontaine"] },
      "Natlan": { dur: "4D / 3N", price: 16500, tagline: "Where Legends Are Forged in Fire.",
        emblem: "assets/natlan/watermark-sigil-5.png", photo: "assets/natlan/Natlan image price card.webp", icon: "assets/natlan/pyro element.png",
        stops: ["Sacred Mountain", "Children Canyon", "Flower Clan"] },
      "Snezhnaya": { dur: "5D / 4N", price: 22000, tagline: "Beneath the Aurora, Winter Reigns.",
        emblem: "assets/snezhnaya/watermark-sigil-6.png", photo: "assets/snezhnaya/snezhnaya price card image.webp", icon: "assets/snezhnaya/cryo element.png",
        stops: ["Zapolyarny Palace", "Korolevskiy Theater", "Borderland Town"] }
    };

    var currentPkg = "Mondstadt"; // the page starts on Mondstadt
    var pkgDropdown = document.querySelector(".pkg-dropdown");

    function peso(n) { return "₱" + n.toLocaleString("en-US"); }

    // Fill the "Selected Package" card, the details popup and the total for one package
    function selectPackage(name) {
      var p = PACKAGES[name];
      if (!p) return;
      currentPkg = name;

      // 1. Dropdown: highlight the chosen row and update the closed-box text
      document.querySelectorAll(".pkg-option").forEach(function (opt) {
        var isThis = opt.querySelector(".pkg-opt-name").textContent.trim() === name;
        opt.classList.toggle("is-selected", isThis);
        if (isThis) opt.setAttribute("aria-selected", "true"); else opt.removeAttribute("aria-selected");
      });
      var triggerText = document.querySelector(".pkg-trigger-text");
      if (triggerText) triggerText.textContent = name + " · " + peso(p.price) + " / head";

      // 2. "Selected Package" card
      document.getElementById("pkg-name").textContent = name;
      document.getElementById("pkg-tagline").textContent = p.tagline;
      document.getElementById("pkg-price").innerHTML = "₱ " + p.price.toLocaleString("en-US") + " <span>/ head</span>";
      document.getElementById("pkg-badge").textContent = p.dur;
      document.getElementById("pkg-emblem").src = p.emblem;

      // 3. "View Full Package Details" popup
      var modal = document.getElementById("pkg-details-modal");
      if (modal) {
        var photo = modal.querySelector(".modal-pkg-photo");
        photo.src = p.photo;
        photo.alt = name + " Tour Package";
        modal.querySelector(".modal-pkg-element").src = p.icon;
        modal.querySelector(".modal-pkg-duration").textContent = p.dur;
        modal.querySelector(".modal-title").textContent = name + " Tour Package";
        modal.querySelector(".modal-desc").textContent = p.tagline;
        modal.querySelector(".modal-pkg-price").innerHTML = "₱ " + p.price.toLocaleString("en-US") + " <span>/ head</span>";
        modal.querySelector(".modal-watermark").src = p.emblem;
        var list = modal.querySelector(".modal-itinerary");
        list.innerHTML = "";
        p.stops.forEach(function (stop, i) {
          var li = document.createElement("li");
          var day = document.createElement("span");
          day.className = "day-pill";
          day.textContent = "Day " + (i + 1);
          var label = document.createElement("span");
          label.className = "stop-name";
          label.textContent = stop;
          li.appendChild(day);
          li.appendChild(label);
          list.appendChild(li);
        });
      }

      // 4. Estimated total uses the new price
      updateTotal();

      // 5. Trip length changed, so the date range and slots banner change too
      refreshSchedule();
    }

    // Click (or press Enter on) a row to choose it, then close the dropdown
    document.querySelectorAll(".pkg-option").forEach(function (opt) {
      opt.setAttribute("tabindex", "0"); // lets keyboard users reach the rows
      function choose() {
        selectPackage(opt.querySelector(".pkg-opt-name").textContent.trim());
        if (pkgDropdown) pkgDropdown.removeAttribute("open");
      }
      opt.addEventListener("click", choose);
      opt.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); choose(); }
      });
    });

    // ---- TRAVEL DATE CALENDAR ----------------------------------------
    // The calendar in the HTML is a fixed picture of November, so JS draws
    // the month grid itself and handles the back / forward buttons and clicks.
    //
    // DEMO SCHEDULE: until the Schedule table (Data Dictionary) is connected,
    // every Saturday is a departure with 10 slots, except the dates below.
    // (0 = full, 1-3 = few slots left.)
    var SLOT_OVERRIDES = { "2026-11-21": 0, "2026-12-05": 1, "2026-12-12": 0, "2026-12-19": 3 };
    var DEFAULT_SLOTS = 10;
    var DEPARTURE_WEEKDAY = 6; // 6 = Saturday

    var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
                       "July", "August", "September", "October", "November", "December"];

    var confirmedStart; // the date saved in the form
    var pendingStart;   // the date highlighted while the popup is open
    var viewYear, viewMonth; // the month the calendar is showing

    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    function dateKey(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
    function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
    function sameDay(a, b) { return dateKey(a) === dateKey(b); }
    function monthShort(d) { return MONTH_NAMES[d.getMonth()].slice(0, 3); }
    function todayDate() { var t = new Date(); return new Date(t.getFullYear(), t.getMonth(), t.getDate()); }

    // Trip length of the chosen package: "3D / 2N" -> 3 days, 2 nights
    function tripDays() { return parseInt(PACKAGES[currentPkg].dur, 10); }
    function tripNights() { return parseInt(PACKAGES[currentPkg].dur.split("/")[1], 10); }

    // Slots left on a date, or null when nothing departs that day
    function slotsLeft(d) {
      if (d.getDay() !== DEPARTURE_WEEKDAY) return null;
      var key = dateKey(d);
      return SLOT_OVERRIDES.hasOwnProperty(key) ? SLOT_OVERRIDES[key] : DEFAULT_SLOTS;
    }

    // "Sat, Nov 28 - Mon, Nov 30, 2026"  (validateTravelDate reads this exact format)
    function formatRange(start, end) {
      return WEEKDAYS[start.getDay()] + ", " + monthShort(start) + " " + start.getDate() +
             " – " + WEEKDAYS[end.getDay()] + ", " + monthShort(end) + " " + end.getDate() +
             ", " + end.getFullYear();
    }

    // Write the confirmed date into the date box on the form
    function writeConfirmedDate() {
      var end = addDays(confirmedStart, tripDays() - 1);
      document.getElementById("date-range").textContent = formatRange(confirmedStart, end);
      document.getElementById("date-length").textContent = "(" + PACKAGES[currentPkg].dur.replace(/\s/g, "") + ")";
    }

    // Slots banner under the date box: normal, low (yellow) or invalid (red)
    function updateBanner() {
      var badge = document.querySelector(".slots-badge");
      if (!badge) return;
      var left = slotsLeft(confirmedStart);
      var n = Number(sizeEl.value) || 1;
      badge.className = "slots-badge";
      if (left === 0) {
        badge.classList.add("is-invalid");
        badge.textContent = "This schedule is full";
      } else if (left < n) {
        badge.classList.add("is-invalid");
        badge.textContent = "Only " + left + (left === 1 ? " slot" : " slots") + " left";
      } else if (left <= 3) {
        badge.classList.add("is-low");
        badge.textContent = "Only " + left + (left === 1 ? " slot" : " slots") + " left";
      } else {
        badge.textContent = left + " slots remaining";
      }
    }

    // Draw the month grid and the summary box inside the popup
    function renderCalendar() {
      var grid = document.querySelector(".cal-grid");
      if (!grid) return;
      var today = todayDate();
      var n = Number(sizeEl.value) || 1;
      var selEnd = addDays(pendingStart, tripDays() - 1);

      document.querySelector(".cal-month").textContent = MONTH_NAMES[viewMonth] + " " + viewYear;
      grid.innerHTML = "";

      // empty cells so day 1 lands under the right weekday
      var firstDay = new Date(viewYear, viewMonth, 1).getDay();
      for (var b = 0; b < firstDay; b++) {
        var blank = document.createElement("span");
        blank.className = "cal-day";
        grid.appendChild(blank);
      }

      var daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
      for (var day = 1; day <= daysInMonth; day++) {
        (function (d) {
          var cell = document.createElement("span");
          cell.className = "cal-day";
          var left = slotsLeft(d);
          var small = null;
          var selectable = false;
          var inSelection = d >= pendingStart && d <= selEnd;

          if (inSelection) {
            // the highlighted trip: dark ends, light middle
            var isStart = sameDay(d, pendingStart);
            var isEnd = sameDay(d, selEnd);
            cell.classList.add(isStart || isEnd ? "is-selected-edge" : "is-selected-mid");
            if (isStart) cell.classList.add("range-start");
            if (isEnd) cell.classList.add("range-end");
            if (isStart && left !== null) small = left + " left";
          } else if (left !== null && d >= today) {
            if (left === 0) {
              cell.classList.add("is-full");       // full / closed
              small = "Full";
            } else if (left < n) {
              cell.classList.add("is-low");        // not enough slots for this group
              small = left + " left";
            } else {
              selectable = true;                   // available departure
              cell.style.background = "#dff0ea";
              cell.style.color = "var(--color-primary)";
              cell.style.borderRadius = "12px";
              small = left + " left";
            }
            if (selectable === false) cell.style.borderRadius = "12px";
          }

          if (sameDay(d, today) && !inSelection) cell.classList.add("is-today");

          if (small) {
            var num = document.createElement("span");
            num.textContent = d.getDate();
            var sm = document.createElement("small");
            sm.textContent = small;
            cell.appendChild(num);
            cell.appendChild(sm);
          } else {
            cell.textContent = d.getDate();
          }

          if (selectable) {
            cell.setAttribute("role", "button");
            cell.setAttribute("tabindex", "0");
            cell.style.cursor = "pointer";
            var pick = function () { pendingStart = d; renderCalendar(); };
            cell.addEventListener("click", pick);
            cell.addEventListener("keydown", function (e) {
              if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); }
            });
          }
          grid.appendChild(cell);
        })(new Date(viewYear, viewMonth, day));
      }

      // back / forward buttons: stay between this month and 12 months ahead
      var navBtns = document.querySelectorAll(".cal-nav-btn");
      var minIndex = today.getFullYear() * 12 + today.getMonth();
      var viewIndex = viewYear * 12 + viewMonth;
      navBtns[0].disabled = viewIndex <= minIndex;
      navBtns[1].disabled = viewIndex >= minIndex + 12;
      navBtns[0].style.opacity = navBtns[0].disabled ? "0.4" : "1";
      navBtns[1].style.opacity = navBtns[1].disabled ? "0.4" : "1";

      // green summary box at the bottom of the popup
      var left2 = slotsLeft(pendingStart);
      var sameMonth = pendingStart.getMonth() === selEnd.getMonth();
      var shortRange = monthShort(pendingStart) + " " + pendingStart.getDate() + "–" +
                       (sameMonth ? "" : monthShort(selEnd) + " ") + selEnd.getDate() + ", " + selEnd.getFullYear();
      document.querySelector(".cal-summary-main").textContent =
        shortRange + " · " + left2 + (left2 === 1 ? " slot" : " slots") + " left";
      document.querySelector(".cal-summary-sub").textContent =
        WEEKDAYS[pendingStart.getDay()] + "–" + WEEKDAYS[selEnd.getDay()] + " · " +
        tripDays() + " Days / " + tripNights() + " Nights · fits your group of " + n;
    }

    // Redraw everything that depends on package or group size
    function refreshSchedule() {
      writeConfirmedDate();
      updateBanner();
      renderCalendar();
    }

    // Back / forward month buttons
    function shiftMonth(step) {
      var index = viewYear * 12 + viewMonth + step;
      var today = todayDate();
      var minIndex = today.getFullYear() * 12 + today.getMonth();
      if (index < minIndex || index > minIndex + 12) return;
      viewYear = Math.floor(index / 12);
      viewMonth = index % 12;
      renderCalendar();
    }
    var calNavBtns = document.querySelectorAll(".cal-nav-btn");
    if (calNavBtns.length === 2) {
      calNavBtns[0].addEventListener("click", function () { shiftMonth(-1); });
      calNavBtns[1].addEventListener("click", function () { shiftMonth(1); });
    }

    // "Confirm Date" saves the highlighted trip into the form
    var confirmDateBtn = document.querySelector("#date-modal .modal-btn-full");
    if (confirmDateBtn) {
      confirmDateBtn.addEventListener("click", function () {
        confirmedStart = pendingStart;
        writeConfirmedDate();
        updateBanner();
        var dateError = document.getElementById("date-error");
        if (dateError) dateError.textContent = "";
      });
    }

    // Every time the popup opens, start again from the saved date
    function onHashChange() {
      if (window.location.hash === "#date-modal") {
        pendingStart = confirmedStart;
        viewYear = confirmedStart.getFullYear();
        viewMonth = confirmedStart.getMonth();
        renderCalendar();
      }
    }
    window.addEventListener("hashchange", onHashChange);

    // Start: pick the first departure from today that fits the group
    (function setDefaultDate() {
      var d = todayDate();
      var n = Number(sizeEl.value) || 1;
      for (var i = 0; i < 400; i++) {
        var left = slotsLeft(d);
        if (left !== null && left >= n) break;
        d = addDays(d, 1);
      }
      confirmedStart = pendingStart = d;
      viewYear = d.getFullYear();
      viewMonth = d.getMonth();
      refreshSchedule();
    })();

    // ---- KEEP THE REVIEW / CONFIRMATION POPUPS IN SYNC ---------------
    // Those popups are fixed text in the HTML, so JS rewrites the rows
    // with what the traveler actually typed and chose.
    function setRow(modalId, label, value) {
      var modal = document.getElementById(modalId);
      if (!modal) return;
      modal.querySelectorAll(".review-row").forEach(function (row) {
        var s = row.querySelector("span"), v = row.querySelector("strong");
        if (s && v && s.textContent.trim() === label) v.textContent = value;
      });
    }

    function syncReview() {
      var p = PACKAGES[currentPkg];
      var n = Number(sizeEl.value);
      var total = peso(p.price * n);
      var travelers = n + (n === 1 ? " traveler" : " travelers");
      var schedule = document.getElementById("date-range").textContent.trim();

      setRow("review-modal", "Full Name", nameEl.value.trim());
      setRow("review-modal", "Email Address", emailEl.value.trim());
      setRow("review-modal", "Mobile Number", mobileEl.value.trim());
      setRow("review-modal", "Package", currentPkg + " (" + p.dur.replace(/\s/g, "") + ")");
      setRow("review-modal", "Schedule", schedule);
      setRow("review-modal", "Group Size", travelers);
      setRow("review-modal", "Special Requests", requestsEl.value.trim() || "None");
      setRow("review-modal", "Price × Group", peso(p.price) + " × " + n + " = " + total);
      var bar = document.querySelector("#review-modal .review-total-bar strong");
      if (bar) bar.textContent = total;

      setRow("confirm-modal", "Package", currentPkg + " (" + p.dur.replace(/\s/g, "") + ")");
      setRow("confirm-modal", "Schedule", schedule);
      setRow("confirm-modal", "Group Size", travelers);
      setRow("confirm-modal", "Total Amount", total);
    }

    // Live feedback on the typed fields
    [nameEl, emailEl, mobileEl, requestsEl].forEach(function (field) {
      var item = items.filter(function (i) { return i.field === field; })[0];
      field.addEventListener("blur", function () { check(item); });
      field.addEventListener("input", function () {
        if (field.getAttribute("aria-invalid") === "true") check(item);
      });
    });

    // Stop the "Confirm" link (opens #review-modal) and the final "Confirm" (opens #confirm-modal)
    // when the form is not valid. When valid, the link works as before.
    function guard(event) {
      var firstInvalid = validateAll();
      if (firstInvalid) {
        event.preventDefault(); // keeps the modal closed
        if (firstInvalid.focus) firstInvalid.focus();
        firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        syncReview(); // form is valid: fill the popups with the real details before they open
      }
    }

    var reviewLink = document.querySelector('a[href="#review-modal"]');
    if (reviewLink) reviewLink.addEventListener("click", guard);

    var finalLink = document.querySelector('a[href="#confirm-modal"]');
    if (finalLink) finalLink.addEventListener("click", guard);

    // Pressing Enter inside a field submits the form: block it unless valid
    form.addEventListener("submit", function (event) {
      var firstInvalid = validateAll();
      if (firstInvalid) {
        event.preventDefault();
        if (firstInvalid.focus) firstInvalid.focus();
      }
    });
  }

  /* ---------------------------------------------------------
     6. START
     The script is loaded with "defer", so the HTML is ready.
     Each init function stops by itself if its form is not on the page.
     --------------------------------------------------------- */
  initInquiryForm();
  initBookingForm();
})();
