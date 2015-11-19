var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var CategorySchema = new mongoose.Schema({
    Category: String,
	updated_at: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Category', CategorySchema);
