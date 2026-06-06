import { resolve } from 'node:path'
import { defineConfig } from 'vite'

const ffmpegExternal = ['@ffmpeg/ffmpeg', '@ffmpeg/util']

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: {
        'plugins/ffmpeg': resolve(
          import.meta.dirname,
          'src/lib/plugins/ffmpeg.ts',
        ),
        'plugins/media-recorder': resolve(
          import.meta.dirname,
          'src/lib/plugins/media-recorder.ts',
        ),
        'plugins/webcodecs': resolve(
          import.meta.dirname,
          'src/lib/plugins/webcodecs.ts',
        ),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rolldownOptions: {
      external: (id: string) =>
        ffmpegExternal.some(
          (dependency) => id === dependency || id.startsWith(`${dependency}/`),
        ),
    },
  },
})
