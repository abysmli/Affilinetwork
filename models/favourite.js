var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var FavouriteSchema = new mongoose.Schema({
    Username: String,
    ProductEAN: String,
    VoucherId: String,
	updated_at: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Favourite', FavouriteSchema);