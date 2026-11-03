# Plan: Abendlicht

Vertical slices, each one verifiable on its own:

1. **Scene** — canvas: sky gradient, stars, moon (computed phase), hills, lake with reflection, grain.
   ✔ Check: screenshot shows a night scene, 60fps with no errors.
2. **Cinematic shell** — letterbox opening, title card, HUD (time, moon phase, coordinates).
   ✔ Check: title fades in, layout holds at 400px.
3. **Lanterns local** — release form, rising animation, card when tapped, demo lanterns.
   ✔ Check: releasing → lantern visible, card opens.
4. **Connection** — db subscribe/write, room presence counter, sending light + notification.
   ✔ Check: after publish, `ArtifactData list lanterns`.
5. **Calm** — WebAudio soundscape (water noise + pad), breathing mode.
   ✔ Check: toggle works, no audio before the click.
6. **Monetization** — constellation ad, sponsor credit, "Werbefläche buchen" (book ad space) panel.
   ✔ Check: every ad labeled "Anzeige", nothing covers the content.
7. **Review & ship** — a11y (focus, aria), reduced-motion, publish.
