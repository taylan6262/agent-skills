/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

// Gleiche Sicherheits-Header wie in vercel.json / netlify.toml, damit Preview und E2E-Tests
// unter Produktionsbedingungen laufen (keine externen Requests, keine Inline-Skripte).
const securityHeaders = {
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'self'; manifest-src 'self'; worker-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};

const iconSizes = [48, 72, 96, 128, 144, 152, 192, 256, 384, 512];

export default defineConfig(({ mode }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    VitePWA({
      // Im Artifact-Build (eingebettete Vorschau auf claude.ai) sind Service Worker nicht erlaubt.
      disable: mode === 'artifact',
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png', 'robots.txt'],
      manifest: {
        id: '/',
        name: 'Merkwerk – Denkspiele',
        short_name: 'Merkwerk',
        description:
          'Trainiere dein visuelles Gedächtnis, dein Tempo und dein Wissen – mit kurzen Denkspielen, offline und ohne Konto.',
        lang: 'de',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#F4EEE1',
        theme_color: '#F4EEE1',
        categories: ['education', 'games'],
        icons: [
          ...iconSizes.map((size) => ({
            src: `/icons/icon-${size}.png`,
            sizes: `${size}x${size}`,
            type: 'image/png',
            purpose: 'any',
          })),
          {
            src: '/icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest,txt}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  resolve: {
    alias: (mode === 'artifact'
      ? {
          'virtual:pwa-register/react': fileURLToPath(
            new URL('./src/pwa-stub.ts', import.meta.url),
          ),
        }
      : {}) as Record<string, string>,
  },
  build: {
    target: 'es2022',
    sourcemap: true,
    chunkSizeWarningLimit: mode === 'artifact' ? 1200 : 400,
    ...(mode === 'artifact'
      ? { sourcemap: false, rollupOptions: { output: { inlineDynamicImports: true } } }
      : {}),
  },
  preview: {
    headers: securityHeaders,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
