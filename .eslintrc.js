module.exports = {
  env: {
    "commonjs": true,
    "es6": true,
    "node": true
  },
  "parser": "babel-eslint",
  "extends": "airbnb",
  parserOptions: {
    "sourceType": "module"
  },
  plugins: [
    "import"
  ],
  rules: {
    "no-console": ["off"],
    "import/no-unresolved": ["off"],
    "consistent-return": 1,
    "no-underscore-dangle": 1,
    "camelcase": 1,
    "no-restricted-globals": 1,
    "react/require-default-props": 1,
    "class-methods-use-this": 1,
    "import/extensions": 0,
  },
  globals: {
    isNaN: true,
    location: true,
  }
};
