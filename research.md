# Research

> EDITING DIRECTIVE: DEVELOPER AND AGENT EDIT THIS FILE COLLABORATIVELY. THE DEVELOPER MUST REVIEW AND APPROVE ITS CONTENT.

Purpose of this file: Research your context of use, references, weather guidance, technical options, and choices that will guide the specification.

## Instructions for the Developer

Judge sources and recommendations, make the consequential decisions, and keep this file current as the work develops.

To begin, open the project repository in a fresh chat and enter:

`Read ./research.md and help me begin Project 3 research.`

## Instructions for the Agent

Read `AGENTS.md`, `brief.md`, and this file. Ask one focused question at a time. Help investigate and compare options without deciding for the Developer. Verify sources directly and keep this file concise.

## Context of use

As the User, describe when and where you would use the app and what you need from it. Record important circumstances, assumptions, and limitations.

I would use this app to plan what to wear or pack, in a few different moments:
- The night before a class day, to decide what to lay out.
- During the day, before heading out (e.g., to class, to go out with friends).
- Before or during a vacation, to know what to pack or bring along.

The key data I care about is the high temperature, low temperature, and whether it will rain (and by extension, other conditions worth a reminder, like strong sun or wind).

I would use this almost entirely on my phone; I would rarely open it on a laptop.

