module.exports = {
  // start with google standard style
  //     https://github.com/google/eslint-config-google/blob/master/index.js
  "extends": ["eslint:recommended", "google"],
  "env": {
    "node": true,
    "es6": true
  },
  "parserOptions": {
    "ecmaVersion": 8,
    "ecmaFeatures": {
      "jsx": false,
      "experimentalObjectRestSpread": false
    },
    "sourceType": "script"
  },
  "rules": {
    // 2 == error, 1 == warning, 0 == off
    "indent": [2, 2, {
      "SwitchCase": 1,
      "VariableDeclarator": 2,
      "MemberExpression": 1,
      "outerIIFEBody": 0
    }],
    "max-len": [2, 100, {
      "ignoreComments": true,
      "ignoreUrls": true,
      "tabWidth": 2
    }],
    "no-var": 2,
    "no-console": 1,
    "prefer-const": 2,

    // Disable rules
    "comma-dangle": 0,
    "arrow-parens": 0,
    "require-jsdoc": 0
  }
}