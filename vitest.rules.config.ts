import { defineConfig } from "vitest/config";

// Rules tests talk to the Firestore emulator, so they run separately from the
// unit tests and need a longer timeout and no parallelism.
export default defineConfig({
  test: {
    include: ["test/rules.test.mjs"],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
