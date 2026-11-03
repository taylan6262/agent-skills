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

---

## Increment 3: More stylish & clearer (design contract)

Basis: design critique (`design:design-critique` + `frontend-ui-engineering`) and an
accessibility review (`design:accessibility-review`, WCAG 2.1 AA), both by agents with screenshots.

**The screen's job:** after planning, show the plan immediately. The form recedes, the plan leads.

### Layout
- **Before planning:** compact ticket form. Visible: city, wish, focus areas, time frame, date, start.
  "Weitere Angaben" (more details: starting point, pace, people, stay) collapses into a `<details>` with a summary of the current values.
- **After planning:** the form becomes a ~72px **ticket stub** (city · dates · start · people · stay + wish) with "Ändern" (change).
- **Plan header full width:** day tabs as stations on a line → title (2.6rem) → one mono meta line → summary
  → one "Hinweise" (notes) box (ticket tip + warnings) → toolbar (save · calendar · plan again).
- **Desktop 7fr/5fr:** left the timeline; right a sticky panel (never taller than the viewport) with board,
  "Plan anpassen" (adjust plan), and map card with switcher [Linienplan (line map) | Öffnungszeiten (opening hours)].
- **"Buchen" (book) section full width** with switcher [Unterkünfte (stays) | Tickets & Touren (tickets & tours)] as comparison rows
  (name · rating · distance · check-in/out · price · action), chosen stay first, "via Booking.com" once.
  Hidden in example mode.
