import { defineConfig } from "vitest/config";

// The default run covers the pure unit tests only. The security-rule tests
// need the Firestore emulator, so they live behind `npm run test:rules` and
// their own config — otherwise `npm test` fails on any machine without it.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
  },
});
