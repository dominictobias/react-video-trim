import react from '@vitejs/plugin-react'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const reactExternal = [
  'react',
  'react-dom',
  'react/jsx-runtime',
  'react/jsx-dev-runtime',
]

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6354,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    lib: {
      entry: {
        'react-video-trim': resolve(import.meta.dirname, 'src/lib/index.ts'),
        'plugins/webcodecs': resolve(
          import.meta.dirname,
          'src/lib/plugins/webcodecs.ts',
        ),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
      cssFileName: 'react-video-trim',
    },
    rolldownOptions: {
      external: (id: string) =>
        reactExternal.some(
          (dependency) => id === dependency || id.startsWith(`${dependency}/`),
        ),
    },
  },
})
