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

## Weather and technical evidence

Record each useful source, what it supports, and important limitations. Research the weather variables, apparel guidance, reminders, accessibility, privacy, artwork, weather providers, and technical options needed for informed decisions.

## Decisions

Record the selected weather provider, forecast range, recommendation categories and rules, screen structure, visual direction, artwork approach (original, AI-generated, or appropriately licensed), deployment method, and one additional feature justified by the research. Briefly explain important trade-offs.

Once the recommendation categories are chosen, estimate the art needed: the character, three outfit variations per category, weather icons, and reminder icons. Use that estimate to choose the artwork approach.

## Revisions

Record new evidence or changed decisions and explain why they changed.

## Approval

The Developer reviews the sources and decisions, corrects this file, and explicitly approves it before specification begins.

## Saving the transcript

After the Developer approves the research, ask them to enter `save transcript`. When directed, save the complete conversation as `transcripts/research-YYYY-MM-DD_HHMMSS.md`, label chat messages `Developer` and `Agent`, and confirm the saved path.
