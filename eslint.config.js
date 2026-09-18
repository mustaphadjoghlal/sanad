import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "public/**/*.js"] },

  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,

      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],

      // The typecheck already reports unused values; keep lint focused on
      // what types cannot see.
      "@typescript-eslint/no-unused-vars": "off",

      // This is an RTL Arabic site: the a11y plugin's English-centric
      // heuristics for link text and autofocus are noise here.
      "jsx-a11y/anchor-is-valid": "off",
      "jsx-a11y/no-autofocus": "off",

      // The only <audio> on the site plays a voice-over sample the artist
      // uploaded. There is no caption track to attach, and demanding one
      // would only invite a fake empty <track>.
      "jsx-a11y/media-has-caption": "off",
    },
  },

  // The route table exports lazy components on purpose; fast refresh has
  // nothing to say about it.
  {
    files: ["src/app/routes.tsx"],
    rules: { "react-refresh/only-export-components": "off" },
  },

  // Node scripts and serverless functions.
  {
    files: ["api/**/*.js", "scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: { globals: globals.node },
    rules: { "@typescript-eslint/no-unused-vars": "off" },
  },
);
