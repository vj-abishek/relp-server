module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
  },
  extends: ["airbnb-base"],
  parserOptions: {
    ecmaVersion: 12,
  },
  rules: {
    "global-require": "off",
    "no-console": "off",
    "no-underscore-dangle": "off",
    "no-restricted-syntax": "off",
    "no-await-in-loop": "off",
  },
};
