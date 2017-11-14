module.exports = {
    "globals": {
        "_": true
    },
    "env": {
        "browser": true,
        "node": true,
        "es6": true,
        "commonjs": true,
        "jquery": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-console": 0,
        "no-unused-vars": ["error", { "vars": "local", "args": "none", "ignoreRestSiblings": false }]
    },
    "parserOptions": {
        "sourceType": "module",
    }
};