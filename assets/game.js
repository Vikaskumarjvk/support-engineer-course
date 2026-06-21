/* ============================================================
   SE Academy — gamification layer. Loads after app.js + quiz.js.
   XP/levels mapped to the SE ladder, streaks, badges, quizzes,
   progress dashboard. Talks to core via window.SEApp + events.
   Never mutates content.js. Self-contained.
   ============================================================ */
(function () {
  "use strict";
  if (!window.SEApp) return;
  var App = window.SEApp, QUIZ = window.SE_QUIZ || {};
  var $ = function (id) { return document.getElementById(id); };
  function ls(k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  function lsJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function todayKey() {
    // local date as YYYY-MM-DD without relying on locale
    var d = new Date(); var m = ("0" + (d.getMonth() + 1)).slice(-2); var day = ("0" + d.getDate()).slice(-2);
    return d.getFullYear() + "-" + m + "-" + day;
  }
  function daysBetween(a, b) {
    var pa = a.split("-").map(Number), pb = b.split("-").map(Number);
    var ta = Date.UTC(pa[0], pa[1] - 1, pa[2]), tb = Date.UTC(pb[0], pb[1] - 1, pb[2]);
    return Math.round((tb - ta) / 86400000);
  }

  var K = {
    xp: "se_academy_xp_v1",
    quiz: "se_academy_quiz_v1",       // {lessonId: {best: n, total: n}}
    streak: "se_academy_streak_v1",   // {last: date, count: n, longest: n}
    badges: "se_academy_badges_v1",   // {badgeId: dateAwarded}
    visited: "se_academy_visited_v1"  // {lessonId: true} for "read" xp
  };
  var XP = parseInt(ls(K.xp, "0"), 10) || 0;
  var quizState = lsJSON(K.quiz);
  var streak = lsJSON(K.streak);
  var badges = lsJSON(K.badges);
  var visited = lsJSON(K.visited);

  var XP_READ = 10, XP_DONE = 20, XP_QUIZ_EACH = 15, XP_PERFECT_BONUS = 20;

  /* ---- SE ladder levels (real ladder, gamified thresholds) ---- */
  var LEVELS = [
    { name: "SE1 · Trainee", sub: "follows runbooks", at: 0 },
    { name: "SE1 · Responder", sub: "handles small tickets", at: 80 },
    { name: "SE2 · Operator", sub: "common tickets solo", at: 200 },
    { name: "SE2 · Investigator", sub: "writes RCAs", at: 360 },
    { name: "SE3 · Go-to", sub: "debugs without the runbook", at: 560 },
    { name: "SE3 · Owner", sub: "owns operational health", at: 800 },
    { name: "SE4 · Mentor", sub: "writes runbooks, trains others", at: 1080 }
  ];
  function levelFor(xp) {
    var lvl = LEVELS[0], idx = 0;
    for (var i = 0; i < LEVELS.length; i++) if (xp >= LEVELS[i].at) { lvl = LEVELS[i]; idx = i; }
    var next = LEVELS[idx + 1] || null;
    var floor = lvl.at, ceil = next ? next.at : lvl.at;
    var pct = next ? Math.round((xp - floor) / (ceil - floor) * 100) : 100;
    return { lvl: lvl, idx: idx, next: next, pct: pct, into: xp - floor, span: next ? ceil - floor : 0 };
  }

  var BADGES = [
    { id: "first-step", icon: "🚀", name: "First Step", desc: "Open your first lesson" },
    { id: "first-done", icon: "✅", name: "Getting Started", desc: "Mark your first lesson done" },
    { id: "quiz-ace", icon: "🎯", name: "Sharpshooter", desc: "Score 100% on a quiz" },
    { id: "five-quiz", icon: "🧠", name: "Quiz Brain", desc: "Pass 5 quizzes" },
    { id: "course-half", icon: "📖", name: "Halfway", desc: "Finish half the course" },
    { id: "course-done", icon: "🎓", name: "Course Complete", desc: "Finish all 15 course modules" },
    { id: "drills-done", icon: "💪", name: "Drilled", desc: "Finish all 9 drill banks" },
    { id: "streak-3", icon: "🔥", name: "On a Roll", desc: "3-day learning streak" },
    { id: "streak-7", icon: "⚡", name: "Unstoppable", desc: "7-day learning streak" },
    { id: "se3", icon: "🏅", name: "Reached SE3", desc: "Hit the SE3 level" },
    { id: "platinum", icon: "👑", name: "Hero", desc: "100% lessons + every quiz aced" }
  ];

  function save() { lsSet(K.xp, XP); lsSet(K.quiz, JSON.stringify(quizState)); lsSet(K.streak, JSON.stringify(streak)); lsSet(K.badges, JSON.stringify(badges)); lsSet(K.visited, JSON.stringify(visited)); }
  function addXP(n) { var before = levelFor(XP).idx; XP += n; var after = levelFor(XP); save(); updateHud(); if (after.idx > before) onLevelUp(after); }
  function onLevelUp(after) {
    App.toast("Level up · " + after.lvl.name);
    var c = window.innerWidth / 2; App.fx.burst(c, window.innerHeight * 0.4);
    if (after.lvl.name.indexOf("SE3") === 0) award("se3");
    refreshDashboard();
  }
  function award(id) {
    if (badges[id]) return false;
    badges[id] = todayKey(); save();
    var b = BADGES.filter(function (x) { return x.id === id; })[0];
    if (b) App.toast(b.icon + " Badge: " + b.name);
    refreshDashboard(); return true;
  }
  function passedQuizCount() { return Object.keys(quizState).filter(function (k) { var q = quizState[k]; return q && q.best >= Math.ceil(q.total * 0.67); }).length; }
  function acedQuizCount() { return Object.keys(quizState).filter(function (k) { var q = quizState[k]; return q && q.total && q.best === q.total; }).length; }

  function checkBadges() {
    var p = App.progress(), L = App.lessons;
    var courseDone = L.filter(function (l) { return l.section === "Course" && p[l.id]; }).length;
    var courseTotal = L.filter(function (l) { return l.section === "Course"; }).length;
    var drillsDone = L.filter(function (l) { return l.section === "Training" && p[l.id]; }).length;
    var drillsTotal = L.filter(function (l) { return l.section === "Training"; }).length;
    var allDone = L.filter(function (l) { return p[l.id]; }).length === L.length && L.length;
    if (courseDone >= 1 || drillsDone >= 1) award("first-done");
    if (courseTotal && courseDone >= Math.ceil(courseTotal / 2)) award("course-half");
    if (courseTotal && courseDone === courseTotal) award("course-done");
    if (drillsTotal && drillsDone === drillsTotal) award("drills-done");
    if (passedQuizCount() >= 5) award("five-quiz");
    if (allDone && acedQuizCount() === Object.keys(QUIZ).length) award("platinum");
    if (levelFor(XP).lvl.name.indexOf("SE3") === 0 || levelFor(XP).lvl.name.indexOf("SE4") === 0) award("se3");
  }

  /* ---- streak ---- */
  function touchStreak() {
    var t = todayKey();
    if (!streak.last) { streak = { last: t, count: 1, longest: 1 }; }
    else if (streak.last === t) { /* already counted today */ }
    else {
      var gap = daysBetween(streak.last, t);
      if (gap === 1) streak.count += 1; else if (gap > 1) streak.count = 1;
      streak.last = t; streak.longest = Math.max(streak.longest || 0, streak.count);
    }
    save();
    if (streak.count >= 3) award("streak-3");
    if (streak.count >= 7) award("streak-7");
  }

  /* ---- HUD pill in topbar ---- */
  function buildHud() {
    var bar = $("topbar"); if (!bar || $("hud")) return;
    var hud = document.createElement("button");
    hud.id = "hud"; hud.type = "button"; hud.title = "Open your progress dashboard";
    hud.innerHTML = '<span class="hud-ring"><svg viewBox="0 0 36 36" width="26" height="26"><circle class="hr-bg" cx="18" cy="18" r="15.5" fill="none" stroke-width="3.4"/><circle id="hud-ring-fill" cx="18" cy="18" r="15.5" fill="none" stroke-width="3.4" stroke-linecap="round" transform="rotate(-90 18 18)"/></svg><b id="hud-lvl">1</b></span><span class="hud-meta"><span id="hud-name">SE1</span><span id="hud-xp">0 XP</span></span><span id="hud-streak" class="hud-streak">🔥 0</span>';
    hud.addEventListener("click", openDashboard);
    // insert right after crumb (before the icon buttons)
    var crumb = $("crumb");
    bar.insertBefore(hud, crumb.nextSibling);
    updateHud();
  }
  function updateHud() {
    var info = levelFor(XP);
    if ($("hud-lvl")) $("hud-lvl").textContent = info.idx + 1;
    if ($("hud-name")) $("hud-name").textContent = info.lvl.name.split(" ")[0];
    if ($("hud-xp")) $("hud-xp").textContent = XP + " XP";
    if ($("hud-streak")) $("hud-streak").textContent = "🔥 " + (streak.count || 0);
    var rf = $("hud-ring-fill"); if (rf) { var c = 97.4; rf.style.strokeDasharray = c; rf.style.strokeDashoffset = (c * (1 - info.pct / 100)).toFixed(1); }
  }

  /* ---- sidebar dashboard tab ---- */
  function addDashTab() {
    var tabs = document.querySelector(".side-tabs"); if (!tabs || $("tab-dash")) return;
    var b = document.createElement("button");
    b.id = "tab-dash"; b.type = "button"; b.className = "side-tab"; b.dataset.stab = "dash"; b.textContent = "Stats";
    tabs.appendChild(b);
    var dash = document.createElement("div"); dash.id = "dash-view"; dash.hidden = true;
    document.getElementById("nav").parentNode.insertBefore(dash, document.getElementById("sidebar").querySelector(".sidebar-foot"));
    // wire tab switching (cooperate with app.js's existing handler)
    document.querySelectorAll(".side-tab").forEach(function (t) {
      t.addEventListener("click", function () {
        var isDash = t.dataset.stab === "dash";
        document.querySelectorAll(".side-tab").forEach(function (x) { x.classList.toggle("active", x === t); });
        $("nav").hidden = (t.dataset.stab !== "lessons");
        $("bookmarks-view").hidden = (t.dataset.stab !== "bookmarks");
        dash.hidden = !isDash;
        if (isDash) renderDashboard(dash);
      });
    });
  }
  function openDashboard() {
    var tab = $("tab-dash"); if (tab) tab.click();
    if (window.innerWidth <= 820) { $("sidebar").classList.add("open"); $("scrim").classList.add("show"); }
  }
  function refreshDashboard() { var d = $("dash-view"); if (d && !d.hidden) renderDashboard(d); }
  function renderDashboard(dash) {
    var info = levelFor(XP), p = App.progress(), L = App.lessons;
    var done = L.filter(function (l) { return p[l.id]; }).length;
    var courseDone = L.filter(function (l) { return l.section === "Course" && p[l.id]; }).length;
    var courseTot = L.filter(function (l) { return l.section === "Course"; }).length;
    var drillDone = L.filter(function (l) { return l.section === "Training" && p[l.id]; }).length;
    var drillTot = L.filter(function (l) { return l.section === "Training"; }).length;
    var quizzesPassed = passedQuizCount(), quizzesAced = acedQuizCount(), quizTotal = Object.keys(QUIZ).length;
    var ring = 97.4;
    var badgeHtml = BADGES.map(function (b) {
      var got = !!badges[b.id];
      return '<div class="badge' + (got ? " got" : "") + '" title="' + escapeHtml(b.desc) + '"><span class="b-ic">' + b.icon + '</span><span class="b-name">' + escapeHtml(b.name) + '</span></div>';
    }).join("");
    dash.innerHTML =
      '<div class="dash">' +
      '<div class="dash-level">' +
        '<svg class="dl-ring" viewBox="0 0 36 36" width="64" height="64"><circle class="hr-bg" cx="18" cy="18" r="15.5" fill="none" stroke-width="3"/><circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" stroke-linecap="round" transform="rotate(-90 18 18)" stroke="var(--accent)" style="stroke-dasharray:' + ring + ';stroke-dashoffset:' + (ring * (1 - info.pct / 100)).toFixed(1) + '"/><text x="18" y="22" text-anchor="middle" font-size="13" font-weight="800" fill="var(--heading)">' + (info.idx + 1) + '</text></svg>' +
        '<div class="dl-text"><div class="dl-name">' + escapeHtml(info.lvl.name) + '</div><div class="dl-sub">' + escapeHtml(info.lvl.sub) + '</div>' +
          '<div class="dl-xp">' + XP + ' XP' + (info.next ? ' · ' + (info.span - info.into) + ' to ' + info.next.name.split(" · ")[1] : ' · max level') + '</div></div>' +
      '</div>' +
      '<div class="dash-stats">' +
        statCard("🔥", streak.count || 0, "day streak") +
        statCard("📚", done + "/" + L.length, "lessons done") +
        statCard("🎯", quizzesAced + "/" + quizTotal, "quizzes aced") +
        statCard("🏆", Object.keys(badges).length + "/" + BADGES.length, "badges") +
      '</div>' +
      '<div class="dash-bars">' +
        progBar("Course", courseDone, courseTot) +
        progBar("Drills", drillDone, drillTot) +
        progBar("Quizzes passed", quizzesPassed, quizTotal) +
      '</div>' +
      '<div class="dash-badges-title">Badges</div>' +
      '<div class="dash-badges">' + badgeHtml + '</div>' +
      '</div>';
  }
  function statCard(ic, val, lbl) { return '<div class="dstat"><div class="ds-ic">' + ic + '</div><div class="ds-val">' + val + '</div><div class="ds-lbl">' + lbl + '</div></div>'; }
  function progBar(label, done, tot) {
    var pct = tot ? Math.round(done / tot * 100) : 0;
    return '<div class="dbar"><div class="dbar-top"><span>' + label + '</span><span>' + done + '/' + tot + '</span></div><div class="dbar-track"><div class="dbar-fill" style="width:' + pct + '%"></div></div></div>';
  }

  /* ---- quiz injection on each course lesson ---- */
  function injectQuiz(id) {
    var qs = QUIZ[id]; if (!qs || !qs.length) return;
    var content = App.content;
    if (content.querySelector(".quizbox")) return;
    var box = document.createElement("section");
    box.className = "quizbox reveal in";
    var st = quizState[id] || { best: 0, total: qs.length };
    var bestLine = st.best ? '<span class="quiz-best">best: ' + st.best + '/' + qs.length + (st.best === qs.length ? ' 🎯' : '') + '</span>' : '';
    var qHtml = qs.map(function (q, qi) {
      return '<div class="quiz-q" data-qi="' + qi + '" data-a="' + q.a + '">' +
        '<div class="quiz-stem"><span class="quiz-n">' + (qi + 1) + '</span>' + escapeHtml(q.q) + '</div>' +
        '<div class="quiz-opts">' + q.opts.map(function (o, oi) { return '<button class="quiz-opt" type="button" data-oi="' + oi + '">' + escapeHtml(o) + '</button>'; }).join("") + '</div>' +
        '<div class="quiz-why" hidden></div></div>';
    }).join("");
    box.innerHTML =
      '<div class="quiz-head"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg><h2>Check your understanding</h2>' + bestLine + '</div>' +
      '<p class="quiz-intro">' + qs.length + ' quick questions. Each correct answer earns XP. Get them all right for a bonus.</p>' +
      qHtml +
      '<div class="quiz-result" hidden></div>';
    content.appendChild(box);
    wireQuiz(box, id, qs);
  }
  function wireQuiz(box, id, qs) {
    var answered = {};
    box.querySelectorAll(".quiz-q").forEach(function (qEl) {
      var qi = +qEl.dataset.qi, correct = +qEl.dataset.a;
      qEl.querySelectorAll(".quiz-opt").forEach(function (btn) {
        btn.addEventListener("click", function () {
          if (answered[qi]) return;
          answered[qi] = true;
          var oi = +btn.dataset.oi, right = oi === correct;
          qEl.querySelectorAll(".quiz-opt").forEach(function (b, bi) {
            b.disabled = true;
            if (bi === correct) b.classList.add("correct");
            else if (bi === oi) b.classList.add("wrong");
          });
          var why = qEl.querySelector(".quiz-why");
          why.innerHTML = (right ? '<b class="ok">Correct.</b> ' : '<b class="no">Not quite.</b> ') + escapeHtml(qs[qi].why);
          why.hidden = false;
          if (right) { var r = btn.getBoundingClientRect(); App.fx.burst(r.left + r.width / 2, r.top); }
          if (Object.keys(answered).length === qs.length) finishQuiz(box, id, qs, answered);
        });
      });
    });
  }
  function finishQuiz(box, id, qs, answered) {
    // a question is correct when no option in it was marked .wrong (the user clicked the right one)
    var score = 0;
    box.querySelectorAll(".quiz-q").forEach(function (qEl) {
      if (!qEl.querySelector(".quiz-opt.wrong")) score++;
    });
    var prev = quizState[id] || { best: 0, total: qs.length };
    var gainedXP = 0;
    if (!prev.counted) {
      gainedXP = score * XP_QUIZ_EACH;
      if (score === qs.length) { gainedXP += XP_PERFECT_BONUS; award("quiz-ace"); }
      prev.counted = true;
    }
    prev.best = Math.max(prev.best || 0, score); prev.total = qs.length;
    quizState[id] = prev; save();
    if (gainedXP) addXP(gainedXP);
    checkBadges(); updateHud();
    var res = box.querySelector(".quiz-result");
    res.hidden = false;
    res.className = "quiz-result " + (score === qs.length ? "perfect" : score >= Math.ceil(qs.length * 0.67) ? "pass" : "retry");
    res.innerHTML = '<b>' + score + ' / ' + qs.length + '</b> ' +
      (score === qs.length ? "Perfect. +" + (gainedXP || 0) + " XP 🎯" : score >= Math.ceil(qs.length * 0.67) ? "Solid. " + (gainedXP ? "+" + gainedXP + " XP" : "") : "Re-read the section above and try the ideas again.") +
      (score === qs.length ? "" : ' <button class="quiz-retry" type="button">Try again</button>');
    var retry = res.querySelector(".quiz-retry");
    if (retry) retry.addEventListener("click", function () { var nq = QUIZ[id]; var content = App.content; var old = content.querySelector(".quizbox"); if (old) old.remove(); injectQuiz(id); var b = content.querySelector(".quizbox"); if (b) b.scrollIntoView({ behavior: "smooth", block: "start" }); });
  }

  /* ---- wire events ---- */
  App.onContent(function (d) {
    touchStreak();
    if (!visited[d.id]) { visited[d.id] = true; save(); addXP(XP_READ); award("first-step"); }
    injectQuiz(d.id);
    updateHud();
  });
  App.onDone(function (d) {
    if (d.done) { addXP(XP_DONE); }
    checkBadges();
  });

  /* ---- boot ---- */
  buildHud(); addDashTab(); updateHud();
  // app.js fired its initial se:render synchronously before our listener
  // attached, so handle the already-showing lesson once, now.
  (function initialLesson() {
    var id = App.current();
    if (id && id !== "home") {
      touchStreak();
      if (!visited[id]) { visited[id] = true; save(); addXP(XP_READ); award("first-step"); }
      injectQuiz(id);
      updateHud();
    }
  })();
})();
