var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var RequestSchema = new mongoose.Schema({
    name: String,
    email: String,
    description: String,
    image: String,
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Request', RequestSchema);

