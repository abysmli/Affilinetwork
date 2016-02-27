var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var ShopoSchema = new mongoose.Schema({
	ShopId: String,
	ShopTitle: String,
    LogoURL: String,
    ProductCount: String,
    ProgramId: String,
    ShopLink: String,
    LastUpdate: String,
    Usage: String,
	updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shopo', ShopoSchema);