- **Phones (≤ 760px): app views** instead of one long page (owner's request). A bottom bar with
  **Plan · Karte (map) · + Ausflug (trip) · Buchen (book) · Pläne (plans)**; each view shows only its content. Routing via a plain hash
  (`#plan`, `#karte`, `#ausflug`, `#buchen`, `#plaene`), so the back button returns to the previous view.
  First visit opens "Ausflug"; after planning, "Plan". The Plan view: stub → plan header → board (sticky,
  compact, expandable with "Mehr") → timeline → adjust. Karte: map and opening hours one below the other.
  Buchen also shows empty states in example mode (explaining what will appear there).
- **Crossing the breakpoint** (rotating, resizing the window): "Ausflug" ↔ open form are mapped to each other,
  so nobody lands mid-edit on the wrong view; the map is redrawn.
- Desktop: "Zurück zum Plan" (back to the plan) closes the reopened form again.
- Masthead in one line with "Meine Pläne (n)" (my plans); data sources as a text status line in the footer.

### Visual
- Type: plan title 2.6rem/1.05, wordmark 1.6rem, section h2 1.3rem, panel titles as mono eyebrows.
- Sections 40px apart, opened with a 2px ink line + eyebrow.
- Radii only as tokens: 12 / 8 / 4 px; pills only for buttons and chips.
- Timeline: time at a stop = thin muted line, ride = 6px mode color, walk = dotted; current stop filled
  in signal yellow; time column arrival bold over departure muted.
- Accent in moderation: links in ink with an accent underline, short ("Maps ↗", "Tickets 12,5 € ↗").
- Board: two cells (now | next departure), clock 2rem, edge in dark mode.
- Map: height from content (16:9 to 1:1), labels avoid each other and the stations, current stop
  highlighted instead of covered.

### Accessibility (must fix)
- Contrast: S-Bahn `#1f8243`, ferry `#0a7b92`, walk `#76837c`, taxi `#a37a00`, accent `#087050`;
  badge text via `--lb-ink` (dark theme: dark text); fields with `--field-border` ≥ 3:1; placeholder opacity 1.
- `--inverse` tokens instead of `--ink` as a fill (no white blocks in dark).
- Status not only via color (data sources with text). `lang="de"`.
- Keep focus after rebuilding (day tabs, buttons); after planning, focus on the plan title.
- Time frame as native radios (arrow keys); day tabs/switchers as buttons with `aria-current`.
- An always-present `role="status"` for announcements; form errors with `aria-invalid` + `aria-describedby`.
- Slider with `aria-valuetext`, map as `role="group"`, targets ≥ 24px (≥ 44px on touch devices),
  "(neuer Tab)" (new tab) for external links, limited pulse animation.

---

## Increment 4: Account, trips, on the go, bookings

**Owner's request:** sign-in; asked about location and notifications on start; see interactively where
you are and where you need to go; a reminder when it's time to move on; "stay longer" with new options;
choose a trip on start or plan a new one; past trips with what you did; enter booked hotels via a
booking confirmation, with map + check-in info.

### What the platform allows, and the solution
| Wish | Limit in claude.ai artifacts | Solution |
|---|---|---|
| Sign-in with Apple/Google/free | No custom OAuth without a server | **claude.ai account is the sign-in** (that's how you sign in to claude.ai: Google, Apple, e-mail). Name + avatar via `user` (scope `profile`); trips private under `data/users/<id>/`. |
| Share location (GPS) | No location capability for this account | **Check-ins** "Bin da" (I'm here) / "Weiter" (move on) mark your position; "Route ab meinem Standort ↗" (route from my location) and "Wo bin ich? ↗" (where am I?) open Google Maps with the real GPS. If a location capability becomes available, it plugs in at the same place. |
| Notifications | No web notifications in the frame | **Real phone reminders via Google Calendar:** one event per departure with a popup 10 min before. When the plan shifts, old events are deleted (`delete_event` with the `id` from `create_event`) and new ones created. While the app is open: a hint on the board + optional sound. |
| Asked on start | `permissions.request()` | **Welcome sheet** on first start: signed in as …, allow Claude / Booking.com / Google Calendar in one go, the location and notifications explanation, sound on/off. Reachable again later via "Erlaubnisse" (permissions). |

### On the go (open day = today)
- Board shows a button depending on the state: at a stop **[Weiter] [Länger bleiben]** (move on / stay longer); on the way **[Bin da: next stop]** (I'm here).
- Check-ins store real times. Deviation ≥ 10 min → offer: "Rest verschieben?" (shift the rest?)
- **Länger bleiben** (stay longer): +15 / +30 / +60 min → preview (next stop, closing-time conflicts) →
  **[Alles verschieben]** (shift everything, local, immediate) or **[Rest neu planen]** (re-plan the rest; Claude re-plans from the current stop with new
  options; completed stops stay fixed).
- If reminders exist for the day: "Erinnerungen aktualisieren" (update reminders) after every shift.

### Trips
- Planned trips save **automatically** (no button). Trip = one doc with all days, stays,
  bookings, check-ins, reminder IDs.
- **Start:** if trips exist, the app opens "Meine Reisen" (my trips): *Läuft gerade* (ongoing) · *Kommend* (upcoming) · *Vergangen* (past), plus
  "Neue Reise planen" (plan a new trip). Past trips show "x of y stops visited" and in the timeline "Du warst hier 10:42–11:30" (you were here).
- Older saved plans (v1/v2) still open.

### Booked stays
- "Buchung eintragen" (add booking) in Buchen (book) and in the form: paste confirmation text **or** upload a screenshot →
  Claude extracts name, address, check-in/out (date + time), booking number, phone, coordinates →
  editable preview → save. Manual entry also works without Claude.
- Booked stays: at the top of the stays list ("Gebucht"), as an H marker on the line map, as the **start
  point** of the days within the booking period; check-in day = check-in in the plan.

### Boundaries
- Writes to the calendar only on a click; reminders only for the open day.
- Data like booking numbers only privately under `data/users/<id>/`.
- Never invent offers; extracted values are always shown editable before saving.

---

## Increment 5: Round trip (multiple cities)

**Owner's request:** the Asia trip 2027 (reference PDF + Google Calendar) belongs in the app as one trip:
Bangkok → Phuket → Bangkok → Tokyo → Kyoto → Osaka → Tokyo-Ueno, all hotels booked, Phuket flights and Shinkansen still open.

**Model:** a trip can carry a `tour` object: stations (city, dates, nights), flights & trains
(`transfers` with status *booked / open / no ticket needed*), to-dos (checklist), "good to know".
Each day has its **own place** (`days[i].place`) and an **outline** (title, items, travel plan of the day,
note, time window). `plan` can be **empty** until the day is planned.

**Behavior**
- Unplanned day: the timeline shows "Programm laut Reiseplan" (program per trip plan) + fixed appointments; buttons **"Diesen Tag planen"** (plan this day) and
  **"Alle offenen Tage planen"** (plan all open days; sequential, with progress, can be cancelled after errors).
- When planning, Claude gets: the place of the day, the outline as wishes, fixed appointments (flights/trains, check-in/out),
  the booked hotel as starting point (changeover days: start at the old one, check-in at the new one) and the trip's preferences.
- Planned day: everything as before (board, check-ins, reminders); the outline stays readable as "Programm".
- Day line with city labels; station strip (click → first day of the station).
- **Book view:** trip overview with stations, flights & trains (open ones highlighted + search link),
  to-dos to tick off (saved), "good to know".
- Map, Maps links, reminder time zone and Booking.com searches use the **place of the day**.

**Import of this trip:** I write it once from the PDF + calendar into the private store (`ArtifactData`);
nothing is invented beyond that: open flights stay "open", recommendations are labeled as such.

**Boundaries:** no auto-planning without a click; editing via the trip form ("Ändern" / change) is hidden for round trips
(the form only knows one city).

### Addendum to increment 5 (after the code review)
- **Storage:** a document in the app store may be at most 256 KB (checked). The trip document therefore holds
  only metadata; each planned day lives in its own document `data/users/<id>/<trip>/days/d<i>`.
  Older trips (plans inline) still open; the next save writes the new format.
- **Changeover days:** stops get the place they are located in (nearest station of the day), so reminders get the right
  time zone and Maps links the right city.
- **Fixed appointments** in all prompts (plan, adjust, rest of the day): flights/trains on the day, overnight arrivals,
  check-outs (time from the booking, otherwise 11:00). Shift previews warn when a flight/train gets tight.
- **Tickets & tours** for round trips per city on demand (Booking.com, place of the open day).
