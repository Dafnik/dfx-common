import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./projects/dfx-qrcode/vitest.setup.ts'],
    environment: 'jsdom',
  },
});
