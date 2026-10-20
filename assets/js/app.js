
(() => {
  "use strict";

  const config = window.NA_CONFIG;
  const tests = window.NA_TESTS;

  if (!config || !Array.isArray(tests)) {
    console.error("NEET AARAMBH: config.js or tests.js is missing.");
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
  let activePhase = null;
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
      timeZone: config.timezone || "Asia/Kolkata",
      ...(includeDay ? { weekday: "short" } : {}),
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(date);
  }

  function formatTime(timestamp) {
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: config.timezone || "Asia/Kolkata",
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
    }[status] || "Unknown";
  }

  function escapeHTML(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function getFilteredTests() {
    const now = Date.now();
    const query = searchInput.value.trim().toLowerCase();

    return tests.filter(test => {
      if (activePhase !== null && test.phase !== activePhase) {
        return false;
      }

      const searchableText = [
        test.title,
        `test ${test.id}`,
        String(test.id),
        test.description,
        typeLabel(test.type),
        `phase ${test.phase}`
      ].join(" ").toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      const status = statusOf(test, now);

      if (["upcoming", "live", "previous"].includes(activeFilter)) {
        return status === activeFilter;
      }

      if (["chapter", "mixed", "full"].includes(activeFilter)) {
        return test.type === activeFilter;
      }

      return true;
    });
  }

  function renderCards() {
    const filtered = getFilteredTests();
    const now = Date.now();

    resultCounter.textContent =
      `${filtered.length} ${filtered.length === 1 ? "test" : "tests"}`;

    grid.replaceChildren();
    emptyState.hidden = filtered.length !== 0;
    grid.hidden = filtered.length === 0;

    const fragment = document.createDocumentFragment();

    filtered.forEach(test => {
      const status = statusOf(test, now);

      const article = document.createElement("article");
      article.className = "test-card";

      const typeClass = {
        chapter: "chapter",
        mixed: "mixed",
        full: "full"
      }[test.type] || "chapter";

      const start = formatTime(startTime(test));
      const end = formatTime(endTime(test));

      article.innerHTML = `
        <div class="test-card-top">
          <span class="test-number">
            ${escapeHTML(test.title.toUpperCase())}
          </span>
          <span class="test-status ${status}">
            ${statusLabel(status)}
          </span>
        </div>

        <h3>${escapeHTML(test.description)}</h3>

        <p class="test-description">
          Phase ${test.phase} · ${typeLabel(test.type)}
        </p>

        <div class="test-meta">
          <span class="type-badge ${typeClass}">
            ${typeLabel(test.type)}
          </span>
          <span class="type-badge">Phase ${test.phase}</span>
        </div>

        <div class="test-date">
          <strong>${formatDate(test.date)}</strong><br>
          ${start} – ${end} IST
        </div>

        <div class="test-card-actions">
          <button
            class="btn syllabus-button"
            type="button"
            data-action="syllabus"
            data-id="${test.id}">
            View Syllabus
          </button>

          <button
            class="btn btn-primary"
            type="button"
            data-action="attempt"
            data-id="${test.id}"
            ${status === "upcoming" ? "disabled" : ""}>
            ${status === "upcoming" ? "Locked" : "Check CBT"}
          </button>
        </div>
      `;

      fragment.appendChild(article);
    });

    grid.appendChild(fragment);
  }

  function renderSyllabus(test) {
    selectedTestId = test.id;

    $("#syllabusTitle").textContent =
      `${test.title} — Syllabus`;

    const description = escapeHTML(test.description);
    const filePath = escapeHTML(test.file);
    const status = statusOf(test);

    let sectionHeading = "Chapter / Topic";

    if (test.type === "mixed") {
      sectionHeading = "Cumulative Revision Syllabus";
    } else if (test.type === "full") {
      sectionHeading = "Full Syllabus Mock";
    }

    syllabusBody.innerHTML = `
      <div class="dialog-meta">
        <span>${formatDate(test.date)}</span>
        <span>${typeLabel(test.type)}</span>
        <span>Phase ${test.phase}</span>
      </div>

      <section class="dialog-section">
        <h3>${sectionHeading}</h3>
        <ul>
          <li>${description}</li>
        </ul>
      </section>

      <section class="dialog-section">
        <h3>Test Schedule</h3>
        <p style="color:var(--muted);font-size:12px">
          Date: ${formatDate(test.date)}<br>
          Start: ${formatTime(startTime(test))} IST<br>
          End: ${formatTime(endTime(test))} IST
        </p>
      </section>

      <section class="dialog-section">
        <h3>CBT Paper</h3>
        <p style="color:var(--muted);font-size:12px">
          Expected file path:
          <code>${filePath}</code>
        </p>
        <p style="color:var(--muted);font-size:12px">
          ${status === "upcoming"
            ? "This test has not opened yet."
            : "The CBT file must be uploaded before the exam can be attempted."}
        </p>
      </section>
    `;

    dialogAttempt.disabled = status === "upcoming";
    dialogAttempt.textContent =
      status === "upcoming" ? "Test Locked" : "Check CBT";

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      alert(`${test.title}\n${test.description}\n${formatDate(test.date)}`);
    }
  }

  async function openCBT(test) {
    if (statusOf(test) === "upcoming") {
      alert(
        `${test.title} abhi open nahi hai.\n` +
        `Scheduled date: ${formatDate(test.date)}`
      );
      return;
    }

    const fileURL = new URL(test.file, document.baseURI);

    if (fileURL.origin !== window.location.origin) {
      alert("Invalid CBT file location.");
      return;
    }

    const button = dialogAttempt;
    const originalText = button.textContent;

    button.disabled = true;
    button.textContent = "Checking paper…";

    try {
      const response = await fetch(fileURL.href, {
        method: "HEAD",
        cache: "no-store"
      });

      if (!response.ok) {
        throw new Error("CBT paper not found.");
      }

      const contentType = response.headers.get("content-type") || "";

      if (
        contentType.includes("text/html") ||
        fileURL.pathname.endsWith(".html")
      ) {
        // GitHub Pages may return the 404 page with status 200.
        const check = await fetch(fileURL.href, {
          cache: "no-store"
        });

        const html = await check.text();

        if (
          /<title>\s*404\b/i.test(html) ||
          /There isn't a GitHub Pages site here/i.test(html) ||
          /Page not found/i.test(html)
        ) {
          throw new Error("CBT file is missing.");
        }
      }

      // Attempt to open only after the file check.
      window.open(fileURL.href, "_blank", "noopener,noreferrer");

    } catch (error) {
      alert(
        `${test.title} ka actual CBT paper nahi mila.\n\n` +
        `GitHub repository mein ye file upload karo:\n` +
        `${test.file}\n\n` +
        "Note: GitHub Pages par public files ko direct URL se access kiya ja sakta hai."
      );
    } finally {
      button.disabled = statusOf(test) === "upcoming";
      button.textContent = originalText;
    }
  }

  function updateCountdown() {
    const now = Date.now();

    const liveTest = tests.find(
      test => statusOf(test, now) === "live"
    );

    const nextTest = tests.find(
      test => statusOf(test, now) === "upcoming"
    );

    const target = liveTest || nextTest;

    const title = $("#nextTitle");
    const date = $("#nextDate");
    const label = $("#nextLabel");
    const statusBadge = $("#nextStatus");
    const countLabel = $("#countLabel");

    if (!target) {
      title.textContent = "Series Completed";
      date.textContent = "All scheduled tests have ended.";
      label.textContent = "NEET AARAMBH Physics";
      statusBadge.textContent = "Completed";
      countLabel.textContent = "Thank you for completing the series.";

      ["Days", "Hours", "Minutes", "Seconds"].forEach(part => {
        $(`#cd${part}`).textContent = "00";
      });

      return;
    }

    const targetTime = liveTest ? endTime(target) : startTime(target);
    const remaining = Math.max(0, targetTime - now);

    title.textContent = `${target.title}: ${target.description}`;
    date.textContent = formatDate(target.date);
    label.textContent = liveTest
      ? "Current live test ends in"
      : "Next scheduled test";

    statusBadge.textContent = liveTest ? "Live Now" : "Upcoming";
    statusBadge.style.color = liveTest
      ? "var(--green)"
      : "var(--amber)";

    const days = Math.floor(remaining / 86400000);
    const hours = Math.floor((remaining % 86400000) / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    $("#cdDays").textContent = pad(days);
    $("#cdHours").textContent = pad(hours);
    $("#cdMinutes").textContent = pad(minutes);
    $("#cdSeconds").textContent = pad(seconds);

    countLabel.textContent = liveTest
      ? `Scheduled close: ${formatTime(targetTime)} IST`
      : `Starts at ${formatTime(targetTime)} IST`;
  }

  function setFilter(filter) {
    activeFilter = filter;
    activePhase = null;

    $$(".filter").forEach(button => {
      const selected = button.dataset.filter === filter;

      button.classList.toggle("active", selected);
      button.setAttribute("aria-pressed", String(selected));
    });

    renderCards();
  }

  // Search
  searchInput.addEventListener("input", renderCards);

  // Category and status filters
  $$(".filter").forEach(button => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter);
    });
  });

  // Reset all filters
  $("#resetFilters").addEventListener("click", () => {
    searchInput.value = "";
    setFilter("all");
  });

  // Test card actions
  grid.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");

    if (!button) return;

    const test = window.getTestById(button.dataset.id);

    if (!test) return;

    if (button.dataset.action === "syllabus") {
      renderSyllabus(test);
    } else if (button.dataset.action === "attempt") {
      openCBT(test);
    }
  });

  // CBT button in syllabus popup
  dialogAttempt.addEventListener("click", () => {
    const test = window.getTestById(selectedTestId);

    if (test) openCBT(test);
  });

  // Dialog close controls
  $("#closeDialog").addEventListener("click", () => {
    dialog.close();
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  // Phase navigation
  $$("[data-phase-jump]").forEach(link => {
    link.addEventListener("click", () => {
      activePhase = Number(link.dataset.phaseJump);
      activeFilter = "all";
      searchInput.value = "";

      $$(".filter").forEach(button => {
        const selected = button.dataset.filter === "all";

        button.classList.toggle("active", selected);
        button.setAttribute("aria-pressed", String(selected));
      });

      renderCards();
    });
  });

  // Page configuration
  $("#supportLink").href = config.support;
  $("#currentYear").textContent = new Date().getFullYear();

  $("#totalCount").textContent = tests.length;
  $("#chapterCount").textContent =
    tests.filter(test => test.type === "chapter").length;

  $("#mixedCount").textContent =
    tests.filter(test => test.type === "mixed").length;

  $("#mockCount").textContent =
    tests.filter(test => test.type === "full").length;

  // Initial rendering
  renderCards();
  updateCountdown();

  countdownTimer = window.setInterval(() => {
    updateCountdown();
    renderCards();
  }, 1000);

  window.addEventListener("pagehide", () => {
    if (countdownTimer !== null) {
      window.clearInterval(countdownTimer);
    }
  });
})();
