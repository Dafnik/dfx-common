import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./libs/dfx-qrcode/vitest.setup.ts'],
    environment: 'jsdom',
  },
});
