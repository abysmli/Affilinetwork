var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var ShopSchema = new mongoose.Schema({
	ShopId: String,
	ShopTitle: String,
    CustomTitle: String, //default = shoptitle
    CustomTitleCN: String, //default = shoptitle
    Source: String, //options: amazon, affilinet, zanox, ...
    Logo: String,
    LogoURL: String,
    ProductCount: String,
    ProgramId: String,
    ShopLink: String,
    LastUpdate: String,
    CustomContent: String,
    ShipToChina: { type: Boolean, default: false },
    Activity: { type: Boolean, default: false },
	updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Shop', ShopSchema);