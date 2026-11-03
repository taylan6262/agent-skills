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
