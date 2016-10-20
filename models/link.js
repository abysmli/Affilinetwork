var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var LinkSchema = new mongoose.Schema({
    short: String,
    long: String
});

module.exports = mongoose.model('Link', LinkSchema);