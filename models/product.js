var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
var setting = require('../setting.js');
mongoose.connect('mongodb://localhost/'+setting.database);

var ProductSchema = new mongoose.Schema({
    ProductId: String,
    ASIN: String,
    URL: String,
    ProductName: String,
    SalesRank: String,
    ProductImage: String,
    ProductImageSet: [mongoose.Schema.Types.Mixed],
    Brand: String,
    Manufactor: String,
    EAN: String,
    Description: String,
    DescriptionCN: String,
    Price: String,
    PriceCurrency: String,
    Title: String,
    TitleCN: String,
    ShopName: String,
    Category: String,
    LastproductChange: String,
    DeliveryTime: String,
    Keywords: String,
    Source: String,
    Tranlated: { type: Boolean, default: false },
	updated_at: { type: Date, default: Date.now }
});

ProductSchema.plugin(textSearch);

module.exports = mongoose.model('Product', ProductSchema);
