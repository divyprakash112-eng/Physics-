
(() => {
  "use strict";

  const config = window.NA_CONFIG || {};
  const tests = window.NA_TESTS || [];
  const timezone = config.timezone || "Asia/Kolkata";
  const startHour = config.startHour ?? 10;
  const endHour = config.endHour ?? 22;

  const grid = document.getElementById("testGrid");
  const search = document.getElementById("testSearch");
  const empty = document.getElementById("emptyState");
  const dialog = document.getElementById("syllabusDialog");
  const dialogTitle = document.getElementById("syllabusTitle");
  const dialogBody = document.getElementById("syllabusBody");
  const closeDialog = document.getElementById("closeDialog");

  let activeFilter = "all";
  let query = "";
  let timer;

  const pad = n => String(n).padStart(2, "0");
  const fileFor = t => t.file || `tests/test-${pad(t.id)}.html`;

  function escapeHTML(v) {
    return String(v ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
    })[c]);
  }

  function nowParts() {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: timezone, year:"numeric", month:"2-digit", day:"2-digit",
      hour:"2-digit", minute:"2-digit", second:"2-digit", hourCycle:"h23"
    }).formatToParts(new Date());
    return Object.fromEntries(parts.filter(x => x.type !== "literal").map(x => [x.type, x.value]));
  }

  function todayString(p = nowParts()) {
    return `${p.year}-${p.month}-${p.day}`;
  }

  function currentMinutes(p = nowParts()) {
    return Number(p.hour) * 60 + Number(p.minute);
  }

  function dateLabel(s) {
    const [y,m,d] = s.split("-").map(Number);
    return new Date(Date.UTC(y,m-1,d)).toLocaleDateString("en-IN", {
      day:"numeric", month:"short", year:"numeric", timeZone:"UTC"
    });
  }

  function stateOf(test) {
    const today = todayString();
    if (today < test.date) return "upcoming";
    if (today > test.date) return "previous";
    const mins = currentMinutes();
    if (mins < startHour * 60) return "upcoming";
    if (mins < endHour * 60) return "live";
    return "previous";
  }

  function typeLabel(type) {
    return ({chapter:"CHAPTER-WISE", mixed:"MIXED TEST", full:"FULL MOCK"})[type] || String(type).toUpperCase();
  }

  function stateLabel(state) {
    return ({upcoming:"UPCOMING", live:"LIVE NOW", previous:"PREVIOUS"})[state];
  }

  function messageFor(test, state) {
    if (state === "live") return `Live now · ${startHour} AM–${endHour} PM IST`;
    if (state === "upcoming") return `Goes live on ${dateLabel(test.date)} · ${startHour} AM–${endHour} PM IST`;
    return `Scheduled date: ${dateLabel(test.date)} · CBT availability depends on uploaded file`;
  }

  function searchMatches(test) {
    return [
      test.title, `Test ${test.id}`, test.id, test.type,
      test.date, test.description, test.phase
    ].join(" ").toLowerCase().includes(query);
  }

  function filterMatches(test, state) {
    if (["live","upcoming","previous"].includes(activeFilter)) return state === activeFilter;
    if (["chapter","mixed","full"].includes(activeFilter)) return test.type === activeFilter;
    return true;
  }

  function render() {
    const shown = tests.filter(t => searchMatches(t) && filterMatches(t, stateOf(t)));
    grid.innerHTML = shown.map(test => {
      const state = stateOf(test);
      const phase = Number(test.phase) || (test.id <= 40 ? 1 : 2);
      const locked = state === "upcoming";
      return `
        <article class="test-card">
          <div class="test-top">
            <span class="test-number">TEST ${pad(test.id)}</span>
            <span class="badge ${state}">${stateLabel(state)}</span>
          </div>
          <h3>${escapeHTML(test.title || `Test ${pad(test.id)}`)}</h3>
          <p class="test-date">▦ &nbsp; <strong>Test date:</strong> ${dateLabel(test.date)}</p>
          <span class="type-badge ${escapeHTML(test.type)}">${typeLabel(test.type)}</span>
          <span class="phase-label">Phase ${phase}</span>
          <p class="test-description">${escapeHTML(test.description || "Physics practice test")}</p>
          <p class="test-message">${messageFor(test,state)}</p>
          <div class="card-actions">
            <button class="syllabus-button" data-syllabus="${test.id}">View Syllabus</button>
            <button data-attempt="${test.id}" ${locked ? "disabled" : ""}>
              ${locked ? "Opens on Test Date" : "Attempt Test ↗"}
            </button>
          </div>
        </article>`;
    }).join("");

    empty.hidden = shown.length > 0;
    grid.hidden = shown.length === 0;
  }

  async function openTest(test) {
    if (stateOf(test) === "upcoming") {
      alert(`This test opens on ${dateLabel(test.date)} at ${startHour}:00 AM IST.`);
      return;
    }

    const path = fileFor(test);
    try {
      const response = await fetch(path, { method:"HEAD", cache:"no-store" });
      if (response.ok) {
        window.location.href = path;
      } else {
        alert(`Test ${pad(test.id)} ka CBT file abhi available nahi hai.\nExpected file: ${path}`);
      }
    } catch {
      alert(`CBT file check nahi ho paya.\nExpected file: ${path}`);
    }
  }

  function showSyllabus(test) {
    dialogTitle.textContent = `${test.title || `Test ${pad(test.id)}`} — Syllabus`;
    dialogBody.innerHTML = `
      <section>
        <h3>${typeLabel(test.type)}</h3>
        <p><strong>Date:</strong> ${dateLabel(test.date)}</p>
        <p><strong>Phase:</strong> ${Number(test.phase) || (test.id <= 40 ? 1 : 2)}</p>
        <p>${escapeHTML(test.description || "Please refer to the planner for syllabus details.")}</p>
        <p>For the complete syllabus breakdown, open the official test-series planner.</p>
      </section>`;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  grid.addEventListener("click", event => {
    const syllabusButton = event.target.closest("[data-syllabus]");
    const attemptButton = event.target.closest("[data-attempt]");
    if (syllabusButton) {
      const test = tests.find(t => t.id === Number(syllabusButton.dataset.syllabus));
      if (test) showSyllabus(test);
    }
    if (attemptButton && !attemptButton.disabled) {
      const test = tests.find(t => t.id === Number(attemptButton.dataset.attempt));
      if (test) openTest(test);
    }
  });

  search.addEventListener("input", () => {
    query = search.value.trim().toLowerCase();
    render();
  });

  document.querySelectorAll("[data-filter]").forEach(button => {
    button.addEventListener("click", () => {
      activeFilter = button.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach(b => {
        b.classList.toggle("active", b === button);
        b.setAttribute("aria-pressed", String(b === button));
      });
      render();
    });
  });

  document.querySelectorAll("[data-phase-jump]").forEach(link => {
    link.addEventListener("click", () => {
      activeFilter = "all";
      query = "";
      search.value = "";
      const phase = Number(link.dataset.phaseJump);
      document.querySelectorAll("[data-filter]").forEach(b => {
        b.classList.toggle("active", b.dataset.filter === "all");
        b.setAttribute("aria-pressed", String(b.dataset.filter === "all"));
      });
      render();
      requestAnimationFrame(() => {
        const cards = [...grid.querySelectorAll(".test-card")];
        const first = cards.find(card => {
          const number = Number(card.querySelector(".test-number").textContent.replace(/\D/g,""));
          return phase === 1 ? number <= 40 : number >= 41;
        });
        if (first) first.scrollIntoView({behavior:"smooth", block:"start"});
      });
    });
  });

  closeDialog.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  const support = document.getElementById("supportLink");
  if (support && config.support) support.href = config.support;

  const planner = config.planner || "planner/NEET-AARAMBH-Physics-Test-Series-Planner-2027.pdf";
  ["plannerHero","dialogPlanner"].forEach(id => {
    const link = document.getElementById(id);
    if (link) link.href = planner;
  });

  function updateCountdown() {
    const today = todayString();
    const next = tests.find(t => t.date >= today) || tests[tests.length - 1];
    if (!next) return;

    const title = document.getElementById("nextTitle");
    const date = document.getElementById("nextDate");
    const countdown = document.getElementById("countdown");
    const label = document.getElementById("countLabel");

    title.textContent = `${next.title || `Test ${pad(next.id)}`}: ${next.description}`;
    date.textContent = `${dateLabel(next.date)} · 10:00 AM IST`;

    const [y,m,d] = next.date.split("-").map(Number);
    const target = Date.UTC(y,m-1,d,4,30,0);
    const diff = Math.max(0,target - Date.now());
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor(diff % 86400000 / 3600000);
    const minutes = Math.floor(diff % 3600000 / 60000);
    const seconds = Math.floor(diff % 60000 / 1000);

    countdown.textContent = `${pad(days)} : ${pad(hours)} : ${pad(minutes)} : ${pad(seconds)}`;
    label.textContent = "Days · Hours · Minutes · Seconds · IST";
  }

  if (!tests.length) {
    grid.innerHTML = '<p class="loading">No tests were found in assets/js/tests.js.</p>';
  } else {
    render();
    updateCountdown();
    timer = setInterval(() => {
      updateCountdown();
      render();
    }, 1000);
  }

  window.addEventListener("pagehide", () => clearInterval(timer));
})();
