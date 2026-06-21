/* ============================================================
   SE Academy — rich app engine. Vanilla JS, no deps.
   content.js (window.SE_CONTENT) is read-only and untouched.
   ============================================================ */
(function () {
  "use strict";

  var LESSONS = window.SE_CONTENT || [];
  var K = {
    progress: "se_academy_progress_v1",
    theme: "se_academy_theme_v1",
    accent: "se_academy_accent_v1",
    font: "se_academy_font_v1",
    width: "se_academy_width_v1",
    motion: "se_academy_motion_v1",
    bm: "se_academy_bookmarks_v1",
    celebrated: "se_academy_celebrated_v1"
  };
  var SECTIONS = ["Course", "Training"];
  var SECTION_BLURB = {
    Course: "The zero-to-hero curriculum. Read in order, each module builds on the last.",
    Training: "Practice drills. Run these until the moves are reflex."
  };
  var SECTION_ICON = {
    Course: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
    Training: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="m21 21-1-1M3 3l1 1m14 18 4-4M2 6l4-4m1 7 7-7m-3 18 7-7"/></svg>'
  };

  var $ = function (id) { return document.getElementById(id); };
  var qa = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  function ls(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  var progress = lsJSON(K.progress);
  var bookmarks = lsJSON(K.bm);
  function saveProgress() { lsSet(K.progress, JSON.stringify(progress)); }
  function saveBm() { lsSet(K.bm, JSON.stringify(bookmarks)); }

  var doc = document.documentElement;
  var currentId = null, reduced = false;

  /* ---------- preferences ---------- */
  function applyPrefs() {
    doc.setAttribute("data-theme", ls(K.theme, (window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches) ? "light" : "dark"));
    doc.setAttribute("data-accent", ls(K.accent, "aurora"));
    doc.setAttribute("data-font", ls(K.font, "m"));
    doc.setAttribute("data-width", ls(K.width, "cozy"));
    var sysReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var motion = ls(K.motion, sysReduced ? "calm" : "full");
    doc.setAttribute("data-motion", motion);
    reduced = motion === "calm" || sysReduced;
  }
  applyPrefs();

  /* ---------- ambient aurora canvas ---------- */
  (function aurora() {
    var c = $("aurora"); if (!c) return;
    var ctx = c.getContext("2d"), W, H, blobs = [], raf = null, mx = 0.5, my = 0.4;
    function palette() {
      var s = getComputedStyle(doc);
      return [s.getPropertyValue("--a1").trim() || "#5b9aff", s.getPropertyValue("--a2").trim() || "#3ad6a0"];
    }
    function size() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    function seed() {
      var p = palette(); blobs = [];
      for (var i = 0; i < 5; i++) blobs.push({
        x: (0.15 + 0.7 * (i / 4)) * W, y: (0.1 + 0.25 * (i % 3)) * H,
        r: (W * 0.18) + i * 30, col: p[i % 2],
        dx: (i % 2 ? 1 : -1) * (0.12 + i * 0.03), dy: (i % 2 ? -1 : 1) * (0.09 + i * 0.02),
        ph: i * 1.3
      });
    }
    var t = 0;
    function frame() {
      t += 0.004;
      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var px = b.x + Math.sin(t + b.ph) * 60 + (mx - 0.5) * 50 * (i % 2 ? 1 : -1);
        var py = b.y + Math.cos(t * 0.8 + b.ph) * 50 + (my - 0.5) * 40;
        var g = ctx.createRadialGradient(px, py, 0, px, py, b.r);
        g.addColorStop(0, hexA(b.col, 0.5));
        g.addColorStop(1, hexA(b.col, 0));
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(px, py, b.r, 0, Math.PI * 2); ctx.fill();
      }
      raf = requestAnimationFrame(frame);
    }
    function hexA(hex, a) {
      hex = hex.replace("#", "");
      if (hex.length === 3) hex = hex.split("").map(function (x) { return x + x; }).join("");
      var r = parseInt(hex.slice(0, 2), 16), g = parseInt(hex.slice(2, 4), 16), bl = parseInt(hex.slice(4, 6), 16);
      return "rgba(" + r + "," + g + "," + bl + "," + a + ")";
    }
    function start() { if (reduced) { ctx.clearRect(0, 0, W || 0, H || 0); return; } if (!raf) frame(); }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; }
    size(); seed(); start();
    window.addEventListener("resize", function () { size(); seed(); });
    window.addEventListener("mousemove", function (e) { mx = e.clientX / window.innerWidth; my = e.clientY / window.innerHeight; }, { passive: true });
    document.addEventListener("visibilitychange", function () { document.hidden ? stop() : start(); });
    window.__aurora = { reseed: function () { seed(); }, start: start, stop: stop, clear: function () { stop(); ctx.clearRect(0, 0, W, H); } };
  })();

  /* ---------- confetti / celebration ---------- */
  var FX = (function () {
    var c = $("fx"); if (!c) return { burst: function () {}, rain: function () {} };
    var ctx = c.getContext("2d"), parts = [], raf = null, W, H;
    function size() { W = c.width = window.innerWidth; H = c.height = window.innerHeight; }
    size(); window.addEventListener("resize", size);
    function colors() { var s = getComputedStyle(doc); return [s.getPropertyValue("--a1").trim(), s.getPropertyValue("--a2").trim(), "#ffd166", "#ff6ea9"]; }
    function spawn(x, y, n, spread, up) {
      var cols = colors();
      for (var i = 0; i < n; i++) {
        var ang = (-Math.PI / 2) + (Math.random() - 0.5) * spread;
        var sp = 4 + Math.random() * (up || 7);
        parts.push({ x: x, y: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - (up ? 2 : 0),
          g: 0.16 + Math.random() * 0.1, s: 4 + Math.random() * 5, col: cols[(Math.random() * cols.length) | 0],
          rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3, life: 1, fade: 0.006 + Math.random() * 0.006 });
      }
      run();
    }
    function run() {
      if (raf) return;
      (function frame() {
        ctx.clearRect(0, 0, W, H);
        for (var i = parts.length - 1; i >= 0; i--) {
          var p = parts[i];
          p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= p.fade;
          if (p.life <= 0 || p.y > H + 30) { parts.splice(i, 1); continue; }
          ctx.save(); ctx.globalAlpha = Math.max(0, p.life); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.fillStyle = p.col; ctx.fillRect(-p.s / 2, -p.s / 2, p.s, p.s * 0.6); ctx.restore();
        }
        if (parts.length) raf = requestAnimationFrame(frame); else { raf = null; ctx.clearRect(0, 0, W, H); }
      })();
    }
    return {
      burst: function (x, y) { if (reduced) return; spawn(x, y, 70, 1.7, 6); },
      rain: function () { if (reduced) return; var i = 0; var iv = setInterval(function () { spawn(Math.random() * W, -20, 24, 0.5, 0); if (++i > 14) clearInterval(iv); }, 140); }
    };
  })();

  /* ---------- toast ---------- */
  var toastT = null;
  function toast(msg, ok) {
    var el = $("toast");
    el.innerHTML = (ok !== false ? '<span class="t-ic"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg></span>' : "") + escapeHtml(msg);
    el.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(function () { el.classList.remove("show"); }, 1900);
  }

  /* ---------- dom refs ---------- */
  var nav = $("nav"), bmView = $("bookmarks-view"), content = $("content"), crumb = $("crumb");
  var progressText = $("progress-text"), progressPct = $("progress-pct"), progressFill = $("progress-fill");
  var markBtn = $("mark-done"), pager = $("pager");
  var sidebar = $("sidebar"), scrim = $("scrim"), scroller = $("scroller");
  var tocEl = $("toc"), tocList = $("toc-list"), tocMeta = $("toc-meta"), readBar = $("read-bar"), ringFill = $("ring-fill");
  var bmBtn = $("bookmark-btn"), bmCount = $("bm-count");

  /* ---------- sidebar nav ---------- */
  function numberOf(l) { return LESSONS.filter(function (x) { return x.section === l.section; }).indexOf(l) + 1; }
  function buildNav() {
    nav.innerHTML = "";
    SECTIONS.forEach(function (sec) {
      var items = LESSONS.filter(function (l) { return l.section === sec; });
      if (!items.length) return;
      var wrap = document.createElement("div");
      wrap.className = "nav-section";
      var title = document.createElement("div");
      title.className = "nav-section-title";
      title.innerHTML = "<span>" + sec + "</span><span class='n'>" + items.length + "</span>";
      wrap.appendChild(title);
      items.forEach(function (l, i) {
        var a = document.createElement("div");
        a.className = "nav-item" + (progress[l.id] ? " done" : "") + (bookmarks[l.id] ? " bookmarked" : "");
        a.dataset.id = l.id;
        a.innerHTML = '<span class="nav-check">&#10003;</span><span class="nav-num">' + (i + 1) + '</span><span class="nav-label"></span><span class="nav-bm"><svg viewBox="0 0 24 24" width="11" height="11" fill="currentColor"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>';
        a.querySelector(".nav-label").textContent = l.title;
        a.addEventListener("click", function () { go(l.id); closeMobile(); });
        wrap.appendChild(a);
      });
      nav.appendChild(wrap);
    });
    updateProgressUI(); highlightActive();
  }
  function buildBookmarks() {
    var ids = LESSONS.filter(function (l) { return bookmarks[l.id]; });
    if (!ids.length) { bmView.innerHTML = '<div class="bm-empty">No saved lessons yet.<br>Press <kbd>B</kbd> on any lesson to bookmark it.</div>'; return; }
    bmView.innerHTML = '<div class="nav-section"><div class="nav-section-title"><span>Saved</span><span class="n">' + ids.length + '</span></div></div>';
    var sec = bmView.querySelector(".nav-section");
    ids.forEach(function (l) {
      var a = document.createElement("div");
      a.className = "nav-item" + (progress[l.id] ? " done" : "");
      a.dataset.id = l.id;
      a.innerHTML = '<span class="nav-check">&#10003;</span><span class="nav-num">' + numberOf(l) + '</span><span class="nav-label"></span>';
      a.querySelector(".nav-label").textContent = l.title;
      a.addEventListener("click", function () { go(l.id); closeMobile(); });
      sec.appendChild(a);
    });
  }
  function highlightActive() {
    qa(".nav-item", sidebar).forEach(function (el) {
      var on = el.dataset.id === currentId;
      el.classList.toggle("active", on);
      if (on) el.scrollIntoView({ block: "nearest" });
    });
  }
  function countUp(el, to) {
    if (reduced || to === 0) { el.textContent = to; return; }
    var from = 0, dur = 700, t0 = null;
    requestAnimationFrame(function step(ts) {
      if (!t0) t0 = ts; var p = Math.min((ts - t0) / dur, 1);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    });
  }
  function updateProgressUI() {
    var done = LESSONS.filter(function (l) { return progress[l.id]; }).length;
    var total = LESSONS.length, pct = total ? Math.round(done / total * 100) : 0;
    progressText.textContent = done + " / " + total + " done";
    progressPct.textContent = pct + "%"; progressFill.style.width = pct + "%";
    bmCount.textContent = LESSONS.filter(function (l) { return bookmarks[l.id]; }).length;
    qa(".nav-item", nav).forEach(function (el) {
      el.classList.toggle("done", !!progress[el.dataset.id]);
      el.classList.toggle("bookmarked", !!bookmarks[el.dataset.id]);
    });
  }
  function lessonIndex(id) { for (var i = 0; i < LESSONS.length; i++) if (LESSONS[i].id === id) return i; return -1; }

  /* ---------- enrich rendered lesson ---------- */
  var io = null;
  function enrichContent() {
    // copy buttons
    qa("pre", content).forEach(function (pre) {
      if (pre.querySelector(".copy-btn")) return;
      var btn = document.createElement("button");
      btn.className = "copy-btn"; btn.type = "button";
      btn.innerHTML = '<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg><span>copy</span>';
      btn.addEventListener("click", function () {
        var code = pre.querySelector("code"), text = code ? code.innerText : pre.innerText;
        var done = function () { btn.classList.add("copied"); btn.querySelector("span").textContent = "copied"; setTimeout(function () { btn.classList.remove("copied"); btn.querySelector("span").textContent = "copy"; }, 1400); };
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, function(){});
        else { var t = document.createElement("textarea"); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand("copy"); done(); } catch (e) {} document.body.removeChild(t); }
      });
      pre.appendChild(btn);
    });
    // heading ids + anchor links
    var n = 0;
    qa("h2, h3", content).forEach(function (h) {
      if (!h.id) h.id = "s-" + (n++) + "-" + h.textContent.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
      if (!h.querySelector(".anchor")) {
        var a = document.createElement("a");
        a.className = "anchor"; a.href = "#" + currentId; a.textContent = "#"; a.setAttribute("aria-hidden", "true");
        a.addEventListener("click", function (e) { e.preventDefault(); h.scrollIntoView({ behavior: "smooth", block: "start" }); });
        h.insertBefore(a, h.firstChild);
      }
    });
    // reveal-answer cards: drills label answers as <h3>/<h4> headings OR as
    // a bold paragraph "<p><strong>Model Answer:</strong> ...". Wrap either.
    var ansRe = /^(model (answer|solution|runbook)|model 5 whys|answers?:?|answer key|model walk)/i;
    function startsAnswer(el) {
      var t = el.textContent.trim();
      if (/^H[34]$/.test(el.tagName)) return ansRe.test(t);
      // a paragraph whose FIRST node is a <strong> opening the answer label
      if (el.tagName === "P" && el.firstElementChild && el.firstElementChild.tagName === "STRONG") {
        return ansRe.test(el.firstElementChild.textContent.trim());
      }
      return false;
    }
    function isAnswerBoundary(el) {
      // stop the card at the next heading, an <hr>, or the next answer label
      return /^H[1-4]$/.test(el.tagName) || el.tagName === "HR" || startsAnswer(el);
    }
    qa("#content > h3, #content > h4, #content > p", content).forEach(function (el) {
      if (el.dataset.wrapped || !startsAnswer(el)) return;
      var label = el.firstElementChild && el.firstElementChild.tagName === "STRONG"
        ? el.firstElementChild.textContent.replace(/[:：]\s*$/, "").trim()
        : el.textContent.trim();
      var collected = [];
      var sib = el.nextElementSibling;
      while (sib && !isAnswerBoundary(sib)) { var nx = sib.nextElementSibling; collected.push(sib); sib = nx; }
      // for the <p><strong> form, the label paragraph itself usually carries the first line of the answer
      var isPara = el.tagName === "P";
      if (!collected.length && !isPara) return;
      var card = document.createElement("div"); card.className = "reveal-card";
      var toggle = document.createElement("button"); toggle.type = "button"; toggle.className = "reveal-toggle";
      toggle.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg><span>Reveal: ' + escapeHtml(label) + '</span><svg class="chev" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>';
      var body = document.createElement("div"); body.className = "reveal-body";
      var inner = document.createElement("div"); inner.className = "reveal-inner";
      el.parentNode.insertBefore(card, el);
      if (isPara) {
        // keep the answer text but drop the leading "Model Answer:" strong label
        if (el.firstElementChild && el.firstElementChild.tagName === "STRONG") el.removeChild(el.firstElementChild);
        var lead = el.textContent.trim();
        el.dataset.wrapped = "1"; inner.appendChild(el);
        if (!lead) el.style.display = "none";
      } else {
        el.dataset.wrapped = "1"; el.style.display = "none";
      }
      collected.forEach(function (c) { inner.appendChild(c); });
      body.appendChild(inner); card.appendChild(toggle); card.appendChild(body);
      toggle.addEventListener("click", function () { card.classList.toggle("open"); });
    });
    // scroll-reveal blocks
    if (io) io.disconnect();
    var blocks = qa("#content > h2, #content > h3, #content > p, #content > ul, #content > ol, #content > table, #content > pre, #content > blockquote, #content > .reveal-card", content);
    if (!reduced && "IntersectionObserver" in window) {
      io = new IntersectionObserver(function (ents) {
        ents.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
      }, { root: scroller, threshold: 0.06, rootMargin: "0px 0px -8% 0px" });
      blocks.forEach(function (b, i) { if (i < 4) { b.classList.add("reveal", "in"); } else { b.classList.add("reveal"); io.observe(b); } });
    }
  }

  /* ---------- TOC + scroll-spy ---------- */
  var tocLinks = [], tocTargets = [];
  function readingTime(words) { return Math.max(1, Math.round((words || 600) / 200)); }
  function buildTOC(lesson) {
    tocList.innerHTML = ""; tocLinks = []; tocTargets = []; tocMeta.innerHTML = "";
    if (!tocEl) return;
    var heads = qa("h2, h3", content).filter(function (h) { return h.style.display !== "none"; });
    if (heads.length < 2) { tocEl.classList.add("empty"); return; }
    tocEl.classList.remove("empty");
    heads.forEach(function (h) {
      var link = document.createElement("div");
      link.className = "toc-link " + h.tagName.toLowerCase();
      link.textContent = h.textContent.replace(/^#/, "");
      link.addEventListener("click", function () { h.scrollIntoView({ behavior: "smooth", block: "start" }); });
      tocList.appendChild(link); tocLinks.push(link); tocTargets.push(h);
    });
    tocMeta.innerHTML = "≈ " + readingTime(lesson.words) + " min read · " + (lesson.words || "?") + " words";
  }
  function spyTOC() {
    if (!tocTargets.length) return;
    var top = scroller.scrollTop, best = 0;
    for (var i = 0; i < tocTargets.length; i++) if (tocTargets[i].offsetTop - 110 <= top) best = i;
    tocLinks.forEach(function (l, i) { l.classList.toggle("active", i === best); });
  }
  function updateReadBar() {
    var max = scroller.scrollHeight - scroller.clientHeight;
    var pct = max > 0 ? (scroller.scrollTop / max) : 0;
    readBar.style.width = (pct * 100) + "%";
    if (ringFill) ringFill.style.strokeDashoffset = (97.4 * (1 - pct)).toFixed(1);
  }
  scroller.addEventListener("scroll", function () { updateReadBar(); spyTOC(); }, { passive: true });

  /* ---------- render lesson ---------- */
  function go(id) {
    if (id === "home" || !id) { renderHome(); return; }
    var idx = lessonIndex(id); if (idx < 0) { renderHome(); return; }
    var l = LESSONS[idx];
    currentId = id;
    if (location.hash.replace(/^#/, "") !== id) location.hash = id;
    content.innerHTML = l.html;
    content.classList.remove("swap"); void content.offsetWidth; if (!reduced) content.classList.add("swap");
    crumb.innerHTML = "<span class='sec'>" + l.section + "</span> &nbsp;/&nbsp; <b></b>";
    crumb.querySelector("b").textContent = l.title;
    enrichContent(); buildTOC(l); setMarkBtn(); setBmBtn(); buildPager(idx); highlightActive();
    scroller.scrollTop = 0; updateReadBar(); spyTOC();
    document.title = l.title + " — SE Academy";
    try { document.dispatchEvent(new CustomEvent("se:render", { detail: { id: id, section: l.section, idx: idx } })); } catch (e) {}
  }
  function buildPager(idx) {
    var prev = idx > 0 ? LESSONS[idx - 1] : null, next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
    pager.innerHTML =
      (prev ? '<button class="pager-card prev" data-go="' + prev.id + '"><span class="pc-dir">← Previous</span><span class="pc-title">' + escapeHtml(prev.title) + '</span></button>' : '<button class="pager-card prev" disabled></button>') +
      (next ? '<button class="pager-card next" data-go="' + next.id + '"><span class="pc-dir">Next →</span><span class="pc-title">' + escapeHtml(next.title) + '</span></button>' : '<button class="pager-card next" disabled></button>');
    qa("[data-go]", pager).forEach(function (b) { b.addEventListener("click", function () { go(b.getAttribute("data-go")); }); });
  }
  function setMarkBtn() {
    var d = !!progress[currentId];
    markBtn.classList.toggle("is-done", d);
    markBtn.querySelector(".mark-label").textContent = d ? "done" : "mark done";
  }
  function setBmBtn() {
    var on = !!bookmarks[currentId];
    bmBtn.classList.toggle("on", on);
    bmBtn.querySelector("svg").setAttribute("fill", on ? "currentColor" : "none");
  }
  function toggleDone() {
    if (!currentId || currentId === "home") return;
    var wasDone = !!progress[currentId];
    if (wasDone) delete progress[currentId]; else progress[currentId] = true;
    saveProgress(); setMarkBtn(); updateProgressUI();
    try { document.dispatchEvent(new CustomEvent("se:done", { detail: { id: currentId, done: !wasDone } })); } catch (e) {}
    if (!wasDone) {
      var r = markBtn.getBoundingClientRect();
      FX.burst(r.left + r.width / 2, r.top + r.height / 2);
      var done = LESSONS.filter(function (l) { return progress[l.id]; }).length;
      if (done === LESSONS.length && LESSONS.length) celebrate();
      else toast("Marked done · " + done + "/" + LESSONS.length);
    } else toast("Marked not done", false);
  }
  markBtn.addEventListener("click", toggleDone);
  function toggleBm() {
    if (!currentId || currentId === "home") return;
    if (bookmarks[currentId]) { delete bookmarks[currentId]; toast("Bookmark removed", false); }
    else { bookmarks[currentId] = true; toast("Bookmarked"); }
    saveBm(); setBmBtn(); updateProgressUI(); if (bmView.hidden === false) buildBookmarks();
  }
  bmBtn.addEventListener("click", toggleBm);
  $("reset-progress").addEventListener("click", function () {
    if (confirm("Clear all your done-marks and bookmarks on this device?")) {
      progress = {}; bookmarks = {}; saveProgress(); saveBm(); lsSet(K.celebrated, "");
      updateProgressUI(); setMarkBtn(); setBmBtn(); buildBookmarks(); toast("Progress cleared", false);
    }
  });

  function celebrate() {
    if (ls(K.celebrated, "") === "1") { toast("All lessons done! 🎓"); return; }
    lsSet(K.celebrated, "1");
    $("celebrate-n").textContent = LESSONS.length;
    openOverlay("celebrate"); FX.rain();
  }
  $("celebrate-close").addEventListener("click", function () { closeOverlays(); });

  /* ---------- home / hero ---------- */
  function renderHome() {
    currentId = "home";
    if (location.hash.replace(/^#/, "") !== "home") location.hash = "home";
    var done = LESSONS.filter(function (l) { return progress[l.id]; }).length, total = LESSONS.length;
    var counts = {}; SECTIONS.forEach(function (s) { counts[s] = LESSONS.filter(function (l) { return l.section === s; }).length; });
    var resume = LESSONS.find(function (l) { return !progress[l.id]; }) || LESSONS[0];
    var resumeIsStart = resume && LESSONS.indexOf(resume) === 0 && done === 0;
    var totalWords = LESSONS.reduce(function (a, l) { return a + (l.words || 0); }, 0);
    var hours = Math.max(1, Math.round(totalWords / 200 / 60));

    var cards = SECTIONS.filter(function (s) { return counts[s]; }).map(function (s) {
      var firstOf = LESSONS.find(function (l) { return l.section === s; });
      return '<div class="home-card" data-go="' + (firstOf ? firstOf.id : "") + '">' +
        '<div class="hc-ic">' + (SECTION_ICON[s] || "") + '</div><h3>' + s + '</h3><p>' + (SECTION_BLURB[s] || "") + '</p>' +
        '<div class="count">' + counts[s] + ' lessons <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M5 12h14M13 6l6 6-6 6"/></svg></div></div>';
    }).join("");

    content.innerHTML =
      '<div class="hero"><div class="hero-bg">' +
      '<div class="hero-badge"><span class="pulse"></span> Self-paced · ' + total + ' lessons · installable · offline</div>' +
      '<h1>Support Engineer,<br><span class="grad">from zero.</span></h1>' +
      '<p class="hero-lede">A complete, beginner-friendly path into the Support Engineer role. The full curriculum first, then practice drills until the moves are reflex.</p>' +
      '<div class="hero-cta">' +
        (resume ? '<a class="btn btn-primary" data-go="' + resume.id + '"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' + (resumeIsStart ? "Start at lesson 1" : "Continue where you left off") + '</a>' : "") +
        '<button class="btn btn-ghost" id="hero-search"><svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Search topics <kbd style="margin-left:2px">⌘K</kbd></button>' +
      '</div>' +
      '<div class="hero-stats">' +
        '<div class="hero-stat"><div class="num" data-count="' + (counts.Course || 0) + '">0</div><div class="lbl">course modules</div></div>' +
        '<div class="hero-stat"><div class="num" data-count="' + (counts.Training || 0) + '">0</div><div class="lbl">drill banks</div></div>' +
        '<div class="hero-stat"><div class="num" data-count="' + done + '">0</div><div class="lbl">done so far</div></div>' +
        '<div class="hero-stat"><div class="num">~' + hours + 'h</div><div class="lbl">to read it all</div></div>' +
      '</div></div>' +
      '<div class="home-cards">' + cards + '</div>' +
      '<p class="home-note"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg> Press <kbd style="margin:0 2px">⌘K</kbd> to jump to a topic, <kbd style="margin:0 2px">?</kbd> for shortcuts. Progress saves on this device.</p>' +
      '</div>';

    crumb.innerHTML = "<b>Home</b>";
    markBtn.classList.remove("is-done"); markBtn.querySelector(".mark-label").textContent = "mark done";
    bmBtn.classList.remove("on"); bmBtn.querySelector("svg").setAttribute("fill", "none");
    pager.innerHTML = ""; if (tocEl) tocEl.classList.add("empty");
    document.title = "SE Academy — Support Engineer, from zero";
    qa("[data-go]", content).forEach(function (el) { el.addEventListener("click", function (e) { e.preventDefault(); var id = el.getAttribute("data-go"); if (id) go(id); }); });
    var hs = $("hero-search"); if (hs) hs.addEventListener("click", openPalette);
    qa(".hero-stat .num[data-count]", content).forEach(function (el) { countUp(el, parseInt(el.dataset.count, 10)); });
    // card spotlight follow
    qa(".home-card", content).forEach(function (card) {
      card.addEventListener("mousemove", function (e) { var r = card.getBoundingClientRect(); card.style.setProperty("--mx", (e.clientX - r.left) + "px"); card.style.setProperty("--my", (e.clientY - r.top) + "px"); });
    });
    highlightActive(); scroller.scrollTop = 0; updateReadBar();
  }

  /* ---------- command palette ---------- */
  var palette = $("palette"), pInput = $("palette-input"), pResults = $("palette-results");
  var pHits = [], pActive = 0;
  function openPalette() { closeOverlays(); palette.classList.add("open"); pInput.value = ""; renderPalette(""); setTimeout(function () { pInput.focus(); }, 30); }
  function closePalette() { palette.classList.remove("open"); }
  function snippet(text, q) {
    var i = text.indexOf(q); if (i < 0) return "";
    var start = Math.max(0, i - 30), end = Math.min(text.length, i + q.length + 50);
    var s = (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
    s = escapeHtml(s); var qe = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return s.replace(new RegExp("(" + qe + ")", "ig"), "<mark>$1</mark>");
  }
  function hi(t, q) { var e = escapeHtml(t); if (!q) return e; var qe = escapeHtml(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); return e.replace(new RegExp("(" + qe + ")", "ig"), "<mark>$1</mark>"); }
  function rowHtml(l, q) {
    var sub = q ? (snippet(l.text, q) || l.section) : l.section;
    return '<div class="pr-item" data-id="' + l.id + '"><span class="pr-num">' + numberOf(l) + '</span><div class="pr-body"><div class="pr-title">' + hi(l.title, q) + '</div><div class="pr-snip">' + sub + '</div></div></div>';
  }
  function renderPalette(q) {
    q = q.trim().toLowerCase();
    if (!q) {
      pHits = LESSONS.slice();
      pResults.innerHTML = SECTIONS.map(function (sec) {
        var items = LESSONS.filter(function (l) { return l.section === sec; });
        return items.length ? '<div class="pr-group">' + sec + '</div>' + items.map(function (l) { return rowHtml(l, ""); }).join("") : "";
      }).join("");
    } else {
      pHits = LESSONS.filter(function (l) { return l.title.toLowerCase().indexOf(q) >= 0 || l.text.indexOf(q) >= 0; });
      pResults.innerHTML = pHits.length ? pHits.map(function (l) { return rowHtml(l, q); }).join("") : '<div class="pr-empty">No lessons match “' + escapeHtml(q) + '”.</div>';
    }
    pActive = 0; markActive();
    qa(".pr-item", pResults).forEach(function (el) {
      el.addEventListener("click", function () { go(el.dataset.id); closePalette(); closeMobile(); });
      el.addEventListener("mousemove", function () { pActive = pHits.findIndex(function (h) { return h.id === el.dataset.id; }); markActive(); });
    });
  }
  function markActive() {
    qa(".pr-item", pResults).forEach(function (el) {
      var on = pHits[pActive] && el.dataset.id === pHits[pActive].id;
      el.classList.toggle("active", !!on); if (on) el.scrollIntoView({ block: "nearest" });
    });
  }
  pInput.addEventListener("input", function () { renderPalette(pInput.value); });
  palette.addEventListener("click", function (e) { if (e.target === palette) closePalette(); });
  $("search-trigger").addEventListener("click", openPalette);

  /* ---------- settings ---------- */
  var settings = $("settings");
  function openSettings() { closeOverlays(); settings.classList.add("open"); syncSettingsUI(); }
  function syncSettingsUI() {
    var map = [["#set-theme", "data-theme-set", doc.getAttribute("data-theme")],
      ["#set-accent", "data-accent-set", doc.getAttribute("data-accent")],
      ["#set-font", "data-font-set", doc.getAttribute("data-font")],
      ["#set-width", "data-width-set", doc.getAttribute("data-width")],
      ["#set-motion", "data-motion-set", doc.getAttribute("data-motion")]];
    map.forEach(function (m) {
      qa(m[0] + " [" + m[1] + "]").forEach(function (b) { b.classList.toggle("active", b.getAttribute(m[1]) === m[2]); });
    });
  }
  $("settings-btn").addEventListener("click", openSettings);
  settings.addEventListener("click", function (e) { if (e.target === settings) closeOverlays(); });
  function bindSeg(sel, attr, key, after) {
    qa(sel + " [" + attr + "]").forEach(function (b) {
      b.addEventListener("click", function () {
        var v = b.getAttribute(attr); doc.setAttribute(attr.replace("-set", "").replace("data-", "data-"), v);
        doc.setAttribute(key2attr(key), v); lsSet(K[key], v); syncSettingsUI(); if (after) after(v);
      });
    });
  }
  function key2attr(key) { return { theme: "data-theme", accent: "data-accent", font: "data-font", width: "data-width", motion: "data-motion" }[key]; }
  bindSeg("#set-theme", "data-theme-set", "theme", function () { if (window.__aurora) window.__aurora.reseed(); });
  bindSeg("#set-accent", "data-accent-set", "accent", function () { if (window.__aurora) window.__aurora.reseed(); });
  bindSeg("#set-font", "data-font-set", "font");
  bindSeg("#set-width", "data-width-set", "width");
  bindSeg("#set-motion", "data-motion-set", "motion", function (v) {
    reduced = v === "calm";
    if (window.__aurora) { if (reduced) window.__aurora.clear(); else window.__aurora.start(); }
  });

  /* ---------- theme quick toggle ---------- */
  function toggleTheme() {
    var n = doc.getAttribute("data-theme") === "dark" ? "light" : "dark";
    doc.setAttribute("data-theme", n); lsSet(K.theme, n); if (window.__aurora) window.__aurora.reseed();
  }
  $("theme-toggle").addEventListener("click", toggleTheme);

  /* ---------- shortcuts + sidebar tabs ---------- */
  function openShortcuts() { closeOverlays(); $("shortcuts").classList.add("open"); }
  $("shortcuts-btn").addEventListener("click", openShortcuts);
  $("sc-close").addEventListener("click", closeOverlays);
  $("shortcuts").addEventListener("click", function (e) { if (e.target === $("shortcuts")) closeOverlays(); });
  qa(".side-tab").forEach(function (t) {
    t.addEventListener("click", function () {
      qa(".side-tab").forEach(function (x) { x.classList.remove("active"); });
      t.classList.add("active");
      var b = t.dataset.stab === "bookmarks";
      nav.hidden = b; bmView.hidden = !b; if (b) buildBookmarks();
    });
  });

  function openOverlay(id) { var el = $(id); if (el) el.classList.add("open"); }
  function closeOverlays() { ["palette", "settings", "shortcuts", "celebrate"].forEach(function (id) { var el = $(id); if (el) el.classList.remove("open"); }); }

  /* ---------- keyboard ---------- */
  var gPending = false;
  document.addEventListener("keydown", function (e) {
    var pOpen = palette.classList.contains("open");
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); pOpen ? closePalette() : openPalette(); return; }
    if (e.key === "Escape") { closeOverlays(); closeMobile(); return; }
    if (pOpen) {
      if (e.key === "ArrowDown") { e.preventDefault(); pActive = Math.min(pActive + 1, pHits.length - 1); markActive(); }
      else if (e.key === "ArrowUp") { e.preventDefault(); pActive = Math.max(pActive - 1, 0); markActive(); }
      else if (e.key === "Enter") { e.preventDefault(); if (pHits[pActive]) { go(pHits[pActive].id); closePalette(); closeMobile(); } }
      return;
    }
    if (/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName)) return;
    if (e.key === "/") { e.preventDefault(); openPalette(); return; }
    if (e.key === "?") { e.preventDefault(); openShortcuts(); return; }
    var k = e.key.toLowerCase();
    if (gPending) { gPending = false; if (k === "h") { renderHome(); return; } }
    if (k === "g") { gPending = true; setTimeout(function () { gPending = false; }, 600); return; }
    if (k === "t") { toggleTheme(); return; }
    if (k === "d") { toggleDone(); return; }
    if (k === "b") { toggleBm(); return; }
    var idx = lessonIndex(currentId);
    if (e.key === "ArrowRight" && idx >= 0 && idx < LESSONS.length - 1) go(LESSONS[idx + 1].id);
    else if (e.key === "ArrowLeft" && idx > 0) go(LESSONS[idx - 1].id);
  });

  /* ---------- mobile drawer ---------- */
  $("menu-toggle").addEventListener("click", function () { var o = sidebar.classList.toggle("open"); scrim.classList.toggle("show", o); });
  function closeMobile() { sidebar.classList.remove("open"); scrim.classList.remove("show"); }
  scrim.addEventListener("click", closeMobile);

  /* ---------- public API for game.js (read-only helpers) ---------- */
  window.SEApp = {
    lessons: LESSONS,
    go: go,
    home: renderHome,
    current: function () { return currentId; },
    progress: function () { return progress; },
    fx: FX,
    toast: toast,
    content: content,
    numberOf: numberOf,
    onContent: function (fn) { document.addEventListener("se:render", function (e) { fn(e.detail); }); },
    onDone: function (fn) { document.addEventListener("se:done", function (e) { fn(e.detail); }); }
  };

  /* ---------- boot ---------- */
  function isLabHash(h) { return h === "lab" || h.indexOf("lab/") === 0; }
  buildNav(); buildBookmarks();
  var hash = (location.hash || "").replace(/^#/, "");
  // lab.js owns the #lab and #lab/<id> routes; don't render a lesson/home over them
  if (isLabHash(hash)) { /* lab.js handles it on its own boot */ }
  else if (hash && lessonIndex(hash) >= 0) go(hash); else renderHome();
  window.addEventListener("hashchange", function () {
    var h = (location.hash || "").replace(/^#/, "");
    if (isLabHash(h)) return; // lab.js handles lab routes
    if (h && h !== currentId && lessonIndex(h) >= 0) go(h);
    else if (h === "home" && currentId !== "home") renderHome();
  });
})();
