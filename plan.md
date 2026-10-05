# Implementation Plan

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved specification into an ordered, trackable build and verification plan.

## Instructions for the Developer

Set priorities, review the checklist, verify results rather than relying only on the Agent's report, and keep the project documents current as the work changes. Expect the build to take many rounds of testing and fixing; record material changes under Revisions.

To begin planning, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me create the Project 3 implementation plan.`

After approving the plan, open the project repository in a fresh chat and enter:

`Read ./plan.md and help me implement the approved Project 3 plan in working checkpoints.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, `spec.md`, and this file, then inspect the relevant project files. Propose concrete tasks and checks without expanding the approved scope.

During implementation, follow the approved plan in working checkpoints and keep it current. Never mark approvals or items requiring Developer verification complete on the Developer's behalf.

## Approach

**Structure:** Plain HTML/CSS/JS, no build step. A single `index.html` with JS-managed views (Home/Today, Trips, Info/Settings) rather than separate reloading pages, so the shared recommendation state and localStorage don't need to be re-synced across page loads. Proposed file layout:

```
index.html
styles.css
js/
  weather.js       — api.weather.gov fetch + parsing
  geocode.js       — Nominatim search + reverse geocode
  recommendation.js — temperature bands, reminder rules, variation assignment
  storage.js       — localStorage read/write (home location, trips, settings, variation state)
  render.js        — DOM rendering for each view
  main.js          — wiring/event handlers, view switching
assets/
  character/        — base dolls, outfit layers, rain modifier (per gender)
  icons/             — weather + reminder icons
```

**Data flow:** location + date → `geocode.js` (if manual entry) → `weather.js` fetches the matching NWS forecast period → `recommendation.js` computes the temperature band and reminder triggers, assigning (or reading persisted) variations → `storage.js` persists the resulting state keyed by location+date (or trip+day) → `render.js` draws the character, icons, written recommendation, and reminders from that one state object (per spec.md's Recommendation state section).

**Dependencies:** api.weather.gov, Nominatim (OpenStreetMap), browser Geolocation API, localStorage. No external JS framework or package manager.

**Main risks:**
- Nominatim's usage policy requires an identifiable requester; browsers can't override the `User-Agent` header from JS, but the automatically-sent `Referer` (the deployed page's URL) satisfies this for direct client-side use — document this on the Info screen rather than working around it.
- api.weather.gov requires a two-step lookup (points → forecast endpoint) before returning forecast data; build this into `weather.js` as one function so callers only deal with "get forecast for these coordinates."
- Asset creation (character, outfit layers, icons) is the most time-consuming non-coding task and the one most likely to slip; start it in parallel with early build tasks rather than after.
- Keeping one recommendation state authoritative is easy to violate once Trips and Home both need it — centralize the logic in `recommendation.js` and have both views call the same functions rather than duplicating rules.

## Checklist

### Approvals

- [x] Research approved
- [x] Specification approved
- [x] Plan approved (Developer, 2026-10-05)

### Build

- [ ] Scaffold the file structure above; confirm GitHub Pages can serve `index.html` from the repo root
- [ ] Start asset creation (character dolls ×2 genders, 30 outfit variations, rain modifier, weather/reminder icons) — begin now, in parallel with the tasks below
- [ ] Build `geocode.js`: Nominatim search (manual entry) and reverse geocode (device location), with clear errors for invalid/non-US input
- [ ] Build `weather.js`: coordinates → NWS points lookup → forecast fetch, returning per-day temp, PoP, sky cover, heat index
- [ ] Build `storage.js`: localStorage schema for the most-recent Home location, saved trips, per-date/day recommendation state, and settings (gender, auto-delete-past-trips)
- [ ] Build `recommendation.js`: temperature-band rules, rain/sunscreen/hydration triggers (R10–R12), and variation assignment/persistence (R8, R9, R13)
- [ ] Build the Today/Home view: location entry (manual + device), date picker limited to the forecast range, units toggle, character + outfit rendering, reroll arrows, weather icon, written recommendation, reminders — using `ref-08`/`ref-12` for layout
- [ ] Build the Trips view: add trip (location + date range of any length), trip list with upcoming/complete status, trip day navigation (Day 1/2/3…), the forecast-window gating message for out-of-range days, edit/delete — using `ref-09`, `ref-10`, `ref-11`, `ref-13`, `ref-15` for layout
- [ ] Build the Info/Settings view: required disclosures (R19), auto-delete-past-trips toggle (R18), gender toggle (R21) — using `ref-13`/`ref-14` for layout
- [ ] Apply responsive layouts: one-handed phone layout and sidebar/multi-pane laptop layout (R22, R23)
- [ ] Apply accessibility requirements: contrast, alt text, keyboard navigation/focus, touch target sizing, `prefers-reduced-motion`, ARIA live region (R24)
- [ ] Wire loading, missing-data, service-error, and denied-permission states across every fetch point (R25–R28)
- [ ] Test and fix each checkpoint above against `spec.md` before starting the next
- [ ] Commit meaningful working checkpoints
- [ ] Deploy to a public HTTPS URL (GitHub Pages)

### Verify and revise

- [ ] Check every specification requirement
- [ ] Test multiple locations, current and forecast dates, recommendation categories, outfit and reminder variations, and failure states
- [ ] Verify that eligible outfit and reminder variations are selected independently rather than as fixed pairs
- [ ] Verify that returning to a previously selected date shows the same variations
- [ ] Test the deployed app, independently of the local version, on a real phone and a laptop, including both screens, accessibility, and one-handed controls
- [ ] Prepare the usability test below
- [ ] Test with three peers and record each session
- [ ] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes
- [ ] Implement, verify, and redeploy at least one meaningful revision

### Deliver

- [ ] Confirm all brief deliverables, sources, privacy information, and asset credits
- [ ] Save all chat transcripts
- [ ] Complete the debrief

## Usability testing

Before testing, record the purpose, a few realistic tasks, non-leading prompts, and a consistent note format. For each session, use a non-identifying label and record the task, what the tester did or said, successes, barriers or questions, and possible changes. Keep observations separate from interpretations. After all three sessions, summarize the strongest findings and the improvement they support.

**Purpose:** Check whether a first-time user can get a weather-based outfit recommendation and plan for a future trip without guidance, on both a phone and a laptop, and whether the character/recommendation actually reads as useful rather than decorative.

**Tasks (non-leading prompts to give the tester):**
1. "Open the app and find out what to wear today." (tests manual/device location entry, Today view legibility)
2. "You're not happy with the outfit shown — see if there's anything you can do about that." (tests discoverability of the reroll arrows, without naming them)
3. "You have a trip coming up — add it and check what the weather looks like partway through." (tests Add Trip, date range, and the forecast-window "check back closer" message)
4. "Find out where the weather data comes from and who made this." (tests Info screen discoverability)
5. On phone only: "Do all of that one-handed." (tests one-handed reach, R22)

**Note format (per session):** Tester label (e.g., P1/P2/P3) · Task · What they did/said (observation) · Succeeded / needed help / failed · Barriers or questions raised · Possible change (kept separate from the observation).

**After all three sessions:** summarize the strongest recurring finding(s) and the one improvement they support, then add it to the Build checklist above and implement it before final deployment.

## Revisions

Record material plan changes and why they were made.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
