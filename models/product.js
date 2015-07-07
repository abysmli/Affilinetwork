var mongoose = require('mongoose');
var setting = require('../setting.js');

mongoose.connect('mongodb://localhost/'+setting.database);

var ProductSchema = new mongoose.Schema({
	product_id: Number,
	article_num: Number,
	ean: Number,
	title: String,
    brand: String,
	shop_name: String,
	desc_cn: String,
    desc_de_short: String,
    desc_de: String,
	price: String,
	shipping: String,
	link: String,
	category_path: String,
	tranlated: Boolean,
	image: String,
	image90: String,
	updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);