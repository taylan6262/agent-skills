# Spec: Stadtfaden — your day as a line through the city

## Objective
A travel guide that turns a city and a wish into a timed day plan:
which places, when, how to get there (line, direction, boarding stop, exit stop),
how long places are open, where to stay and when check-in starts.

**Users:** Travelers who want a good day in an unfamiliar city with no planning effort.

## Requirements → Solution (the core of this spec)
| Requirement | Data source | Reliability |
|---|---|---|
| City + wish → route for half a day / full day / custom duration | Claude (`sample` capability) plans from real Booking.com data + local knowledge | Planned, time windows calculated |
| Hotel / Airbnb-like apartment | Booking.com connector `accommodations_search` (HOTEL / APARTMENT / HOLIDAY_HOME) | **Real** (price, rating, coordinates, booking link) |
| When is check-in | Booking.com `answer_property_qa_by_ids_v2` | **Real** answer from Booking.com |
| Attractions | Booking.com `attractions_search` + free sights from Claude | **Real** tickets/ratings + knowledge |
| Which train when, stops, where to get off | Claude: line, direction, boarding/exit stop, intermediate stops; per leg a "check live connection" deep link to Google Maps transit | Plan + **live** check via link |
| How long places are open | Claude: typical opening hours per weekday (Sundays!), app warns about conflicts; Google Maps link per place for live hours | Typical, marked as such |
| Where to go right now | "Jetzt" (now) board: current stop, next departure, countdown; time slider for preview | Calculated |
| Keep the day | Save (`db`, private per person) + "Add to Google Calendar" | Real |

### Why this way (constraints)
- The artifact page must not load external APIs or map tiles (CSP). Real data therefore
  only comes through the viewer's claude.ai connectors (`mcp`) and Claude (`sample`).
- No transit/maps connector is connected. Mapbox from the registry would be an upgrade
  for real routing; until then: plan + live deep link per leg.
- Map: no tiles allowed → the app draws its own **line map** (SVG, octilinear like
  a transit network map) from the real coordinates.

## Boundaries
- Always: separate real data (Booking.com) visibly from planned/estimated data.
- Always: every connector failure stays in its own section, with the action that fixes it.
- Always: example plan on first load, clearly marked "Beispiel" (example); never fake hotels.
- Never: invent check-in times; if unknown, say so and link to Booking.com.
- Never: write without a click (calendar, save).

## Success criteria
1. Entering a city → within about 1 minute: plan with ≥3 stops, times, legs with line info.
2. Hotels with price, rating and check-in time (where Booking.com returns them).
3. Closing-time conflicts are flagged automatically.
4. Works at 400px width, in light and dark, without errors; without connectors the example + clear notices appear.

## Testing
Playwright: example renders, map draws, "Jetzt" board responds to the slider, form validation,
behavior without capabilities (status notices), 400px without horizontal scroll, both themes.
Plan validation (`cleanPlan`) as a pure function tested against bad inputs.

---

## Increment 2: Multi-day trips

**Problem:** "For as long as you want" ends at one day today, even though the stay search
already covers several nights. Anyone traveling for 3 days has to plan three times and
gets repeats.

**Behavior**
- Time frame gets a 4th option, **"Mehrere Tage"** (several days): 2–7 days, hours per day adjustable
  (default 8). Nights follow the number of days automatically (days − 1, at least 1).
- Booking.com is searched **once**: experiences for the whole period, stays for all nights.
- Claude plans **day by day** (one call per day, so no long reply gets cut off):
  - Day 1 picks the best stay (`stay_id`); the check-in, if requested, only falls on day 1.
  - Day 2+ start at that stay.
  - Every day gets the stops of the other days as a "do not repeat" list.
- Day tabs show each finished day immediately; days still in progress are marked "plant …" (planning …).
- If one day fails, the earlier days stay; "Ab Tag N weiterplanen" (continue planning from day N) resumes there.
- Adjust, "Neu planen" (plan again) and "Tag ab hier planen" (plan the day from here) affect the **open day**; other days stay unchanged
  and are passed as the "do not repeat" list.
- Board, opening hours (weekday!), map and calendar refer to the open day.
- Save stores all days; old saved single-day plans still open.

**Boundaries:** at most 7 days (Booking.com: 90 nights, 180 days ahead). No auto-planning
of all days on "adjust": only the open day, so a change doesn't overwrite good days.

**Success criteria:** 3-day trip → 3 tabs, 3 plan calls, day 2 starts at the stay,
no stop of day 1 repeats in the day 2 prompt, error on day 2 keeps day 1.
