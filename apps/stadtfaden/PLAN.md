# Plan: Stadtfaden

1. **Skeleton & design system** — tokens (light/dark), fonts, layout grid, ticket-style form.
   ✔ Check: renders at 1440px and 400px.
2. **Example plan + data model** — `cleanPlan()` validates every plan; example of Munich.
   ✔ Check: unit test of `cleanPlan` with broken JSON fields.
3. **Timeline** — stop cards (time window, opening hours, warnings), leg cards
   (line badge, direction, board → N stations → get off), deep links.
   ✔ Check: closing-time warning appears for a constructed conflict.
4. **Line map (SVG)** — projection, octilinear legs, colors per mode, live position.
   ✔ Check: screenshot.
5. **"Jetzt" board** — current stop/next departure, countdown, time slider.
   ✔ Check: slider moves the board and the map marker.
6. **Data pipeline** — capabilities, location detection (Claude quick), Booking.com attractions + accommodations
   in parallel, check-in QA, plan (Claude), progress list with per-step errors.
   ✔ Check: without capabilities → clear notices, example stays.
7. **Accommodations & experiences** — cards, distance to the route, "Start here" → replan.
8. **Adjust, save, calendar** — refinement prompt, db save/load, Google Calendar.
9. **Review & ship** — a11y, both themes, publish, functional pass (db read).
