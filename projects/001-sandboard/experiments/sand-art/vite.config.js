import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5174, strictPort: true },
  build: { rolldownOptions: { input: {
    home: fileURLToPath(new URL('./home/index.html', import.meta.url)),
    gallery: fileURLToPath(new URL('./gallery/index.html', import.meta.url)),
    studio: fileURLToPath(new URL('./index.html', import.meta.url)),
    research: fileURLToPath(new URL('./research/index.html', import.meta.url)),
    stage: fileURLToPath(new URL('./stage/index.html', import.meta.url)),
    atelier: fileURLToPath(new URL('./atelier/index.html', import.meta.url)),
    memories: fileURLToPath(new URL('./memories/index.html', import.meta.url)),
    hands: fileURLToPath(new URL('./memories/hands/index.html', import.meta.url)),
    contact: fileURLToPath(new URL('./memories/hands/contact/index.html', import.meta.url)),
    cup: fileURLToPath(new URL('./memories/hands/contact/cup/index.html', import.meta.url)),
    composition: fileURLToPath(new URL('./memories/keepsake/composition/index.html', import.meta.url)),
    sandlight: fileURLToPath(new URL('./memories/keepsake/sandlight/index.html', import.meta.url)),
    handwork: fileURLToPath(new URL('./memories/keepsake/handwork/index.html', import.meta.url)),
    natural: fileURLToPath(new URL('./memories/keepsake/natural/index.html', import.meta.url)),
    keepsake: fileURLToPath(new URL('./memories/keepsake/index.html', import.meta.url)),
  } } },
})
