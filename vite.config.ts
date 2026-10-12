/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import { defineConfig, type PluginOption } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/*
 * Two build modes:
 *   vite build                  → dist/, installable PWA with hash routing (default)
 *   vite build --mode artifact  → dist-artifact/, relative paths, no service worker; scripts/build-artifact.mjs
 *                                 then inlines it into a single page for publishing as a claude.ai Artifact.
 */
export default defineConfig(({ mode }) => {
  const artifact = mode === 'artifact'
  const plugins: PluginOption[] = [react(), tailwindcss()]
  if (!artifact) {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'EDPT Trainer',
          short_name: 'EDPT',
          description: 'Unofficial study app for the Electronic Data Processing Test',
          theme_color: '#0f172a',
          background_color: '#0f172a',
          display: 'standalone',
          start_url: '/',
          icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }],
        },
        workbox: { globPatterns: ['**/*.{js,css,html,svg,woff2}'] },
      }),
    )
  }
  return {
    base: artifact ? './' : '/',
    plugins,
    define: { 'import.meta.env.VITE_ARTIFACT': JSON.stringify(artifact ? '1' : '') },
    resolve: artifact ? { alias: { 'virtual:pwa-register': fileURLToPath(new URL('./src/pwa-stub.ts', import.meta.url)) } } : undefined,
    build: {
      outDir: artifact ? 'dist-artifact' : 'dist',
      chunkSizeWarningLimit: 800,
      modulePreload: artifact ? false : undefined,
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      setupFiles: ['./src/test-setup.ts'],
    },
  }
})
