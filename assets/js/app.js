
(() => {
  "use strict";

  const config = window.NA_CONFIG || {};
  const TIMEZONE = config.timezone || "Asia/Kolkata";
  const START_HOUR = Number(config.startHour ?? 10);
  const END_HOUR = Number(config.endHour ?? 22);

  const grid = document.getElementById("testGrid");
  const searchInput = document.getElementById("testSearch");
  const dialog = document.getElementById("syllabusDialog");
  const syllabusTitle = document.getElementById("syllabusTitle");
  const syllabusBody = document.getElementById("syllabusBody");

  let syllabusData = {};
  let activeFilter = "all";
  let searchQuery = "";
  let fileStatus = new Map();

  const pad = n => String(n).padStart(2, "0");

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;",
      '"': "&quot;", "'": "&#39;"
    })[c]);
  }

  function nowParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: TIMEZONE,
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hourCycle: "h23"
    }).formatToParts(new Date());

    return Object.fromEntries(
      parts.filter(p => p.type !== "literal")
        .map(p => [p.type, p.value])
    );
  }

  function todayString(p = nowParts()) {
    return `${p.year}-${p.month}-${p.day}`;
  }

  function minutesNow(p = nowParts()) {
    return Number(p.hour) * 60 + Number(p.minute);
  }

  function formatDate(s) {
    const [y, m, d] = s.split("-").map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en-IN", {
      day: "numeric", month: "short", year: "numeric", timeZone: "UTC"
    });
  }

  function scheduleState(test) {
    const now = nowParts();
    const today = todayString(now);

    if (today < test.date) return "upcoming";
    if (today > test.date) return "previous";

    const mins = minutesNow(now);
    if (mins < START_HOUR * 60) return "upcoming";
    if (mins < END_HOUR * 60) return "live";
    return "previous";
  }

  function isUploaded(test) {
    return fileStatus.get(String(test.id)) === true;
  }

  function statusLabel(state) {
    return state === "live" ? "LIVE NOW"
      : state === "previous" ? "PREVIOUS" : "UPCOMING";
  }

  function scheduleMessage(test, state) {
    if (state === "live") return "Live now · 10 AM–10 PM IST";
    if (state === "upcoming") {
      return `Goes live on ${formatDate(test.date)} · 10 AM–10 PM IST`;
    }
    return isUploaded(test)
      ? "Available for practice anytime"
      : `Scheduled date: ${formatDate(test.date)} · CBT coming soon`;
  }

  async function checkCBTFile(test) {
    try {
      const response = await fetch(test.file, {
        method: "HEAD", cache: "no-store"
      });
      if (response.ok) return true;
      if (response.status !== 403 && response.status !== 405) return false;
    } catch (_) {}

    try {
      const response = await fetch(test.file, { cache: "no-store" });
      return response.ok;
    } catch (_) {
      return false;
    }
  }

  function getTestById(id) {
    return tests.find(t => String(t.id) === String(id));
  }

  function getSyllabus(id) {
    return syllabusData[String(id)] || null;
  }

  function openSyllabus(test) {
    if (!dialog || !syllabusTitle || !syllabusBody) return;

    const syllabus = getSyllabus(test.id);
    syllabusTitle.textContent = `${test.title} — Syllabus`;

    if (!syllabus) {
      syllabusBody.innerHTML =
        '<p class="syllabus-empty">Please check the Complete Test Planner for syllabus details.</p>';
    } else {
      syllabusBody.innerHTML = Object.entries(syllabus).map(([subject, chapters]) => `
        <section class="syllabus-subject">
          <h3>${escapeHTML(subject)}</h3>
          <ul>${(Array.isArray(chapters) ? chapters : [])
            .map(ch => `<li>${escapeHTML(ch)}</li>`).join("")}</ul>
        </section>
      `).join("");
    }

    if (typeof dialog.showModal === "function") {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function matchesSearch(test) {
    if (!searchQuery) return true;
    const syllabus = getSyllabus(test.id);
    const chapters = syllabus ? Object.values(syllabus).flat().join(" ") : "";

    return [
      test.title, `Test ${test.id}`, test.type, test.date,
      test.description, test.phase, chapters
    ].join(" ").toLowerCase().includes(searchQuery);
  }

  function matchesFilter(test, state) {
    if (["live", "upcoming", "previous"].includes(activeFilter)) {
      return state === activeFilter;
    }
    if (["chapter", "mixed", "full"].includes(activeFilter)) {
      return test.type === activeFilter;
    }
    return true;
  }

  function typeLabel(test) {
    if (test.type === "chapter") return "CHAPTER-WISE";
    if (test.type === "mixed") return "CUMULATIVE MIXED TEST";
    if (test.id === 50) return "FINAL MOCK";
    return "FULL SYLLABUS MOCK";
  }

  function renderTests() {
    if (!grid) return;

    const list = tests.filter(t =>
      matchesFilter(t, scheduleState(t)) && matchesSearch(t)
    );

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state">
          <h3>No tests found</h3>
          <p>Try another filter or search term.</p>
          <button class="btn primary" type="button" data-reset>Show All Tests</button>
        </div>`;
      return;
    }

    grid.innerHTML = list.map(test => {
      const state = scheduleState(test);
      const uploaded = isUploaded(test);

      let action;
      if (uploaded && state !== "upcoming") {
        action = `
          <a class="btn attempt-btn ${state === "live" ? "is-live" : ""}"
             href="${escapeHTML(test.file)}" target="_blank" rel="noopener">
            ${state === "live" ? "Start Test ↗" : "Attempt Test ↗"}
          </a>`;
      } else {
        action = `
          <button class="btn unavailable-btn" type="button" disabled>
            ${state === "upcoming" ? "Opens on Test Date" : "CBT Coming Soon"}
          </button>`;
      }

      const pill = test.type === "chapter" ? "part-pill"
        : test.type === "mixed" ? "mixed-pill" : "full-pill";

      return `
        <article class="test-card state-${state}">
          <div class="card-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="status status-${state}">${statusLabel(state)}</span>
          </div>
          <h3>${escapeHTML(test.title)}</h3>
          <div class="date-line">
            <span class="date-icon">▦</span>
            <span><strong>Test date:</strong> ${formatDate(test.date)}</span>
          </div>
          <div class="type-pill ${pill}">${typeLabel(test)}</div>
          <div class="phase-label">${escapeHTML(test.phase)}</div>
          <p class="test-description">${escapeHTML(test.description)}</p>
          <p class="schedule-message">${escapeHTML(scheduleMessage(test, state))}</p>
          <div class="test-card-actions">
            <button class="btn syllabus-btn" type="button"
                    data-syllabus="${test.id}">View Syllabus</button>
            ${action}
          </div>
        </article>`;
    }).join("");
  }

  function timestampIST(date, hour) {
    return Date.parse(`${date}T${pad(hour)}:00:00+05:30`);
  }

  function renderCountdown() {
    const title = document.getElementById("nextTitle");
    const date = document.getElementById("nextDate");
    const countdown = document.getElementById("countdown");
    const label = document.getElementById("countLabel");
    if (!title || !date || !countdown) return;

    const now = nowParts();
    const today = todayString(now);
    const mins = minutesNow(now);

    const next = tests.find(t =>
      t.date > today || (t.date === today && mins < START_HOUR * 60)
    );

    if (!next) {
      title.textContent = "All scheduled tests completed";
      date.textContent = "Uploaded CBTs may still be available for practice.";
      countdown.textContent = "—";
      if (label) label.textContent = "NEET AARAMBH Physics";
      return;
    }

    title.textContent = next.title;
    date.textContent = `${formatDate(next.date)} · ${pad(START_HOUR)}:00 AM IST`;

    const seconds = Math.floor(Math.max(
      0, timestampIST(next.date, START_HOUR) - Date.now()
    ) / 1000);

    countdown.textContent =
      `${pad(Math.floor(seconds / 86400))} : ` +
      `${pad(Math.floor((seconds % 86400) / 3600))} : ` +
      `${pad(Math.floor((seconds % 3600) / 60))} : ${pad(seconds % 60)}`;

    if (label) label.textContent = "Days · Hours · Minutes · Seconds · IST";
  }

  function setActiveFilter(filter) {
    activeFilter = filter;
    document.querySelectorAll("[data-filter]").forEach(button => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });
    renderTests();
  }

  function connectEvents() {
    document.querySelectorAll("[data-filter]").forEach(button => {
      button.addEventListener("click", () => setActiveFilter(button.dataset.filter));
    });

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim().toLowerCase();
        renderTests();
      });
    }

    if (grid) {
      grid.addEventListener("click", event => {
        const button = event.target.closest("[data-syllabus]");
        if (button) {
          const test = getTestById(button.dataset.syllabus);
          if (test) openSyllabus(test);
          return;
        }
        if (event.target.closest("[data-reset]")) {
          if (searchInput) searchInput.value = "";
          searchQuery = "";
          setActiveFilter("all");
        }
      });
    }

    const closeButton = document.getElementById("closeDialog");
    if (closeButton) closeButton.addEventListener("click", () => {
      if (dialog?.close) dialog.close();
      else dialog?.removeAttribute("open");
    });

    if (dialog) dialog.addEventListener("click", event => {
      if (event.target === dialog && dialog.close) dialog.close();
    });
  }

  async function init() {
    if (typeof tests === "undefined" || !Array.isArray(tests)) {
      if (grid) grid.innerHTML =
        '<div class="error-state"><h3>Test schedule could not load</h3><p>Check assets/js/tests.js.</p></div>';
      return;
    }

    try {
      const response = await fetch("data/syllabus.json", { cache: "no-store" });
      if (!response.ok) throw new Error(`Syllabus request failed: ${response.status}`);
      syllabusData = await response.json();
    } catch (error) {
      console.error("Syllabus could not load:", error);
      syllabusData = {};
    }

    connectEvents();
    const results = await Promise.all(tests.map(async test => [
      String(test.id), await checkCBTFile(test)
    ]));

    fileStatus = new Map(results);
    renderTests();
    renderCountdown();

    setInterval(() => {
      renderTests();
      renderCountdown();
    }, 15000);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
