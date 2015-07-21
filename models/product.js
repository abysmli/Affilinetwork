var mongoose = require('mongoose');
var setting = require('../setting.js');

mongoose.connect('mongodb://localhost/'+setting.database);

var ProductSchema = new mongoose.Schema({
    LastShopUpdate: String,
    LastProductChange: String,
    Score: Number,
	ProductId: Number,
	ArticleNumber: String,
    ShopId: Number,
    ShopTitle: String,
    ProductName: String,
    ProductName_cn: { type: String, default: "" },
	Description: String,
    Description_cn: { type: String, default: "" },
    DescriptionShort: String,
    DescriptionShort_cn: { type: String, default: "" },
    ShopCategoryId: Number,
    AffilinetCategoryId: Number,
    ShopCategoryPath: String,
    AffilinetCategoryPath: String,
    ShopCategoryIdPath: String,
    AffilinetCategoryIdPath: String,
    Availability: String,
    DeliveryTime: String,
    Deeplink1: String,
    Deeplink2: String,
    Brand: String,
    Manufacturer: String,
    Distributor: String,
    EAN: String,
    Keywords: String,
    ProgramId: Number,
    PriceInformation: {
        Currency: String,
        DisplayPrice: String,
        DisplayShipping: String,
        DisplayBasePrice: String,
        PriceDetails: {
            PriceOld: Number,
            PricePrefix: String,
            Price: Number,
            PriceSuffix: String,
        },
        ShippingDetails: {
            ShippingPrefix: String,
            Shipping: Number,
            ShippingSuffix: String,
        },
        BasePriceDetails: {
            BasePricePrefix: String,
            BasePrice: Number,
            BasePriceSuffix: String,
        }
    },
    Images: [mongoose.Schema.Types.Mixed],
    Logos: [mongoose.Schema.Types.Mixed],
    Properties: [mongoose.Schema.Types.Mixed],
	Tranlated: { type: Boolean, default: false },
	updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', ProductSchema);