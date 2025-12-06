const globals = require("globals");
const js = require("@eslint/js");

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        ...globals.jest,
        ...globals.node
      },
    },
    rules: {
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "no-console": "off", // It's a CLI/Extension, console is useful
      "no-undef": "error"
    },
    ignores: [
        "node_modules/",
        "dist/",
        "coverage/",
        "*.min.js"
    ]
  }
];
