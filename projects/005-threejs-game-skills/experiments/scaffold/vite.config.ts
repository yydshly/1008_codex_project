import { defineConfig } from 'vite';

export default defineConfig({
  // 本地研究副本：独立入口与汇总子路径均使用相对资源。
  base: './',
  server: {
    host: '127.0.0.1',
    port: 5188,
    strictPort: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4188,
    strictPort: true,
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 900,
  },
});
