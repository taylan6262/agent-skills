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

## Increment 2: Multi-day trips
10. **Form** — "Mehrere Tage" segment, days field, nights sync, validation (end ≤ 180 days).
    ✔ Check: switching shows/hides days; hours slider keeps the segment.
11. **Data model** — `S.days[{date, plan}]`, `S.dayIdx`, `D()` for the open day's date; `revivePlan()` for saved data.
    ✔ Check: old saved data opens as 1 day.
12. **Pipeline** — Booking.com period, `planDays()` sequential with "do not repeat" list + stay as start, resume on failure.
    ✔ Check: test double counts 3 plan calls; failure on day 2 → day 1 visible + resume.
13. **UI** — day tabs (incl. "plant …"), day-dependent board/hours/calendar, refine per day.
    ✔ Check: tab 2 → date badge + weekday in the opening-hours heading change.
14. **Review & ship** — tests, screenshot, publish, commit, push (updates PR #1).

## Increment 3: Redesign (design contract in SPEC.md)
15. **Tokens & base** — contrast values, field-border, inverse, radii, lang, sr-only/status region.
16. **Form** — native radios, "Weitere Angaben" details, stub after planning, error ARIA.
17. **Results layout** — plan header full width, 7/5 grid, sticky panel, phone order via flex + display:contents.
18. **Components** — day line, notes box, board (2 cells, compact phone mode), timeline rails, map (labels, height, switcher), book rows.
19. **Focus & announcements** — focus restoration, plan title focus, aria-disabled, valuetext.
✔ Check: existing 76 tests (selectors adjusted) + new checks for stub, radios, focus, contrast tokens; before/after screenshots.
20. **Review** — `code-reviewer` agent on the diff; fix findings; ship.
21. **Review findings (code-reviewer)** — wheel scrolling over the side panel, breakpoint change, map pane on phones,
    example → refine path, button spacing in saved plans, board mini readable, slider renders only visible panes
    (rAF), pulse only once, saved tickets sanitized, SPEC updated for app views. ✔ Each finding has its own check.

## Increment 4: Account, trips, on the go, bookings (SPEC)
22. **Sheet component** (dialog with focus, Esc, return) + **welcome/permissions** + account in the masthead.
23. **Trips:** autosave (debounced, one write per doc), "Meine Reisen" with ongoing/upcoming/past, new trip, start view.
24. **On the go:** progress model (check-ins), board actions, live position from check-ins, shift (local),
    rest via Claude (merge with fixed stops), nudge + sound.
25. **Reminders:** calendar events per departure (popup 10 min), deletion via ID when updating.
26. **Bookings:** form + extraction (text/image via Claude), booked stays in list, map, start point.
✔ Checks per point with test doubles; regression of all earlier suites; review by the code-reviewer agent.
27. **Review findings increment 4 (code-reviewer)** — trip identity: "Neue Reise" (new trip) only takes effect once a new plan arrives
    (form intent edit/new, draft bookings, `flushPersist` before switching, generation guard after every `await`, no
    opening/deleting while planning); restore on a failed re-plan; times past midnight without the 24h wrap;
    booking save guarded; changeover day (start at A, check-in at B), no booking outside its dates; nudge per departure
    time; reminders stale on re-plan/failure, past departures skipped, ID fallback via `list_events`, delete old ones;
    deleting the open trip does not resurrect it (+ offer to delete its reminders); sheet makes the background `inert`;
    side panel watches its size (ResizeObserver); "welcomed" also stored in the account. ✔ 19 regression checks.

## Increment 5: Round trip
28. Model: `tour`, `days[i].place/outline`, `plan` may be null; all render/live functions null-safe.
29. Unplanned day: outline view, "plan this day / all open days" (planTourDay with fixed appointments).
30. Trip overview (stations, flights/trains, to-dos, good to know) + day line with cities.
31. Prompts/map/reminders per day place.
32. Import of the Asia trip 2027 (one source: generator → store + test doubles).
✔ New suite test-tour + all earlier suites; review by the code-reviewer agent.
