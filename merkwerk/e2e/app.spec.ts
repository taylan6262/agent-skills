import { expect, test, type Page } from '@playwright/test';

/** Sammelt Konsolenfehler und -warnungen sowie Laufzeitfehler einer Seite. */
function watchConsole(page: Page): string[] {
  const problems: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning')
      problems.push(`${message.type()}: ${message.text()}`);
  });
  page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`));
  return problems;
}

async function waitForSplash(page: Page): Promise<void> {
  await expect(page.getByTestId('splash')).toHaveCount(0, { timeout: 5000 });
}

/** Spielt eine Blitzbild-Runde fehlerfrei: Positionen während der Anzeige aus den Feldbeschriftungen lesen. */
async function playBlitzbildRound(page: Page): Promise<void> {
  await page.locator('.blitzbild[data-phase="show"]').waitFor();
  const labels = await page
    .locator('.cell')
    .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('aria-label') ?? ''));
  const filled = labels.flatMap((label, index) => (label.endsWith(': leer') ? [] : [index]));
  await page.locator('.blitzbild[data-phase="recall"]').waitFor({ timeout: 8000 });
  for (const index of filled) await page.locator('.cell').nth(index).click();
  await page.getByRole('button', { name: 'Prüfen' }).click();
  await page.getByRole('button', { name: /Nächste Runde|Zum Ergebnis/ }).click();
}

async function seedSave(page: Page, save: object): Promise<void> {
  await page.addInitScript((data) => {
    if (sessionStorage.getItem('e2e-seeded')) return;
    sessionStorage.setItem('e2e-seeded', '1');
    localStorage.setItem('merkwerk.spielstand', JSON.stringify(data));
  }, save);
}

test('Onboarding, Level 1 spielen, Ergebnis – Fortschritt bleibt nach dem Neuladen', async ({
  page,
}) => {
  const problems = watchConsole(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/willkommen$/);
  await waitForSplash(page);

  // Schritt 1: Willkommen
  await expect(
    page.getByRole('heading', { level: 1, name: 'Willkommen in der Werkstatt.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Weiter' }).click();

  // Schritt 2: Einstufungstest – erste Folge richtig, zweite absichtlich falsch
  await expect(
    page.getByRole('heading', { level: 1, name: 'Kurzer Einstufungstest' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Test starten' }).click();
  const seen: string[] = [];
  while ((await page.locator('.keypad').count()) === 0) {
    const fresh = page.locator('.digit-big:not([data-e2e])');
    if (await fresh.count()) {
      // Jede Ziffer ist ein neues Element; gelesene Elemente werden markiert.
      const text = await fresh
        .first()
        .evaluate((el) => {
          el.setAttribute('data-e2e', '1');
          return el.textContent;
        })
        .catch(() => '');
      if (text) seen.push(text);
    }
    await page.waitForTimeout(30);
  }
  expect(seen).toHaveLength(3);
  for (const d of seen) await page.keyboard.press(d);
  await page.keyboard.press('Enter');
  await page.locator('.keypad').waitFor({ timeout: 10000 });
  for (let i = 0; i < 4; i++) await page.keyboard.press('0');
  await page.getByRole('button', { name: 'Eingabe prüfen' }).click();
  await expect(page.getByText('3', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Weiter' }).click();

  // Schritt 3: Einstellungen und Start
  await expect(page.getByRole('heading', { level: 1, name: 'Fast geschafft.' })).toBeVisible();
  await page.getByRole('button', { name: 'Los geht’s' }).click();
  await expect(page).toHaveURL(/\/$/);

  // Level 1 starten und fehlerfrei spielen
  await page.getByRole('button', { name: 'Erstes Level starten' }).click();
  await expect(page).toHaveURL(/\/level\/w1-1$/);
  await page.getByRole('button', { name: 'Level starten' }).click();
  for (let round = 0; round < 3; round++) await playBlitzbildRound(page);

  // Ergebnis
  await expect(page).toHaveURL(/\/ergebnis$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Meisterhaft' })).toBeVisible();
  await expect(page.getByRole('img', { name: '3 von 3 Sternen' })).toBeVisible();
  await expect(page.getByText('Erster Schritt')).toBeVisible();
  // Genau eine Runde verbucht – kein doppeltes Speichern
  const stored = await page.evaluate(
    () =>
      JSON.parse(localStorage.getItem('merkwerk.spielstand') ?? '{}') as {
        player: { gamesPlayed: number };
        levels: Record<string, { plays: number; stars: number }>;
      },
  );
  expect(stored.player.gamesPlayed).toBe(1);
  expect(stored.levels['w1-1']).toMatchObject({ plays: 1, stars: 3 });
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page).toHaveURL(/\/level\/w1-2$/);

  // Neu laden: Fortschritt ist noch da
  await page.reload();
  await page.goto('/karte');
  await expect(
    page.getByRole('link', { name: /Level 1, Blitzbild, 3 von 3 Sternen/ }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: /Level 2, Zahlenspur/ })).toBeVisible();
  await page.goto('/');
  await expect(page.locator('.streak-block .numeral')).toHaveText('1');

  expect(problems).toEqual([]);
});

test('Offline: nach dem ersten Besuch startet die App ohne Netz mit Spielstand', async ({
  page,
  context,
}) => {
  const problems = watchConsole(page);
  await seedSave(page, { version: 2, onboardingDone: true, levels: { 'w1-1': { stars: 2 } } });
  await page.goto('/');
  await waitForSplash(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  // Seite einmal unter Kontrolle des Service Workers laden, dann offline gehen
  await page.reload();
  await expect
    .poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null))
    .toBe(true);

  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await page.goto('/karte');
  await expect(
    page.getByRole('link', { name: /Level 1, Blitzbild, 2 von 3 Sternen/ }),
  ).toBeVisible();
  await page.goto('/statistik');
  await expect(page.getByRole('heading', { level: 1, name: 'Statistik' })).toBeVisible();
  await context.setOffline(false);

  expect(problems.filter((p) => !p.includes('net::ERR_INTERNET_DISCONNECTED'))).toEqual([]);
});

test('Alle fünf Modi lassen sich bis zum Ergebnis spielen – ohne Konsolenfehler', async ({
  page,
}) => {
  const problems = watchConsole(page);
  await page.clock.install();
  await seedSave(page, { version: 2, onboardingDone: true });
  await page.goto('/');
  await waitForSplash(page);

  // Blitzbild
  await page.goto('/spiel/training/blitzbild');
  for (let round = 0; round < 3; round++) await playBlitzbildRound(page);
  await expect(page).toHaveURL(/\/ergebnis$/);

  // Detailblick: jeweils erste Antwort wählen
  await page.goto('/spiel/training/detailblick');
  for (let i = 0; i < 20; i++) {
    await page.locator('.option').first().click({ timeout: 15000 });
    const next = page.getByRole('button', { name: /Nächste Frage|Nächste Szene|Zum Ergebnis/ });
    const label = await next.textContent();
    await next.click();
    if (label?.includes('Ergebnis')) break;
  }
  await expect(page).toHaveURL(/\/ergebnis$/);

  // Zahlenspur: jeweils eine Ziffernfolge eingeben (Treffer nicht nötig)
  await page.goto('/spiel/training/zahlenspur');
  for (let trial = 0; trial < 5; trial++) {
    await page.locator('.keypad').waitFor({ timeout: 20000 });
    const slots = await page.locator('.slot').count();
    for (let i = 0; i < slots; i++) await page.keyboard.press(String(i % 10));
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: /Nächste Folge|Zum Ergebnis/ }).click();
  }
  await expect(page).toHaveURL(/\/ergebnis$/);

  // Tempo-Duell: einige Antworten, dann die Uhr vorspulen
  await page.goto('/spiel/training/tempo');
  await page.locator('.tempo[data-phase="running"]').waitFor({ timeout: 10000 });
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press(i % 2 ? 'ArrowLeft' : 'ArrowRight');
    await page.waitForTimeout(150);
  }
  await page.clock.fastForward(31_000);
  await expect(page).toHaveURL(/\/ergebnis$/, { timeout: 10000 });

  // Wissensrunde: per Taste 1 antworten
  await page.goto('/spiel/training/wissen');
  for (let i = 0; i < 10; i++) {
    await page.locator('.option').first().waitFor();
    await page.keyboard.press('1');
    const next = page.getByRole('button', { name: /Nächste Frage|Zum Ergebnis/ });
    const label = await next.textContent();
    await next.click();
    if (label?.includes('Ergebnis')) break;
  }
  await expect(page).toHaveURL(/\/ergebnis$/);
  await expect(page.getByText('Wissensrunde · Stufe')).toBeVisible();

  expect(problems).toEqual([]);
});

test('Zurück-Navigation funktioniert mit App-Knopf und Browser-Zurück', async ({ page }) => {
  await seedSave(page, { version: 2, onboardingDone: true });
  await page.goto('/');
  await waitForSplash(page);
  await page.getByRole('link', { name: 'Karte', exact: true }).click();
  await expect(page).toHaveURL(/\/karte$/);
  await page.getByRole('link', { name: /Level 1, Blitzbild/ }).click();
  await expect(page).toHaveURL(/\/level\/w1-1$/);
  await page.getByRole('button', { name: 'Level starten' }).click();
  await expect(page).toHaveURL(/\/spiel\/level\/w1-1$/);

  await page.goBack();
  await expect(page).toHaveURL(/\/level\/w1-1$/);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(page).toHaveURL(/\/karte$/);
  await page.goBack();
  await expect(page).toHaveURL(/\/$/);

  // Pause-Menü: Beenden führt zurück zum Level-Intro
  await page.goto('/level/w1-1');
  await page.getByRole('button', { name: 'Level starten' }).click();
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('dialog', { name: 'Pause' })).toBeVisible();
  await page.getByRole('button', { name: 'Beenden' }).click();
  await expect(page).toHaveURL(/\/level\/w1-1$/);
});

test('Bei 360 px Breite gibt es auf keinem Bildschirm horizontales Scrollen', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await seedSave(page, { version: 2, onboardingDone: true });
  await page.goto('/');
  await waitForSplash(page);
  const routes = [
    '/',
    '/karte',
    '/level/w1-1',
    '/training',
    '/statistik',
    '/erfolge',
    '/einstellungen',
    '/impressum',
    '/datenschutz',
    '/willkommen?schritt=3',
    '/spiel/training/zahlenspur',
  ];
  for (const route of routes) {
    await page.goto(route);
    await page.waitForTimeout(400);
    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width, route).toBeLessThanOrEqual(360);
  }
});

test('Defekter Spielstand führt nicht zum Absturz', async ({ page }) => {
  const problems = watchConsole(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('e2e-broken')) return;
    sessionStorage.setItem('e2e-broken', '1');
    localStorage.setItem('merkwerk.spielstand', '{"version": 2, "levels": {"w1-1": ');
  });
  await page.goto('/');
  await waitForSplash(page);
  await expect(page).toHaveURL(/\/willkommen$/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  const backup = await page.evaluate(() => localStorage.getItem('merkwerk.spielstand.sicherung'));
  expect(backup).toContain('"levels"');
  expect(problems).toEqual([]);
});
