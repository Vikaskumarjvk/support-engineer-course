/* SE Academy quizzes. Keyed to exact lesson ids in content.js.
   Each question: q, opts[], a (correct index), why (explanation).
   Grounded in the lesson content. No internal terms. */
window.SE_QUIZ = {
  "course-welcome-how-a-tech-company-works": [
    { q: "In one line, what is the difference between an SDE and an SE?",
      opts: ["SDEs write docs, SEs write code", "SDEs build services, SEs keep them running and fix them", "They are the same role with different titles", "SEs manage SDEs"],
      a: 1, why: "An SDE builds new services and features. A Support Engineer watches services, answers questions about them, and fixes them when they break." },
    { q: "What does 'production' mean?",
      opts: ["A test environment for engineers", "The real system real people are using right now", "The factory where hardware is made", "A backup copy of the code"],
      a: 1, why: "Production is the live system real people depend on this second. If it breaks, real people are blocked now, which is why speed matters." },
    { q: "A service writes a line like '9:00 AM, employee 12345 clocked in.' What is that line called?",
      opts: ["A metric", "An alarm", "A log", "A ticket"],
      a: 2, why: "Logs are the service's diary: timestamped lines of what happened. Metrics are counted numbers; alarms fire when a metric looks wrong." }
  ],
  "course-first-days-access-where-to-look": [
    { q: "Why does single sign-on make you tap a hardware key every few hours?",
      opts: ["To slow you down on purpose", "So a stolen password alone cannot get someone in", "Because passwords expire hourly", "To track which sites you visit"],
      a: 1, why: "The physical key proves it is really you. Even if someone steals your password, they do not have the key in your pocket." },
    { q: "You hit 'Access Denied' on a tool you need. What is the first move?",
      opts: ["Email the whole company", "Give up and use a different tool", "Search the internal docs for the access-request link, then submit it", "Wait a day and try again"],
      a: 2, why: "Each tool gates on a named permission group. Find the request link in the docs, submit it, get approved, and you are added to the list." },
    { q: "What is the correct 'ask flow' order when you are stuck?",
      opts: ["Manager first, always", "Docs, then AI helper, then buddy, then team channel", "Post in the channel immediately", "Figure it out alone, never ask"],
      a: 1, why: "Docs to AI helper to buddy to channel. Knowing where to look in order is what makes new engineers ramp fast." }
  ],
  "course-the-developer-environment": [
    { q: "Why do most engineers use a cloud dev machine instead of their laptop?",
      opts: ["It is required by law", "Heavy builds run on the big remote machine, it auto-backs-up, and reachable anywhere", "Laptops cannot run a terminal", "It is the only place git works"],
      a: 1, why: "The cloud machine keeps your laptop cool and fast, backs up your work automatically, and you can reach it from anywhere." },
    { q: "What does `cd /workplace/my-project` do?",
      opts: ["Deletes the project", "Builds the project", "Changes your current folder into that project folder", "Copies the project to the cloud"],
      a: 2, why: "`cd` = change directory. After it, commands you type apply to files in that folder." },
    { q: "After setup, what single line tells you your environment actually works?",
      opts: ["WELCOME", "BUILD SUCCESSFUL", "READY", "ALL GREEN"],
      a: 1, why: "BUILD SUCCESSFUL is the signal your environment is healthy. It is the same signal that later tells you your code is healthy." }
  ],
  "course-how-code-lives-git-packages": [
    { q: "What is a commit?",
      opts: ["A live server", "A save-point snapshot of the code with a message, time, and author", "A type of bug", "A permission group"],
      a: 1, why: "A commit is one save-point: a snapshot plus a message saying what changed. You can return to any old commit." },
    { q: "Why do you work on a branch instead of committing straight to mainline?",
      opts: ["Branches are faster to type", "So you can try changes safely; mainline stays clean and you merge only after review", "Mainline is read-only", "Branches cost less storage"],
      a: 1, why: "A branch is a safe parallel copy. Mainline is the shared truth everyone trusts, so you only merge in after review." },
    { q: "As an SE, why does git history matter most?",
      opts: ["To count how many commits you made", "To trace which change introduced a bug", "To delete old code", "To rename files"],
      a: 1, why: "When a customer hits a bug, the commit history lets you find exactly which change caused it." }
  ],
  "course-the-build-system": [
    { q: "What are the build system's main jobs?",
      opts: ["Only compile code", "Compile, pull in dependencies, run tests, and package a deployable artifact", "Send emails", "Store passwords"],
      a: 1, why: "It compiles your code, manages the libraries it needs, runs the tests, and bundles everything into something deployable." },
    { q: "Which signal is the only one that matters before you commit?",
      opts: ["A green checkmark anywhere", "BUILD SUCCESSFUL at the end of the build", "No red text", "The build finished quickly"],
      a: 1, why: "BUILD SUCCESSFUL is the gate. A failed build blocks everything; warnings that still end in success do not matter." },
    { q: "Where do you run the build command?",
      opts: ["From the workspace root", "Inside the specific package folder", "From your home directory", "Anywhere, it does not matter"],
      a: 1, why: "Build inside the package folder, not the workspace root. Running from the root is a classic new-engineer mistake that fails." }
  ],
  "course-how-services-talk-to-each-other": [
    { q: "Which layer is the 'front door' that validates the incoming request?",
      opts: ["Accessor", "Component", "Activity", "Builder"],
      a: 2, why: "The Activity is the front door: it checks the request, logs it, and hands it to the Component. Bad input throws a ValidationException here." },
    { q: "The business logic ('should I allow this? what is the answer?') lives in which layer?",
      opts: ["Activity", "Component", "Builder", "Accessor"],
      a: 1, why: "The Component is the brain. The Builder assembles objects; the Accessor talks to the database." },
    { q: "Logs show a downstream service returned an error. Which exception type fits?",
      opts: ["ValidationException", "DependencyServiceException", "InternalServiceException", "NullException"],
      a: 1, why: "DependencyServiceException = something we depend on broke (not our fault). ValidationException = bad client input. InternalServiceException = our own bug." }
  ],
  "course-infrastructure-as-code": [
    { q: "What problem does infrastructure-as-code solve?",
      opts: ["It makes code run faster", "It replaces clicking buttons with repeatable, reviewable, version-controlled setup", "It removes the need for testing", "It encrypts your laptop"],
      a: 1, why: "Writing infra in code means you can rebuild it identically, review it, and version it, instead of clicking consoles and forgetting what you did." },
    { q: "What is a 'stack' in infrastructure-as-code?",
      opts: ["A pile of servers", "A box of related infrastructure built and torn down as one unit", "A type of error", "A queue of messages"],
      a: 1, why: "A stack groups related infrastructure (a table, a queue, a function) so you build and tear it down together." },
    { q: "As an SE, how do you fix infrastructure that is wrong?",
      opts: ["Click buttons in the console and hope", "Change the infra code, review it, and redeploy so the fix is permanent and repeatable", "File a ticket and wait forever", "Restart your laptop"],
      a: 1, why: "If infra is code, you change one line, review it, redeploy, and the fix sticks. A manual click can be undone by the next deploy." }
  ],
  "course-pipelines-deployment": [
    { q: "What is the correct order of pipeline stages?",
      opts: ["Prod, Beta, Alpha, staging", "Alpha, Beta, staging, Prod", "staging, Alpha, Prod, Beta", "Beta, Prod, Alpha, staging"],
      a: 1, why: "Alpha (your team), Beta (internal testers), staging (limited real traffic), Prod (all real customers). Each gate must pass before the next." },
    { q: "Why is rollback called the SE superpower?",
      opts: ["It deletes the bug forever", "It stops an incident fast by reverting to the last working version, before you even know the root cause", "It speeds up the build", "It writes the COE for you"],
      a: 1, why: "Rollback gets customers safe first. You undo the bad deploy now, then investigate the root cause after the bleeding stops." },
    { q: "An incident starts. What is the first question you ask?",
      opts: ["Whose fault is it?", "What changed, and which stage is it in?", "Should I write a COE?", "Can I go back to sleep?"],
      a: 1, why: "Most incidents trace to a recent change. 'What changed and which stage' narrows 'could be anything' down to a prime suspect fast." }
  ],
  "course-monitoring-alarms": [
    { q: "A customer says 'my call failed at 3pm.' Where do you look FIRST?",
      opts: ["Alarms", "Metrics", "Logs, filtered by their id and the timestamp", "The deploy history"],
      a: 2, why: "Logs are the diary. Search the customer's id around that time to see the exact request and error message." },
    { q: "What does P99 latency mean in plain words?",
      opts: ["The average request time", "The fastest 1% of requests", "The slowest 1% of requests, the unhappiest customers", "The total number of requests"],
      a: 2, why: "P99 = 99% of requests were faster, 1% were slower. Those slowest customers are the ones who call to complain, so SEs watch P99." },
    { q: "Five alarms fire at once. What helps you find the real cause?",
      opts: ["Restart everything", "The alarm-dependency map that shows which alarm is the root and which are symptoms", "Ignore them all", "Pick one at random"],
      a: 1, why: "The dependency map shows the alarm tree. The one at the bottom (no alarms under it) is the root cause; fix it and the symptoms clear." }
  ],
  "course-tickets-queues-on-call": [
    { q: "A Sev-1 lands at 2pm and a Sev-3 landed at 10am. Which do you work first?",
      opts: ["The Sev-3, it arrived first", "The Sev-1, severity beats arrival time", "Whichever is easier", "Neither, escalate both"],
      a: 1, why: "Triage means working in smart order, not first-in-first-out. A Sev-1 is a huge fire; you drop everything for it." },
    { q: "What is the golden rule when something is broken in production?",
      opts: ["Root-cause it fully before doing anything", "Mitigate first to stop the bleeding, root-cause second", "Wait for your manager", "Close the ticket and move on"],
      a: 1, why: "Mitigate first (rollback, restart, disable) to unblock customers now. Investigate the root cause after the fire is out." },
    { q: "You are stuck and the SLA clock is running. What does 'escalate' mean here?",
      opts: ["Reassign the ticket and walk away", "Bring in help while you stay the owner and coordinate", "Close it as unfixable", "Blame the other team"],
      a: 1, why: "Escalation brings help; it is not a handoff. You stay the single owner coordinating, they consult. Do it before the SLA breaches." }
  ],
  "course-code-review": [
    { q: "What is the goal for the number of revisions on your code review?",
      opts: ["As many as possible", "Land clean on the first revision by self-reviewing before you send it", "Exactly three", "Zero reviews needed"],
      a: 1, why: "Self-review first so the reviewer finds nothing. Clean-on-first-review signals you are careful; three rounds signals you rush." },
    { q: "Why do teams do code review at all? (best answer)",
      opts: ["To slow people down", "Two sets of eyes catch what one misses, and it teaches you the team's style", "To assign blame", "Because a tool forces it"],
      a: 1, why: "A second reviewer catches bugs, and every comment teaches you the codebase and conventions over time." },
    { q: "A reviewer leaves five comments. What do you do?",
      opts: ["Ignore the ones you disagree with", "Address every one, reply so they know you read it, then push a new revision", "Close the review and start over", "Argue in the comments"],
      a: 1, why: "Fix every comment and reply to each, then push the next revision. Addressing all of them is how reviews converge." }
  ],
  "course-the-detective-method-troubleshooting": [
    { q: "What is the difference between a symptom and a root cause?",
      opts: ["They are the same thing", "The symptom is what you see; the root cause is the first thing that actually broke", "The root cause is the customer's fault", "The symptom is always a code bug"],
      a: 1, why: "Symptom = 'the site is slow.' Root cause = 'a missing index makes every query scan the whole table.' Fix the root, not the symptom." },
    { q: "What is the single most powerful troubleshooting question?",
      opts: ["Who do I blame?", "What changed today?", "Can we restart it?", "Is it lunchtime?"],
      a: 1, why: "Most production issues trace to a recent change, a deploy, a config, a traffic spike. Asking 'what changed' often hands you the cause." },
    { q: "You have a hypothesis. What is the strongest way to test it?",
      opts: ["Assume it is right and fix", "Try to DISPROVE it: ask what you would see if it were wrong, then look for that", "Ask a coworker to guess", "Wait and see"],
      a: 1, why: "Trying to disprove your own guess kills bad hypotheses fast. If you cannot disprove it, it is probably right." }
  ],
  "course-writing-coes-runbooks": [
    { q: "What is a runbook?",
      opts: ["A novel about engineering", "A step-by-step fix recipe written for a tired person at 2am", "A list of employees", "A type of alarm"],
      a: 1, why: "A runbook gives the exact steps, commands, and what good-vs-bad output looks like, so the next person fixes it in minutes." },
    { q: "What makes a COE 'blameless'?",
      opts: ["No one reads it", "It blames the process or missing safeguard, never the person", "It has no root cause", "It is kept secret"],
      a: 1, why: "Say 'the pipeline lacked a test gate,' not 'Alice forgot to test.' You fix the system that let the mistake happen." },
    { q: "Which sentence follows the writing rules?",
      opts: ["Latency got way better after the fix", "Latency dropped from 800ms to 420ms after the fix", "The fix significantly improved things", "Things are much faster now"],
      a: 1, why: "Data beats adjectives. Concrete numbers ('800ms to 420ms') are strong; vague words ('way better') are weak." }
  ],
  "course-leadership-principles": [
    { q: "You restart a service and the report looks fine, so the customer closes the ticket. Did you show Insist on Highest Standards?",
      opts: ["Yes, it works now", "No, you fixed the symptom, not the root cause that will break again", "Yes, the customer is happy", "It does not relate to any principle"],
      a: 1, why: "Highest Standards means finding WHY the report was wrong and fixing that, so it does not recur. A restart is a band-aid." },
    { q: "What does STAR stand for?",
      opts: ["Start, Test, Act, Resolve", "Situation, Task, Action, Result", "Symptom, Trace, Alarm, Rollback", "Scope, Tools, Access, Review"],
      a: 1, why: "Situation, Task, Action, Result. The Action is your proof of the principle; the Result is the concrete outcome, with a number." },
    { q: "A ticket is for a service owned by another team. What does Ownership say?",
      opts: ["Close it, not your team", "Find the right owner, hand it off with full context, and check it closes; it is your problem until the customer is unblocked", "Ignore it", "Reassign and forget"],
      a: 1, why: "Ownership means it stays your problem until the customer is unblocked, even when the broken code is not yours." }
  ],
  "course-capstone-30-60-90-plan": [
    { q: "What is the SE ladder, low to high?",
      opts: ["SE1, SE2, SE3, SE4", "SE4, SE3, SE2, SE1", "Junior, Mid, Senior, Staff", "L1, L2, L3, L4"],
      a: 0, why: "SE1 (entry, follows runbooks), SE2 (handles common tickets solo), SE3 (the go-to person, debugs without the runbook), SE4 (writes runbooks, trains others)." },
    { q: "What mainly separates SE2 from SE3?",
      opts: ["Years served", "Confidence and being the go-to person others come to for help", "Typing speed", "Number of tickets closed"],
      a: 1, why: "SE3 is not about time. It is when other people come to YOU because you can debug hard problems without the runbook." },
    { q: "What does 'hero' mean in this course?",
      opts: ["The person who works the most hours", "The one who fixes roots, improves runbooks, and trains the next person", "The fastest typist", "The one who never sleeps"],
      a: 1, why: "A hero is the go-to person who fixes root causes (not symptoms), leaves runbooks better than they found them, and trains others." }
  ]
};
