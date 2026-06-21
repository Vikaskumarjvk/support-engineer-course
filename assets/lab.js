/* ============================================================
   SE Academy — hands-on coding lab. Real editor + real runtimes
   (window.SELab). Granular Java from zero, terminal drills, JS.
   Renders into #content when a lab lesson is selected.
   Self-contained; reads SELab; never touches content.js.
   ============================================================ */
(function () {
  "use strict";
  if (!window.SELab) return;
  var Lab = window.SELab;
  var $ = function (id) { return document.getElementById(id); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function lsJSON(k) { try { return JSON.parse(localStorage.getItem(k)) || {}; } catch (e) { return {}; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  var DONE_KEY = "se_academy_lab_done_v1";
  var labDone = lsJSON(DONE_KEY);

  /* ---- lab curriculum. Each lesson:
     id, track, title, lang (java|bash|js), teach (html), starter (code),
     task (string), check(output, runResult) -> bool, hint (optional) ---- */
  function out(s) { return s; }
  var LESSONS = [
    // ===== JAVA TRACK =====
    { track: "Java", id: "java-01-print", title: "1. Your first line: println", lang: "java",
      teach: "<p>Every Java program talks to you with <code>System.out.println(...)</code>. It prints whatever is in the parentheses, then moves to a new line. Text goes in double quotes.</p><p>Run the starter as-is. Then change the message and run again. This is your code, executing for real.</p>",
      starter: 'System.out.println("Hello, world");',
      task: 'Make the program print exactly:  I am learning Java',
      check: function (o) { return o.trim() === "I am learning Java"; },
      hint: 'Put the exact text inside the quotes: System.out.println("I am learning Java");' },

    { track: "Java", id: "java-02-variables", title: "2. Variables: boxes that hold values", lang: "java",
      teach: "<p>A <b>variable</b> is a named box. <code>int</code> holds a whole number. You declare it, give it a value, then use the name.</p><pre><code>int age = 30;\nSystem.out.println(age);</code></pre><p>The type (<code>int</code>) comes first, then the name, then <code>=</code> and the value.</p>",
      starter: 'int x = 5;\nSystem.out.println(x);',
      task: 'Declare an int called count set to 42, and print it. Output should be:  42',
      check: function (o) { return o.trim() === "42"; },
      hint: 'int count = 42; then System.out.println(count);' },

    { track: "Java", id: "java-03-math", title: "3. Math, and the int-division trap", lang: "java",
      teach: "<p>Java does <code>+ - * /</code> as you expect, but watch this: dividing two <code>int</code>s throws away the remainder. <code>7 / 2</code> is <b>3</b>, not 3.5. To get the decimal, one side must be a <code>double</code>: <code>7.0 / 2</code> is <b>3.5</b>.</p><p>This trap causes real bugs. Prove it to yourself.</p>",
      starter: 'System.out.println(7 / 2);\nSystem.out.println(7.0 / 2);',
      task: 'Print the result of 20 divided by 8 as a decimal (should be 2.5).',
      check: function (o) { return o.trim().split("\n").pop() === "2.5" || o.trim() === "2.5"; },
      hint: 'Make one side a double: System.out.println(20.0 / 8);' },

    { track: "Java", id: "java-04-strings", title: "4. Strings and joining with +", lang: "java",
      teach: "<p>A <code>String</code> is text. The <code>+</code> sign <b>joins</b> strings (and sticks numbers onto them). This is how you build readable output.</p><pre><code>String name = \"Sam\";\nSystem.out.println(\"Hi, \" + name);</code></pre>",
      starter: 'String name = "Sam";\nint score = 90;\nSystem.out.println(name + " scored " + score);',
      task: 'Print exactly:  Total: 15  (build it by joining the word Total: with the number 15)',
      check: function (o) { return o.trim() === "Total: 15"; },
      hint: 'System.out.println("Total: " + 15);  (the space after the colon matters)' },

    { track: "Java", id: "java-05-if", title: "5. Decisions: if / else", lang: "java",
      teach: "<p><code>if</code> runs a block only when a condition is true; <code>else</code> runs when it is false. Conditions use <code>&gt; &lt; &gt;= &lt;= == !=</code>.</p><pre><code>if (score >= 60) {\n  System.out.println(\"pass\");\n} else {\n  System.out.println(\"fail\");\n}</code></pre><p>This is the core of every troubleshooting check you will ever write.</p>",
      starter: 'int temp = 75;\nif (temp > 80) {\n  System.out.println("hot");\n} else {\n  System.out.println("ok");\n}',
      task: 'Change temp so the program prints  hot  (temp must be greater than 80).',
      check: function (o) { return o.trim() === "hot"; },
      hint: 'Set int temp = 90; (any value over 80).' },

    { track: "Java", id: "java-06-for", title: "6. Repeating work: the for loop", lang: "java",
      teach: "<p>A <code>for</code> loop repeats. Three parts: start, condition, step. This prints 1 to 5:</p><pre><code>for (int i = 1; i <= 5; i++) {\n  System.out.println(i);\n}</code></pre><p><code>i++</code> means add 1 each time. SEs use loops constantly to scan logs and lists.</p>",
      starter: 'for (int i = 1; i <= 3; i++) {\n  System.out.println(i);\n}',
      task: 'Loop and print the numbers 1 through 5, one per line.',
      check: function (o) { return o.trim() === "1\n2\n3\n4\n5"; },
      hint: 'Change the condition to i <= 5.' },

    { track: "Java", id: "java-07-loop-sum", title: "7. Loops that build a result", lang: "java",
      teach: "<p>Keep a running total in a variable, add to it inside the loop. This is the pattern behind counting errors, summing durations, tallying anything.</p><pre><code>int sum = 0;\nfor (int i = 1; i <= 4; i++) {\n  sum += i;   // sum = sum + i\n}\nSystem.out.println(sum);  // 10</code></pre>",
      starter: 'int sum = 0;\nfor (int i = 1; i <= 4; i++) {\n  sum += i;\n}\nSystem.out.println(sum);',
      task: 'Add up 1 through 10 and print the total (should be 55).',
      check: function (o) { return o.trim() === "55"; },
      hint: 'Loop i from 1 to 10: for (int i = 1; i <= 10; i++) sum += i;' },

    { track: "Java", id: "java-08-arrays", title: "8. Arrays: a list of values", lang: "java",
      teach: "<p>An <b>array</b> holds many values under one name. You read them by index, starting at <b>0</b>.</p><pre><code>int[] nums = {10, 20, 30};\nSystem.out.println(nums[0]);  // 10\nSystem.out.println(nums.length);  // 3</code></pre><p>Loop with the index to touch every element.</p>",
      starter: 'int[] nums = {10, 20, 30};\nfor (int i = 0; i < nums.length; i++) {\n  System.out.println(nums[i]);\n}',
      task: 'Sum all values in the array {5, 10, 15, 20} and print the total (should be 50).',
      check: function (o) { return o.trim().split("\n").pop() === "50" || o.trim() === "50"; },
      hint: 'int[] a={5,10,15,20}; int s=0; for(int i=0;i<a.length;i++) s+=a[i]; System.out.println(s);' },

    { track: "Java", id: "java-09-methods", title: "9. Methods: name a piece of logic", lang: "java",
      teach: "<p>A <b>method</b> is reusable logic with a name. It takes inputs (parameters) and can <code>return</code> a result. Define it, then call it.</p><pre><code>static int square(int n) {\n  return n * n;\n}\npublic static void main(String[] args) {\n  System.out.println(square(6));  // 36\n}</code></pre>",
      starter: 'static int square(int n) {\n  return n * n;\n}\npublic static void main(String[] args) {\n  System.out.println(square(6));\n}',
      task: 'Write a method add(a, b) that returns a + b, and print add(8, 9) (should be 17).',
      check: function (o) { return o.trim() === "17"; },
      hint: 'static int add(int a, int b){ return a + b; }  then call add(8, 9) inside main.' },

    { track: "Java", id: "java-10-capstone", title: "10. Capstone: classify a number", lang: "java",
      teach: "<p>Put it together: a loop, an <code>if/else</code> chain, and the modulo operator <code>%</code> (remainder). <code>n % 2 == 0</code> means n is even.</p><p>This is real SE shape: scan a list, classify each item, report.</p>",
      starter: 'for (int i = 1; i <= 5; i++) {\n  if (i % 2 == 0) {\n    System.out.println(i + " even");\n  } else {\n    System.out.println(i + " odd");\n  }\n}',
      task: 'For numbers 1 to 5, print "<n> even" or "<n> odd". Exact output:\n1 odd\n2 even\n3 odd\n4 even\n5 odd',
      check: function (o) { return o.trim() === "1 odd\n2 even\n3 odd\n4 even\n5 odd"; },
      hint: 'The starter already does it. Just run it and read the output.' },

    // ===== TERMINAL TRACK =====
    { track: "Terminal", id: "bash-01-echo", title: "1. echo and pwd", lang: "bash",
      teach: "<p>The terminal runs one command per line. <code>echo</code> prints text. <code>pwd</code> shows which folder you are in. Type a command and press Run (or Enter).</p>",
      starter: 'echo hello from the terminal',
      task: 'Use echo to print:  support engineer',
      check: function (o) { return o.trim() === "support engineer"; },
      hint: 'echo support engineer' },

    { track: "Terminal", id: "bash-02-ls-cat", title: "2. Looking around: ls and cat", lang: "bash",
      teach: "<p><code>ls</code> lists files in the current folder. <code>cat &lt;file&gt;</code> prints a file's contents. There is already a file called <code>readme.txt</code> here.</p>",
      starter: 'ls',
      task: 'Print the contents of readme.txt using cat.',
      check: function (o) { return o.indexOf("welcome to the lab") >= 0; },
      hint: 'cat readme.txt' },

    { track: "Terminal", id: "bash-03-pipe-grep", title: "3. Pipes and grep (the SE workhorse)", lang: "bash",
      teach: "<p>A <b>pipe</b> <code>|</code> feeds one command's output into the next. <code>grep &lt;word&gt;</code> keeps only lines containing that word. This is exactly how you search logs.</p><pre><code>cat readme.txt | grep welcome</code></pre>",
      starter: 'cat readme.txt | grep welcome',
      task: 'Pipe the readme into grep and keep only lines containing the word  lab',
      check: function (o) { return o.indexOf("lab") >= 0 && o.trim().length > 0; },
      hint: 'cat readme.txt | grep lab' },

    { track: "Terminal", id: "bash-04-redirect", title: "4. Writing files with >", lang: "bash",
      teach: "<p><code>&gt;</code> sends output into a file (overwriting it). <code>&gt;&gt;</code> appends. Then you can <code>cat</code> it back. Try writing a note and reading it.</p><pre><code>echo first line > notes.txt\necho second line >> notes.txt\ncat notes.txt</code></pre><p>Run those three lines (the editor runs each line in order).</p>",
      starter: 'echo first line > notes.txt\necho second line >> notes.txt\ncat notes.txt',
      task: 'End with a cat that prints a file containing two lines you wrote.',
      check: function (o) { return o.trim().split("\n").length >= 2; },
      hint: 'The starter does it. Run it and read the two lines back.' },

    { track: "Terminal", id: "bash-05-wc", title: "5. Counting with wc -l", lang: "bash",
      teach: "<p><code>wc -l</code> counts lines. Combined with grep, you answer questions like 'how many errors in this log?' in one line.</p><pre><code>cat log.txt | grep ERROR | wc -l</code></pre>",
      starter: 'echo one > f.txt\necho two >> f.txt\necho three >> f.txt\ncat f.txt | wc -l',
      task: 'Count the lines in a file you create. The final number should be 3.',
      check: function (o) { return o.trim().split("\n").pop() === "3"; },
      hint: 'Write three lines into a file, then  cat f.txt | wc -l' },

    // ===== JS TRACK =====
    { track: "JavaScript", id: "js-01-log", title: "1. console.log", lang: "js",
      teach: "<p>JavaScript is the language this very website runs on. <code>console.log(...)</code> prints. This runtime runs your real JS.</p>",
      starter: 'console.log("hello js");',
      task: 'Print exactly:  scripting works',
      check: function (o) { return o.trim() === "scripting works"; },
      hint: 'console.log("scripting works");' },

    { track: "JavaScript", id: "js-02-loop", title: "2. A loop and an array", lang: "js",
      teach: "<p>SEs script in JS and Python to automate. Here is a loop plus an array method:</p><pre><code>let nums = [1, 2, 3];\nlet doubled = nums.map(n => n * 2);\nconsole.log(doubled);</code></pre>",
      starter: 'let nums = [1, 2, 3, 4];\nlet total = 0;\nfor (const n of nums) total += n;\nconsole.log(total);',
      task: 'Sum the array [10, 20, 30] and print 60.',
      check: function (o) { return o.trim() === "60"; },
      hint: 'let a=[10,20,30]; let t=0; for(const n of a) t+=n; console.log(t);' }
  ];

  var TRACKS = ["Java", "Terminal", "JavaScript"];
  var BYID = {}; LESSONS.forEach(function (l) { BYID[l.id] = l; });
  window.SELabLessons = LESSONS;

  function langLabel(l) { return l === "java" ? "Java" : l === "bash" ? "Terminal" : "JavaScript"; }
  function run(lang, code, bashState) {
    if (lang === "java") return Lab.runJava(code);
    if (lang === "js") return Lab.runJS(code);
    // bash: run each line in sequence on a shared state, collect outputs
    var st = bashState || { cwd: "/home/you", fs: { "/home/you": { type: "dir" }, "/home/you/readme.txt": { type: "file", content: "welcome to the lab\n" } } };
    var lines = code.split("\n").map(function (x) { return x.trim(); }).filter(Boolean);
    var acc = [];
    for (var i = 0; i < lines.length; i++) {
      if (lines[i] === "clear") { acc = []; continue; }
      var r = Lab.runBash(lines[i], st);
      if (r.clear) { acc = []; continue; }
      if (r.output) acc.push(r.output.replace(/\n$/, ""));
    }
    return { ok: true, output: acc.join("\n"), state: st };
  }

  /* ---- render the lab home (list of tracks) ---- */
  function renderHome(content) {
    var doneCount = LESSONS.filter(function (l) { return labDone[l.id]; }).length;
    var html = '<div class="lab-home"><div class="hero-bg" style="margin:-44px -32px 0;padding:48px 32px 6px">' +
      '<div class="hero-badge"><span class="pulse"></span> Hands-on · real code · runs in your browser</div>' +
      '<h1 style="font-size:clamp(28px,5vw,40px);font-weight:800;letter-spacing:-.02em;margin:0 0 12px;color:var(--heading)">The Coding Lab</h1>' +
      '<p class="hero-lede">Write real Java, shell, and JavaScript with your own hands. Hit Run and it actually executes, no setup, no fakes. ' + doneCount + ' / ' + LESSONS.length + ' exercises done.</p></div>';
    TRACKS.forEach(function (tr) {
      var items = LESSONS.filter(function (l) { return l.track === tr; });
      html += '<h2 style="border-bottom:1px solid var(--line);padding-bottom:8px;margin:32px 0 14px">' + esc(tr) + ' <span style="font-size:13px;color:var(--txt-faint);font-weight:500">' + items.length + ' exercises</span></h2><div class="lab-grid">';
      items.forEach(function (l) {
        html += '<button class="lab-card' + (labDone[l.id] ? " done" : "") + '" data-lab="' + l.id + '"><span class="lab-check">&#10003;</span><span class="lab-card-title">' + esc(l.title) + '</span></button>';
      });
      html += '</div>';
    });
    html += '</div>';
    content.innerHTML = html;
    content.querySelectorAll("[data-lab]").forEach(function (b) { b.addEventListener("click", function () { location.hash = "lab/" + b.getAttribute("data-lab"); }); });
  }

  /* ---- render a single exercise with editor ---- */
  function renderLesson(content, id) {
    var l = BYID[id]; if (!l) { renderHome(content); return; }
    var idx = LESSONS.indexOf(l);
    var prev = idx > 0 ? LESSONS[idx - 1] : null, next = idx < LESSONS.length - 1 ? LESSONS[idx + 1] : null;
    content.innerHTML =
      '<div class="lab-lesson">' +
      '<div class="lab-bc"><a data-go-lab-home href="#lab">Lab</a> <span class="sec">/</span> ' + esc(l.track) + '</div>' +
      '<h1>' + esc(l.title) + '</h1>' +
      '<div class="lab-teach">' + l.teach + '</div>' +
      '<div class="lab-task"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 2"/></svg><div><b>Your task.</b> ' + esc(l.task).replace(/\n/g, "<br>") + '</div></div>' +
      '<div class="editor-wrap">' +
        '<div class="editor-top"><span class="lang-tag">' + langLabel(l.lang) + '</span>' +
          '<button class="ed-btn ghost" id="lab-reset" type="button">reset</button>' +
          '<button class="ed-btn ghost" id="lab-hint" type="button">hint</button>' +
          '<button class="ed-btn run" id="lab-run" type="button"><svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Run</button>' +
        '</div>' +
        '<textarea id="lab-editor" spellcheck="false" autocapitalize="off" autocomplete="off"></textarea>' +
      '</div>' +
      '<div class="lab-out-head">Output</div>' +
      '<pre class="lab-output" id="lab-output"><span class="muted">press Run to execute your code</span></pre>' +
      '<div class="lab-verdict" id="lab-verdict" hidden></div>' +
      '<div class="lab-hint" id="lab-hint-box" hidden></div>' +
      '<div class="lab-pager">' +
        (prev ? '<button class="pager-card prev" data-go-lab="' + prev.id + '"><span class="pc-dir">← Previous</span><span class="pc-title">' + esc(prev.title) + '</span></button>' : '<span></span>') +
        (next ? '<button class="pager-card next" data-go-lab="' + next.id + '"><span class="pc-dir">Next →</span><span class="pc-title">' + esc(next.title) + '</span></button>' : '<span></span>') +
      '</div>' +
      '</div>';

    var ed = $("lab-editor");
    ed.value = l.starter;
    autoSize(ed);
    ed.addEventListener("input", function () { autoSize(ed); });
    // Tab inserts two spaces
    ed.addEventListener("keydown", function (e) {
      if (e.key === "Tab") { e.preventDefault(); var s = ed.selectionStart, en = ed.selectionEnd; ed.value = ed.value.slice(0, s) + "  " + ed.value.slice(en); ed.selectionStart = ed.selectionEnd = s + 2; }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") { e.preventDefault(); doRun(); }
    });
    function autoSize(t) { t.style.height = "auto"; t.style.height = Math.max(120, t.scrollHeight + 4) + "px"; }

    function doRun() {
      var code = ed.value;
      var res = run(l.lang, code);
      var outEl = $("lab-output"), verdict = $("lab-verdict");
      if (!res.ok && res.error) {
        outEl.innerHTML = '<span class="err">' + esc(res.output ? res.output + "\n" : "") + (l.lang === "java" ? "error: " : "") + esc(res.error) + '</span>';
      } else {
        outEl.textContent = res.output === "" ? "(no output)" : res.output;
      }
      var passed = false;
      try { passed = !!l.check(res.output || "", res); } catch (e) { passed = false; }
      verdict.hidden = false;
      if (passed) {
        verdict.className = "lab-verdict pass";
        verdict.innerHTML = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Correct! Exercise complete.';
        if (!labDone[l.id]) {
          labDone[l.id] = true; lsSet(DONE_KEY, labDone);
          try { document.dispatchEvent(new CustomEvent("se:lab-done", { detail: { id: l.id } })); } catch (e) {}
        }
        if (window.SEApp && window.SEApp.fx) { var r = $("lab-run").getBoundingClientRect(); window.SEApp.fx.burst(r.left + r.width / 2, r.top); }
      } else {
        verdict.className = "lab-verdict tryagain";
        verdict.innerHTML = "Not matching the goal yet. Check the task above, tweak your code, and Run again.";
      }
    }
    $("lab-run").addEventListener("click", doRun);
    $("lab-reset").addEventListener("click", function () { ed.value = l.starter; autoSize(ed); $("lab-output").innerHTML = '<span class="muted">press Run to execute your code</span>'; $("lab-verdict").hidden = true; });
    $("lab-hint").addEventListener("click", function () { var h = $("lab-hint-box"); h.hidden = !h.hidden; h.textContent = "Hint: " + (l.hint || "Re-read the task and the example above."); });
    content.querySelectorAll("[data-go-lab]").forEach(function (b) { b.addEventListener("click", function () { location.hash = "lab/" + b.getAttribute("data-go-lab"); }); });
    content.querySelectorAll("[data-go-lab-home]").forEach(function (b) { b.addEventListener("click", function (e) { e.preventDefault(); location.hash = "lab"; }); });
  }

  /* ---- routing: intercept #lab and #lab/<id> ---- */
  function handleHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (h !== "lab" && h.indexOf("lab/") !== 0) return false;
    var content = document.getElementById("content");
    var crumb = document.getElementById("crumb");
    var pager = document.getElementById("pager");
    var toc = document.getElementById("toc");
    if (pager) pager.innerHTML = "";
    if (toc) toc.classList.add("empty");
    if (h === "lab") { if (crumb) crumb.innerHTML = "<b>Coding Lab</b>"; renderHome(content); document.title = "Coding Lab — SE Academy"; }
    else { var id = h.slice(4); var l = BYID[id]; if (crumb) crumb.innerHTML = "<span class='sec'>Lab</span> &nbsp;/&nbsp; <b>" + esc(l ? l.title : "") + "</b>"; renderLesson(content, id); document.title = (l ? l.title : "Lab") + " — SE Academy"; }
    var sc = document.getElementById("scroller"); if (sc) sc.scrollTop = 0;
    // de-highlight reading nav
    document.querySelectorAll("#nav .nav-item.active").forEach(function (n) { n.classList.remove("active"); });
    return true;
  }
  window.addEventListener("hashchange", function () { handleHash(); });

  /* ---- add a "Lab" entry-point button in the sidebar top ---- */
  function addLabButton() {
    var side = document.querySelector(".side-top"); if (!side || document.getElementById("lab-launch")) return;
    var b = document.createElement("button");
    b.id = "lab-launch"; b.type = "button"; b.className = "lab-launch";
    b.innerHTML = '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg> <span>Open the Coding Lab</span>';
    b.addEventListener("click", function () { location.hash = "lab"; if (window.innerWidth <= 820) { document.getElementById("sidebar").classList.remove("open"); document.getElementById("scrim").classList.remove("show"); } });
    side.appendChild(b);
  }

  addLabButton();
  // if page loaded directly on a lab hash, render it now
  if (!handleHash()) { /* not a lab route; reading app handles it */ }
})();
