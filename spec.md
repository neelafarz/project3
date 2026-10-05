# Technical Specification

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Turn the approved research, project brief, and hand-drawn screen designs into testable requirements.

## Instructions for the Developer

Make and approve the product decisions, draw every proposed screen, provide the drawings to the Agent, and keep this file current as the intended result changes.

To begin, open the project repository in a fresh chat and enter:

`Read ./spec.md and help me begin the Project 3 specification.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, `research.md`, and this file. Review the screen drawings the Developer provides. Ask one focused question at a time, surface gaps and trade-offs without inventing requirements, and keep the specification concise and testable.

## Goal

State what the app should help its Users accomplish and name the user story or stories that define that need.

## Screen designs

Draw every proposed screen by hand, in both phone and laptop layouts, on paper, a tablet, a whiteboard, or another hand-drawing surface. Save photos or exports in `reference/`, provide them to the Agent, and link them here. Use the drawings to define layout, hierarchy, controls, navigation, and important interaction states.

### Phone

- [`ref-08-phone-today.jpg`](reference/ref-08-phone-today.jpg) — **Today.** Top corners: Home/Trips nav. Date, current temp, and location at top; F°/C° toggle on the left. Character (with weather icon above) centered in a card labeled "outfit," with left/right arrows beside the card.
- [`ref-09-phone-trips.jpg`](reference/ref-09-phone-trips.jpg) — **Trip day view** (inside an open trip, e.g., "Hawaii Trip"). Day 1/2/3 navigation with Previous/Next, a recommendation card (temp, character) for the selected day, Save/Delete, "edit fits" (edit trip details), and a shortcut back to Today.
- [`ref-10-phone-home.jpg`](reference/ref-10-phone-home.jpg) — **Trip day strip.** Horizontal row of day cards (Day 1, Day 2, Day 3...) for an open trip, each showing its forecast high/low.

### Desktop

- [`ref-11-desktop-home.jpg`](reference/ref-11-desktop-home.jpg) — **Home.** Sidebar nav (Home/Today/Trips) plus a table of saved trips (location, duration), with Add Trip and a click-to-open/expand action per row.
- [`ref-12-desktop-today.jpg`](reference/ref-12-desktop-today.jpg) — **Today.** Sidebar nav, character card with left/right arrows, current date/temp, F°/C° toggle, and an "Add trip" prompt/button.
- [`ref-13-desktop-trips.jpg`](reference/ref-13-desktop-trips.jpg) — **Trips + Info/Settings (combined sidebar view).** Sidebar lists saved trips plus Add; main area holds Info/Settings content (weather source + additional info, art credit, auto-delete-past-trips toggle, extra settings/quick buttons) and an example recommendation card.
- [`ref-14-desktop-view-trip.jpg`](reference/ref-14-desktop-view-trip.jpg) — **Info/Settings detail.** Plain content list for the Info/Settings screen: weather source + additional info, art credit, auto-delete-past-trips (Y/N), extra settings, quick buttons.
- [`ref-15-desktop-add-trip.jpg`](reference/ref-15-desktop-add-trip.jpg) — **Trips list.** Add Trip button; table of saved trips (location, duration) each flagged upcoming (blue) or complete (orange).

### Decisions confirmed from these drawings (pending full write-up below)

- **"Edit fits"** edits the trip's own details (location/date range), not the outfit directly.
- **Trips are date ranges**, not single dates: a saved trip spans multiple days, each with its own recommendation state (character, outfit, icons, reminders), navigable Day 1/Day 2/Day 3..., and flagged upcoming or complete.
- **Info/Settings screen** includes, beyond research.md's original list: an auto-delete-past-trips toggle and extra settings/quick buttons (exact settings TBD).
- **The arrows beside the character** manually re-roll to a new random outfit variation for that recommendation category (outfit only — weather icon and reminder wording are untouched). The re-rolled variation is then persisted as the saved pick for that date/day — returning to it later shows the re-rolled outfit, not the original randomly-assigned one.
- **Trip length is not capped to the forecast window.** A trip can span any number of days (matching the drawings, e.g., an 18–24 day trip). Days within api.weather.gov's live forecast range (~7 days out) show a full recommendation state; days beyond it show a "forecast not available yet — check back closer to your trip" message instead, since weather that far out isn't reliable. As the trip date approaches and enters the forecast window, that day's view switches to the real forecast-based recommendation.

## Requirements

Translate every fixed brief requirement and the selected research-driven feature into a testable requirement. Define the chosen behavior, content, controls, current and forecast data, responsive layout, accessibility, error handling, privacy, credits, and deployment. The main screen should make clear the location, date, units, data source, and whether conditions are current or forecast. Include an acceptance check for each requirement.

> Three numeric thresholds below are proposed defaults, not yet Developer-confirmed (research.md left them as judgment calls). Review and adjust before approval: **R10** (rain %), **R11** (sunscreen proxy), **R12** (hydration).

### Location & date (Home)

- **R1 — Manual entry.** Free-text US location search resolved via Nominatim geocoding. *Check: a valid US city/state resolves to coordinates and shows matching weather; an invalid/non-US entry shows a clear error, not a crash.*
- **R2 — Device location.** Browser Geolocation API, reverse-geocoded via Nominatim for a display name. *Check: granting permission shows current conditions for the device's location with a readable place name.*
- **R3 — Most-recent-only persistence.** Only the latest Home location is saved (localStorage), replacing any prior one. *Check: choosing a new location and reloading shows the new location, not the old one.*
- **R4 — Forecast-date range.** Date picker offers only today + api.weather.gov's available forecast days (~7). *Check: no date beyond the provider's range is selectable.*
- **R5 — Units toggle.** °F/°C toggle converts displayed temperatures client-side. *Check: toggling changes all shown temperatures without re-fetching data.*

### Recommendation state & character

- **R6 — One shared state.** Character outfit, weather icon(s), written recommendation, and reminders all derive from one recommendation state per location+date. *Check: changing date/location updates all four together, never independently.*
- **R7 — Outfit by temperature band + rain modifier.** Character wears the outfit for the active band (Very Cold/Chilly/Neutral/Hot/Very Hot per research.md cutoffs); a rain prop (raincoat/umbrella) layers on top when the rain threshold (R10) is met. *Check: band and rain-modifier art match the day's actual temperature and precipitation chance.*
- **R8 — Manual reroll (outfit only).** The arrows beside the character cycle to another random outfit variation within the same category; weather icon and reminder wording are unaffected. *Check: pressing an arrow changes only the outfit art.*
- **R9 — Reroll and view persistence.** A manual reroll is saved as the new pick for that date/day and survives reload; viewing a date without rerolling always shows its previously-assigned (or previously-rerolled) variation, never reshuffled. *Check: reroll → reload → same rerolled outfit appears; view a date, leave, return → identical outfit/reminder wording as before.*

### Reminders (proposed thresholds — confirm)

- **R10 — Rain/umbrella.** Triggers when NWS Probability of Precipitation ≥ **40%** for the selected day. *Check: a forecast ≥40% PoP shows the umbrella reminder + rain-modifier outfit; below it, neither appears.*
- **R11 — Sunscreen (UV proxy).** Triggers when forecast high ≥ **75°F** AND NWS sky cover ≤ **40%** (documented on the Info screen as a proxy, since api.weather.gov has no UV field). *Check: a hot, mostly-clear day shows the sunscreen reminder; a hot but overcast day does not.*
- **R12 — Extra hydration.** Triggers when heat index ≥ **85°F** (NOAA heat-index guidance). *Check: a day computing to ≥85°F heat index shows the hydration reminder.*
- **R13 — Independent reminder wording.** Each triggered reminder's wording is chosen independently at random from ≥3 variations per reminder type, persisted the same way as outfit variations (R9). *Check: the same reminder on different days can show different wording; returning to a date keeps its original wording.*

### Trips (additional feature)

- **R14 — Add trip.** Location (same manual-entry/geocoding as Home) + a start/end date range of any length. *Check: a trip of any duration (e.g., 18 days) can be saved.*
- **R15 — Per-day recommendation within a trip.** Each day in the range gets its own recommendation state using the same rules as Home (R6–R9) when that day falls within the live forecast window (~7 days out); days outside that window show "forecast not available yet — check back closer to your trip" instead. *Check: a trip day 10+ days out shows the not-yet-available message; the same day, once within ~7 days, shows a real recommendation.*
- **R16 — Trip list & status.** Saved trips list shows location + duration, flagged **upcoming** (end date ≥ today) or **complete** (end date < today). *Check: a trip whose end date has passed is flagged complete; others are flagged upcoming.*
- **R17 — Edit / delete trip.** "Edit fits" opens editing for the trip's location and date range; Save persists changes (recomputing per-day states); Delete removes the trip. *Check: editing a trip's dates and saving updates its day-by-day view; deleting removes it from the list.*
- **R18 — Auto-delete past trips (setting).** A Y/N toggle in Info/Settings; when on, trips flagged complete are automatically removed. *Check: with the setting on, a completed trip disappears after its end date passes (checked on next load); with it off, it remains listed as complete.*

### Info / Settings screen

- **R19 — Required disclosures.** Creator, weather-data source (api.weather.gov) + geocoding source (Nominatim/OpenStreetMap, with required attribution), recommendation methods and sources (apparel/reminder guidance cited in research.md), privacy practices, and art credit (AI-generation tool/method disclosed). *Check: all five items are present and match research.md's citations.*
- **R20 — Auto-delete-past-trips toggle.** See R18. *Check: setting persists across reloads and visibly changes trip-list behavior.*
- **R21 — Gender setting.** A button/toggle in Info/Settings to switch which gender's character/outfit set is shown, applied app-wide (Home and all Trips). *Check: toggling updates the character shown on Home and in open Trips without re-entering a location; the choice persists across reload.*

### Responsive layout

- **R22 — Phone, one-handed.** Single-column layout; primary controls (date/location, reroll arrows, nav) sit within comfortable thumb reach; touch targets ≥44×44px. *Check: a peer tester can view and reroll today's recommendation, change date, and open Trips one-handed without repositioning their grip.*
- **R23 — Laptop, uses the space.** Persistent sidebar nav + multi-pane content (e.g., trips table beside the character panel), not a centered, stretched phone column. *Check: at laptop width, Home/Trips show a multi-column layout, not a single centered column.*

### Accessibility

- **R24 — WCAG 2.1 AA basics.** 4.5:1 text contrast; alt text on character/outfit/icons describing the recommendation (not just "image"); full keyboard navigation with visible focus indicators; 44×44px touch targets; respects `prefers-reduced-motion` for outfit-change animation; an ARIA live region announces recommendation-state changes. *Check: automated contrast check passes; full app is operable by keyboard alone with visible focus; a screen reader announces an update when date/location changes.*

### Error handling

- **R25 — Loading state.** Visible indicator while fetching weather/geocoding data. *Check: a loading indicator appears between request and response.*
- **R26 — Missing data.** A forecast day without provider data (R15) shows a clear message, not blank/broken UI. *Check: a day beyond the forecast window shows the "not available yet" message.*
- **R27 — Service errors.** Network failure or provider downtime shows a clear message with a retry option. *Check: a simulated failed fetch shows an error message and a way to retry, never a silent failure.*
- **R28 — Denied location permission.** Falls back clearly to manual entry with a short explanation. *Check: denying the browser's location prompt shows an explanation and the manual-entry control; the rest of the app stays usable.*

### Privacy

- **R29 — Client-side only.** Only the most recent Home location (R3) and saved trips are stored, in localStorage; location/search text is sent only to api.weather.gov and Nominatim; no analytics or third-party tracking; practices disclosed on the Info screen. *Check: inspecting network requests shows only weather/geocoding calls; inspecting localStorage shows only location/trip data.*

### Deployment

- **R30 — Public HTTPS deployment.** Deployed via GitHub Pages at a public HTTPS URL, matching this approved spec. *Check: the deployed URL loads over HTTPS and every requirement above is verifiable there.*

## Recommendation state and data flow

Define the weather inputs, recommendation categories, coded rules, and shared state. Weather values must come from the provider, and rules must follow the weather guidance cited in `research.md`. The selected location, date, and live weather data must produce one recommendation state that drives every visual and written output.

**Inputs (per location + date):** forecast high/low temp, Probability of Precipitation (PoP), NWS sky cover, heat index (derived from temp + relative humidity).

**Derived recommendation state** (one object per location+date, the single source driving the character, icons, written recommendation, and reminders):

```
{
  temperatureBand: "veryCold" | "chilly" | "neutral" | "hot" | "veryHot",   // research.md cutoffs
  outfitVariation: 0 | 1 | 2,            // random on first view; persisted; reroll (R8) updates this
  rainModifier: boolean,                  // PoP >= 40% (R10)
  reminders: {
    rain:      { active: boolean, wordingVariation: 0 | 1 | 2 },  // R10
    sunscreen: { active: boolean, wordingVariation: 0 | 1 | 2 },  // R11
    hydration: { active: boolean, wordingVariation: 0 | 1 | 2 },  // R12
  }
}
```

**Flow:** location + date → fetch forecast period from api.weather.gov → compute band, PoP, sky cover, heat index → look up or (if first view) randomly assign `outfitVariation` and each active reminder's `wordingVariation` → persist the full state keyed by location+date (Home: one key for "current"; Trips: one key per trip-day) → render character, icons, written recommendation, and reminders from that one stored state.

## Content variation

Define at least three outfit variations for each recommendation category and at least three wording variations for each reminder type. Define how outfit and reminder variations are chosen independently at random, and how a previously selected date keeps the same variations, including whether they persist after the page reloads.

- **Outfits:** 3 variations × 5 temperature bands × 2 genders = 30 outfit variations, each optionally layered with the rain modifier (R7).
- **Reminders:** 3 wording variations each for rain, sunscreen, and hydration (9 total strings).
- **Independence:** outfit variation and each reminder's wording variation are chosen independently at random the first time a location+date (or trip-day) is viewed — not linked to each other.
- **Persistence:** once assigned (or rerolled, for outfit — R8/R9), a date/day's variations are stored in localStorage keyed by location+date and survive page reloads. They only change via an explicit reroll (outfit) or if the underlying forecast data changes enough to shift the temperature band or a reminder's active/inactive state (in which case that element is re-assigned, since the prior variation no longer applies).

## Assets

List every art and graphical asset: the character, each outfit variation, icons, and any other visuals. For each, note where it appears, its format, and whether it will be created, generated, or licensed, with its credit or license.

| Asset | Count | Appears on | Format | Source |
|---|---|---|---|---|
| Base character doll | 2 (per gender) | Home, Trips day view | AI-generated image (layered/transparent PNG) | AI-generated, disclosed on Info screen |
| Outfit layers (top/bottom/outerwear/shoes per band) | 5 bands × 3 variations × 2 genders = 30 | Home, Trips day view | AI-generated image (transparent PNG), paper-doll layered over base doll | AI-generated, disclosed on Info screen |
| Rain modifier (raincoat/umbrella prop) | 1 (× 2 genders if style differs) | Layered over any outfit when R7/R10 trigger | AI-generated image (transparent PNG) | AI-generated, disclosed on Info screen |
| Weather condition icons (sun/cloud/rain/etc.) | ~5–7 | Home, Trips day view, Trips day strip | AI-generated image, matching character art style | AI-generated, disclosed on Info screen |
| Reminder icons (umbrella/sunscreen/water) | 3 | Home, Trips day view | AI-generated image, matching character art style | AI-generated, disclosed on Info screen |
| Upcoming/complete status markers | 2 (blue/orange) | Trips list | SVG/CSS | Created in-app (simple shapes, no license needed) |

## Out of scope

Record features intentionally excluded from this project.

- **Non-US locations** — manual entry and device location are scoped to the US only, per the brief.
- **Accounts / multi-device sync** — no backend or login; Home location and Trips are local to one browser (per the client-side-only privacy decision).
- **Social sharing / posting** — no share-to-social or export features for the character/outfit.
- **Offline support** — no cached forecasts or offline mode; the app requires a live connection to api.weather.gov and Nominatim.
- **Push/scheduled notifications** — reminders only appear while the app is open; no background or scheduled alerts.
- **Historical weather** — only today and the live forecast range (~7 days) are viewable; no past-date lookback.

## Revisions

After implementation or testing, record requirement changes and the evidence that prompted them. Update the screen drawings when a material layout or interaction changes.

## Approval

The Developer reviews and explicitly approves this specification and its screen designs before planning begins.

**Approved by the Developer on 2026-10-05.**

## Saving the transcript

After the Developer approves the specification, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/spec-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
