var stormpath = require('stormpath');
var setting = require('../setting.js');

var apiKey = new stormpath.ApiKey(setting.stormpath_setting.API_KEY_ID, setting.stormpath_setting.API_KEY_SECRET);

var client = new stormpath.Client({
    apiKey: apiKey
});

module.exports = client;