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
  character.js     — SVG body/hair/outfit/umbrella layers, composed per state
  icons.js         — SVG weather + reminder icons
  main.js          — wiring/event handlers, view switching
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

- [x] Scaffold the file structure above; confirm GitHub Pages can serve `index.html` from the repo root
- [x] Create the art as original SVG in code (`js/character.js` + `js/icons.js`): chibi body and hair per gender, 30 composed outfits, umbrella overlay, weather icons, 2 reminder icons; skin/hair color pickers (R31, R32). Get Developer approval of a rendered preview before building all 30 outfits *(Developer approved the bodies, hair, 30 outfits, umbrella, and color pickers on 2026-10-12; `icons.js` weather and reminder icons approved 2026-10-12)*
- [x] Build `geocode.js`: Nominatim search (manual entry) and reverse geocode (device location), with clear errors for invalid/non-US input
- [x] Build `weather.js`: coordinates → NWS points lookup → forecast fetch, returning per-day temp, PoP, heat index
- [x] Build `storage.js`: localStorage schema for the most-recent Home location, saved trips, per-date/day recommendation state, and settings (gender, auto-delete-past-trips)
- [x] Build `recommendation.js`: temperature-band rules, rain/hydration triggers (R10, R12), and variation assignment/persistence (R8, R9, R13)
- [x] Build the Today/Home view: location entry (manual + device), date picker limited to the forecast range, units toggle, character + outfit rendering, reroll arrows, weather icon, written recommendation, reminders — using `ref-08`/`ref-12` for layout
- [x] Build the Trips view: add trip (location + date range of any length), trip list with upcoming/complete status, trip day navigation (Day 1/2/3…), the forecast-window gating message for out-of-range days, edit/delete — using `ref-09`, `ref-10`, `ref-11`, `ref-13`, `ref-15` for layout
- [x] Build the Info/Settings view: required disclosures (R19), auto-delete-past-trips toggle (R18), gender toggle (R21) — using `ref-13`/`ref-14` for layout
- [x] Apply responsive layouts: one-handed phone layout and sidebar/multi-pane laptop layout (R22, R23)
- [x] Apply accessibility requirements: contrast, alt text, keyboard navigation/focus, touch target sizing, `prefers-reduced-motion`, ARIA live region (R24)
- [x] Wire loading, missing-data, service-error, and denied-permission states across every fetch point (R25–R28)
- [x] Test and fix each checkpoint above against `spec.md` before starting the next
- [x] Commit meaningful working checkpoints
- [x] Deploy to a public HTTPS URL (GitHub Pages): https://neelafarz.github.io/project3/ (served from branch `project-3`, root; verified live 2026-10-12)

### Verify and revise

- [ ] Check every specification requirement
- [ ] Test multiple locations, current and forecast dates, recommendation categories, outfit and reminder variations, and failure states
- [x] Verify that eligible outfit and reminder variations are selected independently rather than as fixed pairs
- [x] Verify that returning to a previously selected date shows the same variations
- [x] Test the deployed app, independently of the local version, on a real phone and a laptop, including both screens, accessibility, and one-handed controls *(Developer confirmed on phone and laptop, including device location, 2026-10-12)*
- [x] Prepare the usability test below
- [x] Test with three peers and record each session
- [x] Add the chosen improvement to this checklist, and update `spec.md` if the intended result changes *(improvement: center the character; recorded in spec.md Revisions)*
- [x] Implement, verify, and redeploy at least one meaningful revision *(character centering, live 2026-10-12)*

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

**Results (2026-10-12, three peers):**
- **P1:** liked Trips; wished forecasts were available further ahead to plan outfits sooner. Not in our control (api.weather.gov publishes about 7 days). Possible change: show the date a day's forecast becomes available.
- **P2:** the character should sit dead center on desktop and phone. Confirmed by measurement: the figure's center line (x=120) was 40 units left of the frame's center (x=160) in `character.js`. Possible change: recenter the frame.
- **P3:** suggested letting the user change the character's top and bottom colors. Feasible (outfit pieces are drawn from color values, like skin and hair); would add a new requirement.
- **Strongest finding / chosen improvement (Developer decision):** center the character (P2), a confirmed defect on every screen. P1 and P3 recorded as possible future changes.

## Revisions

Record material plan changes and why they were made.

- **2026-10-05 — Scope changes from spec.md Revisions.** Sunscreen reminder removed (not relevant to clothing); outfit art is one full-character image per outfit instead of layered paper-doll (AI tools can't reliably align transparent layers). Asset task and `weather.js`/`recommendation.js` items updated to match.
- **2026-10-05 — Art is original SVG drawn in code, not AI-generated PNGs; skin and hair color pickers added.** An overlay test of ChatGPT-generated layers failed alignment, and the pickers need recolorable layers. `assets/` folder replaced by `js/character.js` and `js/icons.js`; see spec.md Revisions.

- **2026-10-12 — Usability finding: character off-center, fixed.** Peer 2 reported the character sat left of center; measured offset was 40 of 400 frame units. `character.js` frame changed from `-40 -40 400 510` to `-115 -40 470 510` (centered on the figure at x=120, still containing the umbrella, which reaches x=352). Verified across all 60 renders (30 outfits, with and without umbrella): max offset 0 units, none clipped. Trade-off: on phones the character is about 14% smaller because the frame is wider.

## Saving transcripts

At the end of planning, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/plan-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.

At the end of every implementation chat, ask the Developer to enter `save transcript`. When directed, save the complete conversation as `transcripts/build-YYYY-MM-DD_HHMMSS.md` using the same formatting.
