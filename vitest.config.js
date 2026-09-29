import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    coverage: {
      provider: 'v8',
      // Emit lcov for SonarCloud plus a readable summary locally.
      reporter: ['text', 'lcov'],
      reportsDirectory: 'coverage',
      // Measure only the code that currently has tests. As more of the theme
      // is extracted into tested modules, widen this include list.
      include: ['src/**/*.js']
    }
  }
});
