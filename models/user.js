var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var UserSchema = new mongoose.Schema({
    name: String,
    password: String,
    appid: String,
    appsecret: String,
    admin: Boolean
});

module.exports = mongoose.model('User', UserSchema);