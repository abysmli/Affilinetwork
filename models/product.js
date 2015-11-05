var mongoose = require('mongoose');
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
    LastproductChange: String,
    DeliveryTime: String,
    Keywords: String,
    Source: String,
    Tranlated: { type: Boolean, default: false },
	updated_at: { type: Date, default: Date.now }
});


module.exports = mongoose.model('Product', ProductSchema);