For travel, I often need the forecast for a destination different from where I currently am (e.g., checking Miami's forecast while still in Austin) to know what to pack, including what to wear for the trip home.

**Limitation/assumption:** the brief scopes the app to one selected location and one selected date at a time (not a multi-day trip itinerary). For a trip, I'd expect to check the destination by switching location and date one at a time (e.g., check the first day, then check a later day before I leave).

**Working note — candidate additional feature (to formalize in Decisions):** a persisted **Trips** section, separate from the home screen. Home screen keeps the brief's single "most recent location" (manual entry or device location). Trips is a distinct feature where the Developer can save multiple trip locations/dates, each showing its own recommendation breakdown, so trips don't need to be re-entered each visit.

## User story

Write at least one user story grounded in your context of use:

> As a [type of user], I want to [need or goal], so that [reason or outcome].

Focus on the need rather than prescribing an interface or feature.

> As a college student deciding what to wear, I want to see an outfit recommendation based on today's or a chosen day's forecast, so that I don't have to guess or check separate weather details myself.

> As a college student preparing for a trip, I want to save a destination and date and see what to pack, so that I don't have to re-check or re-enter the trip each time before I leave.

## References

Collect 5–10 reference images from relevant products and interfaces. Save each image in `reference/`, identify its source, and record a brief observation about what is useful, ineffective, or relevant to this project. Reference images are examples only; do not use them in the app.

1. **`ref-01-travel-app-luxury.png`** — Source: Pinterest. A travel-app UI mockup with a warm neutral palette, icon-only category filters, destination cards, and a bottom nav bar with a raised center action button. Useful for the Trips section: card-based layout for saved trips, and a bottom-nav pattern that could hold Home / Trips / Info tabs.
2. **`ref-02-travel-app-discover.png`** — Source: Pinterest. A "Discover New Destination" screen showing current location at the top, a search bar, category filter chips, and destination cards that overlay a temperature icon and a "days" badge on the photo. Useful for how a trip card can surface a quick forecast summary (temp + date) without opening the trip.
3. **`ref-03-character-outfit.png`** — Source: Pinterest. An illustrated 3D-style character wearing a full outfit, with the individual clothing pieces (top, pants, bag, shoes) broken out beside her. Strong direction match for the main screen: a character wearing the full recommended look, with an itemized breakdown of the pieces.
4. **`ref-04-weather-widget.png`** — Source: Pinterest. An iOS-style frosted-glass weather widget showing condition, temperature, sunrise/sunset, a rain-probability pill, humidity/wind stats, and a 7-day forecast strip. Useful reference for presenting raw weather data (rain %, humidity, wind) clearly, e.g., in a secondary detail view.
5. **`ref-05-outfit-flatlay.png`** — Source: Pinterest. A flat-lay outfit board (top, shorts, shoes, bag) with no character. Per discussion, the brief requires a character whose clothing changes with the forecast, so this flat-lay format will serve as a secondary itemized-pieces view (like ref-03's breakdown) rather than replacing the character.
6. **`ref-06-carrot-weather.png`** — Source: Google Images (CARROT Weather app screenshot). Current-conditions screen (Seattle, WA) combining a bold current temp, feels-like/precip/sunset stats, a personality-driven text line, a minute-by-minute precip timeline with an umbrella icon, and an hourly/4-day strip. Useful for combining a playful "voice" with dense, well-organized forecast data on one screen.
7. **`ref-07-duolingo-owl.png`** — Source: Google Images (Duolingo app screenshots). Lesson-complete and streak screens where the owl mascot's pose/expression reacts to the outcome, while a separate stat (the streak count) is shown with its own icon rather than being "worn" by the character. Useful for how reminders/stats could sit alongside the outfit character rather than needing to be part of its outfit.

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

### Weather provider

Compared three free providers:

| Provider | Free tier | Forecast range | Geocoding | Notes |
|---|---|---|---|---|
| **api.weather.gov (NWS)** | Free, no API key (descriptive User-Agent header required), ~5,000 req/hour | Current conditions + ~7-day forecast periods, plus severe weather alerts | None built in — needs a separate geocoding step | Official US government source ([weather-gov.github.io/api](https://weather-gov.github.io/api/)); US-only, which matches the brief's US-location requirement |
| OpenWeatherMap (classic free tier) | Free, no card; 60 calls/min, 1M calls/month | Current + 5-day forecast in 3-hour steps | Yes, built-in geocoding endpoint | ([openweathermap.org/api](https://old.openweathermap.org/price)) |
| WeatherAPI.com | Free, no card | Current + 3-day forecast only | Yes, location search | 3-day range felt short for trip planning |

**Decision: using api.weather.gov.** Chosen for being the authoritative, no-key, no-rate-limit-concern US government source, which fits the brief's US-only scope directly. Trade-off accepted: it has no built-in geocoding, so manual location entry needs a separate geocoding source (see below).

### Geocoding (for manual location entry)

Compared three free options for turning typed text into coordinates:

| Option | Free tier | Fit |
|---|---|---|
| **Nominatim (OpenStreetMap)** | Free, no key; 1 request/second on the public instance, requires a descriptive User-Agent and OpenStreetMap attribution ([operations.osmfoundation.org/policies/nominatim](https://operations.osmfoundation.org/policies/nominatim/)) | Best fit — true free-text place search (e.g., "Miami, FL"); the 1 req/sec limit is a non-issue since manual entry is a one-off user action, not batch |
| US Census Geocoder | Free, no key, no published rate limit | Built for full street addresses, not simple "city, state" search |
| Zippopotam.us | Free, no key, no limits | Only works with ZIP codes, not city names |

**Decision: using Nominatim** for manual location search, paired with the browser's Geolocation API (reverse-geocoded via Nominatim too, to get a place name) for device location. Requires attributing OpenStreetMap in the Info screen and setting a descriptive User-Agent/referrer per its usage policy.

### Apparel and reminder guidance

- **Temperature-based outfit guidance** (general consumer dressing guides, not a single official standard): below 40°F generally calls for a real coat; 40–55°F is a jacket-over-layers range; 55–65°F is "sweater weather" where a single layer (light sweater/overshirt) is usually enough; above 65°F a jacket/sweater becomes unnecessary. ([Fit The Forecast](https://fittheforecast.com/blog/what-to-wear-by-temperature), [HAPPIE MOON 78°F rule](https://happiemoon.com/blogs/news/how-to-dress-according-to-temperatures-basic-78f-degree-dressing-rule)) There is no single authoritative temperature-to-clothing standard — this requires a Developer judgment call on exact cutoffs.
- **Rain/umbrella reminder:** NWS defines "Probability of Precipitation" (PoP) as the chance of at least 0.01" of rain at a point over the forecast period, with categorical terms: 10% "Isolated/Few," 20% "Slight Chance," 30–50% "Chance," 60–70% "Likely." ([weather.gov/bgm/forecast_terms](https://www.weather.gov/bgm/forecast_terms), [checkweather.io explainer](https://checkweather.io/blog/what-chance-of-rain-actually-means/)) There is no official NWS umbrella threshold — it's a personal-preference call; common practice cited ranges from 40% up to 60-80%.
- **Sunscreen reminder:** EPA UV Index scale — sunscreen (broad-spectrum SPF 30+) is recommended starting at **UV Index 3** (Moderate), with more urgency (seek shade, reduce midday exposure) from 6+ (High). ([epa.gov/sunsafety/uv-index-scale-0](https://www.epa.gov/sunsafety/uv-index-scale-0)) Note: api.weather.gov's standard forecast endpoint does not include a UV Index field directly — would need to source this separately (e.g., EPA's UV Index API) or approximate from conditions/season if UV isn't available.
- **Extra-hydration reminder:** NOAA Heat Index guidance — 80–90°F apparent temperature: fatigue possible with prolonged exposure/activity; 90–105°F: heat exhaustion/cramps possible; specific guidance to "drink 10 gulps every 20 minutes" during high heat index conditions. ([NOAA Heat Index chart](https://www.noaa.gov/sites/default/files/2022-05/heatindex_chart_rh.pdf), [WPC Heat Index](https://www.wpc.ncep.noaa.gov/heat_index.shtml))

### Accessibility

Following WCAG 2.1 AA basics: minimum 4.5:1 color contrast for text, alt text on all icons/images (including the character and outfit art, describing the recommendation rather than just "image"), full keyboard navigability with visible focus indicators, minimum 44×44px touch targets (important for the one-handed phone requirement), respecting `prefers-reduced-motion` for any outfit-change animation, and announcing recommendation-state changes to screen readers (e.g., via an ARIA live region) since the character/icons update dynamically without a page reload.

### Privacy

The app is client-side only (no backend/account system), so privacy practices are: only the most recent location is stored, in the browser's `localStorage` (never sent anywhere except as coordinates/search text to api.weather.gov and Nominatim for weather/geocoding lookups); device location is only requested after an explicit user action, with a clear explanation of why, and a clear fallback (manual entry) if permission is denied; no analytics or third-party tracking; all of this disclosed plainly on the Info screen.

### Deployment

**Decision: GitHub Pages.** The app is a static, client-only site (no server, no API keys required by either api.weather.gov or Nominatim), which fits GitHub Pages' static hosting directly, deploys from the repo already created (`github.com/neelafarz/project3`), and serves over HTTPS by default — matching the brief's deployment requirement with no extra infrastructure.

**Decision — sunscreen reminder as a proxy:** since api.weather.gov's forecast data has no UV Index field, and the brief requires all live data to come from one provider, the sunscreen reminder triggers on **hot + clear/mostly-clear-sky days** (high forecast temperature combined with low NWS sky cover), used as a documented proxy for high-UV conditions rather than a true UV Index reading. Exact temperature/sky-cover cutoffs to be finalized in `spec.md`.

## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

**Recommendation categories: 5 temperature bands** — Very Cold, Chilly, Neutral, Hot, Very Hot — each with 3 outfit variations (15 outfit variations total). Rain is applied as a modifier on top of whichever temperature-band outfit is selected (e.g., swapping in a raincoat/umbrella prop), rather than its own category, to avoid multiplying the art needed.

Temperature cutoffs (°F):
- Very Cold: below 40
- Chilly: 40–59
- Neutral: 60–80
- Hot: 81–90
- Very Hot: 91+

**Character:** the user can choose a gender for the character (confirmed requirement). This roughly doubles the art scope — two base character dolls plus two sets of clothing-layer pieces, both needing to share a consistent art style.

**Artwork approach: paper-doll layering, AI-generated.** A fixed base character pose per gender, with swappable clothing-layer pieces (top, bottom, outerwear, shoes) combined into 3 outfit variations per temperature band, rather than fully separate illustrations per variation. Searched itch.io/OpenGameArt for a free licensed asset pack matching the semi-realistic streetwear style (ref-03) for both genders; no suitable match found for that specific style + dual-gender need, so decided to generate the piece library with AI instead, using a fixed style/prompt for consistency. Will be disclosed as AI-generated with the tool/method noted on the Info screen, per the brief's art-credits requirement.

**Additional feature (justified by research): Trips section.** Grounded in the second user story (checking a destination different from the current location, without re-entering it every time) — see Context of use. Home screen keeps the brief's core single-location flow (manual entry or device location; only the most recent location saved). The Trips section is a separate, persisted feature: the Developer can add a trip (location + date), and each saved trip shows its own full recommendation state (character, outfit, icons, reminders), so trips don't need to be re-entered on return visits.

**Rough screen structure** (to be finalized from hand-drawn designs in `spec.md`):
1. **Home** — current location (device location or manually entered), today/forecast-date picker, the character with its recommendation state (outfit, weather icons, written recommendation, reminders).
2. **Trips** — list of saved trips (location + date + quick forecast summary), each opening to its own recommendation state; add/remove a trip.
3. **Info** — creator, weather-data source (api.weather.gov) and geocoding source (Nominatim/OpenStreetMap), recommendation methods and sources (apparel/reminder guidance above), privacy practices, and art credits/license (AI-generation disclosure).

**Forecast range:** api.weather.gov's daily forecast periods (~7 days out) define the selectable forecast-date range; "today" uses current conditions.

## Revisions

Record new evidence or changed decisions and explain why they changed.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

**Approved by the Developer on 2026-09-28.**

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
