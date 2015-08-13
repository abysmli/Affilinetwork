var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    passportLocalMongoose = require('passport-local-mongoose');

var connection = mongoose.createConnection('mongodb://localhost/affilinet');

var Account = new mongoose.Schema({
    username: String,
    password: String
});

Account.plugin(passportLocalMongoose);

module.exports = connection.model('Account', Account);
