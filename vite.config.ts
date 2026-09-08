import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // NOTE: Deliberately minimal manual chunking here. Rolldown's
        // manualChunks (and its native codeSplitting.groups equivalent)
        // will, by default, pull each matched module's *own* recursive
        // dependencies into that same named chunk — including shared deps
        // like `react` that an earlier/higher-priority group already
        // claimed. That silently duplicates the React runtime (and other
        // shared code) inside vendor bundles like a "vendor-charts" chunk,
        // and can even produce chunk import cycles. Rolldown's *automatic*
        // chunking already dedupes shared modules correctly across lazy
        // route chunks, so we only force a manual grouping for lucide-react
        // icons — they're imported individually across dozens of
        // lazy-loaded route chunks, and without a dedicated chunk Rolldown
        // splits each shared icon into its own tiny file, turning a single
        // page navigation into dozens of extra network round-trips
        // (very noticeable on mobile/WebView).
        manualChunks(id: string) {
          if (id.includes('node_modules') && id.includes('lucide-react')) return 'vendor-icons'
          return undefined
        },
      },
    },
  },
})
