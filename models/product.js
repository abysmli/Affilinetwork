var mongoose = require('mongoose');
var textSearch = require('mongoose-text-search');
var setting = require('../setting.js');
mongoose.connect('mongodb://localhost/'+setting.database);

var ProductSchema = new mongoose.Schema({
    ProductId: String,
    ASIN: String,
    URL: String,
    ShortURL: String,
    ProductName: String,
    SalesRank: Number,
    ProductImage: String,
    ProductImageSet: [mongoose.Schema.Types.Mixed],
    Brand: String,
    Manufactor: String,
    EAN: String,
    PZN: String,
    Description: String,
    DescriptionCN: String,
    Price: Number,
    PriceCurrency: String,
    Shipping: Number,
    Title: String,
    TitleCN: String,
    ShopName: String,
    ShopId: String,
    Category: { type: String, default: "null" },
    Weight: String,
    ItemDimensions: mongoose.Schema.Types.Mixed,
    PackageDimensions: mongoose.Schema.Types.Mixed,
    LastProductChange: String,
    DeliveryTime: String,
    Keywords: String,
    Source: String,
    TranslateUtil: String,
    TranslationQuality: String,
    Views: { type: Number, default: 0 },
    Sales: { type: Number, default: 0 },
    SearchCount: {type: Number, default: 0},
    Translated: { type: Boolean, default: false },
    Activity: { type: Boolean, default: true },
    Hot: {type: Boolean, default: false },
    insert_at: {type: Date, default: Date.now},
	updated_at: { type: Date, default: Date.now }
});

ProductSchema.plugin(textSearch);

ProductSchema.index({Title: 'text'});

module.exports = mongoose.model('Product', ProductSchema);
