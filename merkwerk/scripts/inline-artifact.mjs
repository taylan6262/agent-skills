// Baut aus dist-artifact/ eine einzelne HTML-Datei für die Vorschau als claude.ai-Artifact:
// JS und CSS werden eingebettet, Schriften als data-URI. Aufruf: npm run build:artifact
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist-artifact');
const html = await readFile(join(dist, 'index.html'), 'utf8');

const scriptSrc = /<script type="module" crossorigin src="([^"]+)"><\/script>/.exec(html)?.[1];
const styleHref = /<link rel="stylesheet" crossorigin href="([^"]+)">/.exec(html)?.[1];
if (!scriptSrc || !styleHref) throw new Error('Skript oder Stylesheet im Build nicht gefunden');

let css = await readFile(join(dist, styleHref.replace(/^\//, '')), 'utf8');
const fontUrls = [
  ...new Set([...css.matchAll(/url\((['"]?)(\/fonts\/[^'")]+)\1\)/g)].map((m) => m[2])),
];
for (const url of fontUrls) {
  const data = await readFile(join(root, 'public', url));
  css = css.split(url).join(`data:font/woff2;base64,${data.toString('base64')}`);
}

let js = await readFile(join(dist, scriptSrc.replace(/^\//, '')), 'utf8');
// Inline-Skript darf weder "</script" noch "<!--" enthalten.
js = js.replaceAll('</script', '<\\/script').replaceAll('<!--', '<\\!--');

const page = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Merkwerk</title>
<meta name="description" content="Denkspiele für visuelles Gedächtnis, Tempo, Lernen und Wissen.">
<style>${css}</style>
</head>
<body>
<div id="root"></div>
<noscript><p>Merkwerk braucht JavaScript.</p></noscript>
<script type="module">${js}</script>
</body>
</html>
`;
await writeFile(join(dist, 'merkwerk.html'), page);
console.log(
  `merkwerk.html: ${(page.length / 1024).toFixed(0)} KB, ${fontUrls.length} Schriften eingebettet`,
);
