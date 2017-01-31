var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var ScanSchema = new mongoose.Schema({
    FromUser: String,
    Ean: String,
    Result: String,
    Type: String,
    insert_at: {type: Date, default: Date.now}
});

module.exports = mongoose.model('Scan', ScanSchema);