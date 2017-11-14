var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var ProductSchema = new mongoose.Schema({
    ProductId: String, //1
    ASIN: String, //1
    URL: String,//1
    ShortURL: String, //1
    ProductName: String, //1
    SalesRank: Number, //2
    ProductImage: String, //2
    ProductImageSet: [mongoose.Schema.Types.Mixed], //2
    Brand: String, //2
    Manufactor: String, //2
    EAN: String, //2
    PZN: String, //2
    Description: String, //2
    DescriptionCN: String, //2
    Price: Number, //1
    PriceCurrency: String, //1
    Shipping: Number, //1
    Title: String, //2
    TitleCN: String, //2
    ShopName: String, //1
    ShopId: String, //1
    Category: { type: String, default: "null" }, //2
    Weight: String, //2
    ItemDimensions: mongoose.Schema.Types.Mixed, //2
    PackageDimensions: mongoose.Schema.Types.Mixed, //2
    LastProductChange: String, //1
    DeliveryTime: String, //1
    Keywords: String, //2
    Source: String, //1
    TranslateUtil: String, //2
    TranslationQuality: String, //2
    Views: { type: Number, default: 0 }, //2
    Sales: { type: Number, default: 0 }, //2
    SearchCount: {type: Number, default: 0}, //2
    Translated: { type: Boolean, default: false }, //2
    Activity: { type: Boolean, default: true }, //2
    Hot: {type: Boolean, default: false }, //2
    insert_at: {type: Date, default: Date.now},
	updated_at: { type: Date, default: Date.now }
});

ProductSchema.index({Title: 'text', TitleCN: 'text', Description: 'text', DescriptionCN:'text', });

module.exports = mongoose.model('Product', ProductSchema);
