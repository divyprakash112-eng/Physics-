
(() => {
  "use strict";

  const config = window.NA_CONFIG;
  const tests = window.NA_TESTS;

  if (!config || !Array.isArray(tests)) {
    console.error("NEET AARAMBH: configuration or test data is missing.");
    return;
  }

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const grid = $("#testGrid");
  const searchInput = $("#testSearch");
  const emptyState = $("#emptyState");
  const resultCounter = $("#resultCounter");
  const dialog = $("#syllabusDialog");
  const syllabusBody = $("#syllabusBody");
  const dialogAttempt = $("#dialogAttempt");

  let activeFilter = "all";
  let selectedTestId = null;
  let countdownTimer = null;

  const pad = value => String(value).padStart(2, "0");

  function startTime(test) {
    return Date.parse(`${test.date}T${pad(config.startHour)}:00:00+05:30`);
  }

  function endTime(test) {
    return Date.parse(`${test.date}T${pad(config.endHour)}:00:00+05:30`);
  }

  function statusOf(test, now = Date.now()) {
    if (now < startTime(test)) return "upcoming";
    if (now < endTime(test)) return "live";
    return "previous";
  }

  function formatDate(dateString, includeDay = true) {
    const date = new Date(`${dateString}T12:00:00+05:30`);
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: config.timezone,
      ...(includeDay ? { weekday: "short" } : {}),
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: config.timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(new Date(timestamp));
  }

  function typeLabel(type) {
    return {
      chapter: "Chapter-wise",
      mixed: "Mixed Test",
      full: "Full Syllabus"
    }[type] || "Test";
  }

  function statusLabel(status) {
    return {
      upcoming: "Upcoming",
      live: "Live Now",
      previous: "Previous"
    }[status];
  }

  function safeText(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function matchesFilter(test, filter, now) {
    const status = statusOf(test, now);

    if (filter === "all") return true;
    if (filter === "upcoming" || filter === "live" || filter === "previous") {
      return status === filter;
    }

    return test.type === filter;
  }

  function getFilteredTests() {
    const now = Date.now();
    const query = searchInput.value.trim().toLowerCase();

    return tests.filter(test => {
      const matchesSearch = [
        test.title,
        `test ${test.id}`,
        String(test.id),
        test.description,
        typeLabel(test.type),
        `phase ${test.phase}`
      ].some(value => value.toLowerCase().includes(query));

      return matchesSearch && matchesFilter(test, activeFilter, now);
    });
  }

  function renderCards() {
    const filtered = getFilteredTests();
    const now = Date.now();

    resultCounter.textContent =
      `${filtered.length} ${filtered.length === 1 ? "test" : "tests"}`;

    grid.innerHTML = "";
    emptyState.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;

    const fragment = document.createDocumentFragment();

    filtered.forEach(test => {
      const status = statusOf(test, now);
      const article = document.createElement("article");
      article.className = "test-card";

      const badgeType = test.type === "chapter"
        ? "chapter"
        : test.type === "mixed"
          ? "mixed"
          : "full";

      const attemptLabel = status === "upcoming"
        ? "Locked"
        : "Check CBT";

      article.innerHTML = `
        <div class="test-card-top">
          <span class="test-number">${safeText(test.title.toUpperCase())}</span>
          <span class="test-status ${status}">${statusLabel(status)}</span>
        </div>
        <h3>${safeText(test.description)}</h3>
        <p class="test-description">
          Phase ${test.phase} · ${typeLabel(test.type)}
        </p>
        <div class="test-meta">
          <span class="type-badge ${badgeType}">${typeLabel(test.type)}</span>
          <span class="type-badge">Phase ${test.phase}</span>
        </div>
        <div class="test-date">
          <strong>${formatDate(test.date)}</strong><br>
          ${config.startHour}:00 AM – ${config.endHour}:00 PM IST
        </div>
        <div class="test-card-actions">
          <button class="btn syllabus-button" type="button"
            data-action="syllabus" data-id="${test.id}">
            View Syllabus
          </button>
          <button class="btn btn-primary" type="button"
            data-action="attempt" data-id="${test.id}"
            ${status === "upcoming" ? "disabled" : ""}>
            ${attemptLabel}
          </button>
        </div>
      `;

      fragment.appendChild(article);
    });

    grid.appendChild(fragment);
  }

  function renderSyllabus(test) {
    selectedTestId = test.id;

    $("#syllabusTitle").textContent = `${test.title} — Syllabus`;

    const isMixed = test.type === "mixed";
    const isFull = test.type === "full";

    let heading = "Chapter / Topic";
    let description = test.description;

    if (isMixed) heading = "Cumulative revision syllabus";
    if (isFull) heading = "Full syllabus mock";

    syllabusBody.innerHTML = `
      <div class="dialog-meta">
        <span>${formatDate(test.date)}</span>
        <span>${typeLabel(test.type)}</span>
        <span>Phase ${test.phase}</span>
      </div>
      <section class="dialog-section">
        <h3>${heading}</h3>
        <ul><li>${safeText(description)}</li></ul>
      </section>
      <section class="dialog-section">
        <h3>Schedule</h3>
        <p style="color:var(--muted);font-size:12px">
          Scheduled date: ${formatDate(test.date)}.
          Test window: ${config.startHour}:00 AM to
          ${config.endHour}:00 PM IST.
        </p>
      </section>
      <section class="dialog-section">
        <h3>Paper availability</h3>
        <p style="color:var(--muted);font-size:12px">
          The syllabus and schedule are listed here. The actual
          question paper must be uploaded separately as
          <code>${safeText(test.file)}</code>.
        </p>
      </section>
    `;

    dialogAttempt.disabled = statusOf(test) === "upcoming";
    dialogAttempt.textContent = statusOf(test) === "upcoming"
      ? "Test Locked"
      : "Check CBT";

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      alert(`${test.title}\n${test.description}\n${formatDate(test.date)}`);
    }
  }

  async function openCBT(test) {
    if (statusOf(test) === "upcoming") {
      alert(`This test is scheduled for ${formatDate(test.date)}. It is not open yet.`);
      return;
    }

    const fileUrl = new URL(test.file, window.location.href);
    const button = dialogAttempt;

    if (button) {
      button.disabled = true;
      button.textContent = "Checking paper…";
    }

    try {
      const response = await fetch(fileUrl.href, {
        method: "HEAD",
        cache: "no-store"
      });

      const contentType = response.headers.get("content-type") || "";

      if (!response.ok || contentType.includes("text/html") &&
          !fileUrl.pathname.endsWith(".html")) {
        throw new Error("CBT file not found");
      }

      // Open only after confirming the requested file exists.
      window.open(fileUrl.href, "_blank", "noopener,noreferrer");
    } catch (error) {
      alert(
        `${test.title} ka CBT paper abhi available nahi hai.\n\n` +
        `Expected file: ${test.file}\n\n` +
        "GitHub repository mein is exact path par actual CBT HTML file upload karo."
      );
    } finally {
      if (button) {
        button.disabled = statusOf(test) === "upcoming";
        button.textContent = statusOf(test) === "upcoming"
          ? "Test Locked"
          : "Check CBT";
      }
    }
  }

  function updateCountdown() {
    const now = Date.now();
    const active = tests.find(test => statusOf(test, now) === "live");
    const next = tests.find(test => statusOf(test, now) === "upcoming");
    const target = active || next;

    const title = $("#nextTitle");
    const date = $("#nextDate");
    const label = $("#nextLabel");
    const status = $("#nextStatus");
    const countLabel = $("#countLabel");

    if (!target) {
      title.textContent = "Series Completed";
      date.textContent = "All scheduled tests have ended.";
      label.textContent = "NEET AARAMBH Physics";
      status.textContent = "Completed";
      countLabel.textContent = "Thank you for completing the series.";
      ["Days", "Hours", "Minutes", "Seconds"].forEach((part, i) => {
        $(`#cd${part}`).textContent = "00";
      });
      return;
    }

    const targetTime = active ? endTime(active) : startTime(target);

    title.textContent = `${target.title}: ${target.description}`;
    date.textContent = formatDate(target.date);
    label.textContent = active ? "Current live test ends in" : "Next scheduled test";
    status.textContent = active ? "Live Now" : "Upcoming";
    status.style.color = active ? "var(--green)" : "var(--amber)";

    let remaining = Math.max(0, targetTime - now);
    const days = Math.floor(remaining / 86400000);
    remaining %= 86400000;
    const hours = Math.floor(remaining / 3600000);
    remaining %= 3600000;
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    $("#cdDays").textContent = pad(days);
    $("#cdHours").textContent = pad(hours);
    $("#cdMinutes").textContent = pad(minutes);
    $("#cdSeconds").textContent = pad(seconds);

    countLabel.textContent = active
      ? `Scheduled close: ${formatTime(targetTime)} IST`
      : `Starts at ${formatTime(targetTime)} IST`;
  }

  function setFilter(filter) {
    activeFilter = filter;

    $$(".filter").forEach(button => {
      const isActive = button.dataset.filter === filter;
      button.classList.toggle("active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });

    renderCards();
  }

  // Search and filter controls
  searchInput.addEventListener("input", renderCards);

  $$(".filter").forEach(button => {
    button.addEventListener("click", () => setFilter(button.dataset.filter));
  });

  $("#resetFilters").addEventListener("click", () => {
    searchInput.value = "";
    setFilter("all");
  });

  // Delegate button clicks from the dynamic test cards
  grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const test = window.getTestById(button.dataset.id);
    if (!test) return;

    if (button.dataset.action === "syllabus") {
      renderSyllabus(test);
    }

    if (button.dataset.action === "attempt") {
      openCBT(test);
    }
  });

  dialogAttempt.addEventListener("click", () => {
    const test = window.getTestById(selectedTestId);
    if (test) openCBT(test);
  });

  $("#closeDialog").addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  // Phase navigation applies the corresponding test category.
  $$("[data-phase-jump]").forEach(link => {
    link.addEventListener("click", () => {
      const phase = Number(link.dataset.phaseJump);
      searchInput.value = "";
      setFilter("all");

      // Filter by the actual phase without changing the source data.
      const phaseTests = tests.filter(test => test.phase === phase);
      grid.innerHTML = "";
      emptyState.hidden = phaseTests.length !== 0;
      resultCounter.textContent = `${phaseTests.length} tests`;

      const fragment = document.createDocumentFragment();
      const now = Date.now();

      phaseTests.forEach(test => {
        const status = statusOf(test, now);
        const article = document.createElement("article");
        article.className = "test-card";
        article.innerHTML = `
          <div class="test-card-top">
            <span class="test-number">${test.title.toUpperCase()}</span>
            <span class="test-status ${status}">${statusLabel(status)}</span>
          </div>
          <h3>${safeText(test.description)}</h3>
          <p class="test-description">Phase ${test.phase} · ${typeLabel(test.type)}</p>
          <div class="test-date"><strong>${formatDate(test.date)}</strong></div>
          <div class="test-card-actions">
            <button class="btn syllabus-button" type="button" data-action="syllabus" data-id="${test.id}">View Syllabus</button>
            <button class="btn btn-primary" type="button" data-action="attempt" data-id="${test.id}" ${status === "upcoming" ? "disabled" : ""}>${status === "upcoming" ? "Locked" : "Check CBT"}</button>
          </div>`;
        fragment.appendChild(article);
      });

      grid.appendChild(fragment);
    });
  });

  // Configuration-driven page details
  $("#supportLink").href = config.support;
  $("#currentYear").textContent = new Date().getFullYear();
  $("#totalCount").textContent = tests.length;
  $("#chapterCount").textContent = tests.filter(test => test.type === "chapter").length;
  $("#mixedCount").textContent = tests.filter(test => test.type === "mixed").length;
  $("#mockCount").textContent = tests.filter(test => test.type === "full").length;

  renderCards();
  updateCountdown();

  countdownTimer = window.setInterval(() => {
    updateCountdown();
    renderCards();
  }, 15000);

  window.addEventListener("pagehide", () => {
    if (countdownTimer) window.clearInterval(countdownTimer);
  });
})();
