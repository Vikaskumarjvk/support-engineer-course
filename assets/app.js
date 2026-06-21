/* SE Academy app. Vanilla JS. Loads window.SE_CONTENT, renders, tracks progress. */
(function () {
  "use strict";

  var LESSONS = window.SE_CONTENT || [];
  var PROGRESS_KEY = "se_academy_progress_v1";
  var SECTIONS = ["Course", "Training"];
  var SECTION_BLURB = {
    Course: "The zero-to-hero curriculum. Read in order.",
    Training: "Practice drills. Do these to build the reflexes."
  };

  // ---- progress (localStorage) ----
  function loadProgress() {
    try { return JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {}; }
    catch (e) { return {}; }
  }
  function saveProgress(p) {
    try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (e) {}
  }
  var progress = loadProgress();

  // ---- dom refs ----
  var $ = function (id) { return document.getElementById(id); };
  var nav = $("nav"), content = $("content"), crumb = $("crumb");
  var progressText = $("progress-text"), progressFill = $("progress-fill");
  var markBtn = $("mark-done"), prevBtn = $("prev"), nextBtn = $("next");
  var searchInput = $("search"), searchResults = $("search-results");
  var sidebar = $("sidebar");

  var currentId = null;

  // ---- build sidebar ----
  function buildNav() {
    nav.innerHTML = "";
    SECTIONS.forEach(function (sec) {
      var items = LESSONS.filter(function (l) { return l.section === sec; });
      if (!items.length) return;
      var wrap = document.createElement("div");
      wrap.className = "nav-section";
      var title = document.createElement("div");
      title.className = "nav-section-title";
      title.textContent = sec + "  (" + items.length + ")";
      wrap.appendChild(title);
      items.forEach(function (l, i) {
        var a = document.createElement("div");
        a.className = "nav-item" + (progress[l.id] ? " done" : "");
        a.dataset.id = l.id;
        a.innerHTML =
          '<span class="nav-check">&#10003;</span>' +
          '<span class="nav-num">' + (i + 1) + '</span>' +
          '<span class="nav-label"></span>';
        a.querySelector(".nav-label").textContent = l.title;
        a.addEventListener("click", function () { go(l.id); closeMobile(); });
        wrap.appendChild(a);
      });
      nav.appendChild(wrap);
    });
    updateProgressUI();
    highlightActive();
  }

  function highlightActive() {
    Array.prototype.forEach.call(nav.querySelectorAll(".nav-item"), function (el) {
      el.classList.toggle("active", el.dataset.id === currentId);
    });
  }

  function updateProgressUI() {
    var done = LESSONS.filter(function (l) { return progress[l.id]; }).length;
    var total = LESSONS.length;
    progressText.textContent = done + " / " + total + " done";
    progressFill.style.width = total ? (done / total * 100) + "%" : "0%";
    Array.prototype.forEach.call(nav.querySelectorAll(".nav-item"), function (el) {
      el.classList.toggle("done", !!progress[el.dataset.id]);
    });
  }

  // ---- render a lesson ----
  function lessonIndex(id) {
    for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return i;
    return -1;
  }

  function go(id) {
    if (id === "home" || !id) { renderHome(); return; }
    var idx = lessonIndex(id);
    if (idx < 0) { renderHome(); return; }
    var l = LESSONS[idx];
    currentId = id;
    location.hash = id;
    content.innerHTML = l.html;
    crumb.innerHTML = l.section + " &nbsp;/&nbsp; <b></b>";
    crumb.querySelector("b").textContent = l.title;
    // mark-done button state
    setMarkBtn();
    // pager
    prevBtn.disabled = idx <= 0;
    nextBtn.disabled = idx >= LESSONS.length - 1;
    prevBtn.onclick = function () { if (idx > 0) go(LESSONS[idx - 1].id); };
    nextBtn.onclick = function () { if (idx < LESSONS.length - 1) go(LESSONS[idx + 1].id); };
    highlightActive();
    window.scrollTo(0, 0);
    content.parentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }

  function setMarkBtn() {
    var isDone = !!progress[currentId];
    markBtn.classList.toggle("is-done", isDone);
    markBtn.textContent = isDone ? "✓ done" : "mark done";
  }

  markBtn.addEventListener("click", function () {
    if (!currentId) return;
    if (progress[currentId]) delete progress[currentId];
    else progress[currentId] = true;
    saveProgress(progress);
    setMarkBtn();
    updateProgressUI();
  });

  $("reset-progress").addEventListener("click", function () {
    if (confirm("Clear all your done-marks?")) {
      progress = {};
      saveProgress(progress);
      updateProgressUI();
      setMarkBtn();
    }
  });

  // ---- home page ----
  function renderHome() {
    currentId = "home";
    location.hash = "home";
    var done = LESSONS.filter(function (l) { return progress[l.id]; }).length;
    var first = LESSONS.length ? LESSONS[0] : null;
    var counts = {};
    SECTIONS.forEach(function (s) { counts[s] = LESSONS.filter(function (l) { return l.section === s; }).length; });
    var cards = SECTIONS.filter(function (s) { return counts[s]; }).map(function (s) {
      var firstOf = LESSONS.find(function (l) { return l.section === s; });
      return '<div class="home-card" data-go="' + (firstOf ? firstOf.id : "") + '">' +
        "<h3>" + s + "</h3>" +
        "<p>" + (SECTION_BLURB[s] || "") + "</p>" +
        '<div class="count">' + counts[s] + " lessons</div></div>";
    }).join("");
    content.innerHTML =
      '<div class="home-hero">' +
      "<h1>Support Engineer, from zero</h1>" +
      "<p>A complete, beginner-friendly Support Engineer course. The full curriculum plus practice drills. Read the Course in order, then build the reflexes with Training.</p>" +
      "<p><b>" + done + " / " + LESSONS.length + "</b> lessons marked done. " +
      (first ? 'Pick up where you like, or <a href="#' + first.id + '" data-go="' + first.id + '">start at lesson 1</a>.' : "") +
      "</p>" +
      '<div class="home-cards">' + cards + "</div>" +
      "<p style=\"color:var(--txt-faint);font-size:13px\">Tip: use the search box to jump to any topic. Mark lessons done as you go, your progress is saved on this machine.</p>" +
      "</div>";
    crumb.innerHTML = "<b>Home</b>";
    markBtn.classList.remove("is-done");
    markBtn.textContent = "mark done";
    prevBtn.disabled = true; nextBtn.disabled = LESSONS.length === 0;
    nextBtn.onclick = function () { if (LESSONS.length) go(LESSONS[0].id); };
    prevBtn.onclick = function () {};
    highlightActive();
    Array.prototype.forEach.call(content.querySelectorAll("[data-go]"), function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        var id = el.getAttribute("data-go");
        if (id) go(id);
      });
    });
    window.scrollTo(0, 0);
  }

  // ---- search ----
  function snippet(text, q) {
    var i = text.indexOf(q);
    if (i < 0) return "";
    var start = Math.max(0, i - 35);
    var end = Math.min(text.length, i + q.length + 45);
    var s = (start > 0 ? "..." : "") + text.slice(start, end) + (end < text.length ? "..." : "");
    // escape then highlight
    s = s.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
    var qEsc = q.replace(/[&<>]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]; });
    return s.replace(new RegExp("(" + qEsc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig"), "<mark>$1</mark>");
  }

  searchInput.addEventListener("input", function () {
    var q = searchInput.value.trim().toLowerCase();
    if (q.length < 2) { searchResults.classList.remove("open"); searchResults.innerHTML = ""; return; }
    var hits = [];
    for (var i = 0; i < LESSONS.length && hits.length < 25; i++) {
      var l = LESSONS[i];
      if (l.text.indexOf(q) >= 0 || l.title.toLowerCase().indexOf(q) >= 0) {
        hits.push(l);
      }
    }
    if (!hits.length) {
      searchResults.innerHTML = '<div class="sr-item"><div class="sr-snip">no matches</div></div>';
      searchResults.classList.add("open");
      return;
    }
    searchResults.innerHTML = hits.map(function (l) {
      return '<div class="sr-item" data-id="' + l.id + '">' +
        '<div class="sr-title">' + l.title + "</div>" +
        '<div class="sr-snip">' + (snippet(l.text, q) || l.section) + "</div></div>";
    }).join("");
    searchResults.classList.add("open");
    Array.prototype.forEach.call(searchResults.querySelectorAll(".sr-item"), function (el) {
      if (!el.dataset.id) return;
      el.addEventListener("click", function () {
        go(el.dataset.id);
        searchResults.classList.remove("open");
        searchInput.value = "";
        closeMobile();
      });
    });
  });
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".search-wrap")) searchResults.classList.remove("open");
  });

  // ---- mobile menu ----
  $("menu-toggle").addEventListener("click", function () { sidebar.classList.toggle("open"); });
  function closeMobile() { sidebar.classList.remove("open"); }

  // ---- boot ----
  buildNav();
  var hash = (location.hash || "").replace(/^#/, "");
  if (hash && lessonIndex(hash) >= 0) go(hash);
  else renderHome();

  window.addEventListener("hashchange", function () {
    var h = (location.hash || "").replace(/^#/, "");
    if (h && h !== currentId && lessonIndex(h) >= 0) go(h);
    else if (h === "home" && currentId !== "home") renderHome();
  });
})();
