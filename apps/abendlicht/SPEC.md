# Spec: Abendlicht

## Objective
A cinematic, calming web app: a night lake where people release lanterns with a short
thought. Everyone who opens the page sees the same sky with the same lanterns.

**Users:** People who want a quiet moment in the evening (on mobile or desktop).
**Success criteria:**
1. **Relaxing:** slow motion, a generative soundscape and a breathing mode (4-4-6).
2. **Connection:** shared lanterns (db), "N people are looking at this sky" (room presence),
   sending light to another lantern, with the owner notified live.
3. **Cinematic:** letterbox opening, title card, film grain, vignette, real moon phase,
   time/coordinate HUD styled like a timecode.
4. **Profit:** ad slots that fit the mood: (a) a "Constellation ad" in the sky,
   (b) a sponsor credit in the film credits ("Presented by"), (c) a booking panel
   with packages. Every ad is labeled "Anzeige" (ad). Sponsor data is configured centrally in `SPONSOR`.

## Constraints / Boundaries
- Always: the scene works without db/room (demo lanterns clearly labeled "Beispiel" (example)).
- Always: user text only via textContent, max. 120 characters.
- Always: respect prefers-reduced-motion; sound only after a click.
- Never: autoplay audio, ads that cover content or pop up, fake brand names.
- Never: external ad scripts (the artifact CSP forbids them). Real ad networks
  require hosting the page yourself; the slots are prepared for that.

## Data model (db)
`lanterns/{userId}`: `{ text, hue, at }`; each person has one lantern (the last one),
everyone reads, only the author writes, and the owner moderates.

## Testing
Playwright: page loads with no console errors, canvas renders, release flow works
locally (demo mode), mobile width 400px without horizontal scroll.
