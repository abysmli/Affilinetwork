module.exports = (function() {
    function _Class() {}

    _Class.prototype.findByEAN = function findByEAN(product, EAN) {
        for (var i = 0; i < product.length; i++) {
            if (product[i].EAN === EAN) {
                return product[i];
            }
        }
        return 0;
    }

    _Class.prototype.fromAmazonToLocalProduct = function fromAmazonToLocalProduct(product) {
        var _product = {};
        if (product !== undefined && product.OfferSummary !== undefined) {
            if (product.OfferSummary.TotalNew !== "0") {
                var _images = [];
                if (product.ImageSets !== undefined && Array.isArray(product.ImageSets.ImageSet)) {
                    product.ImageSets.ImageSet.forEach(function(image) {
                        _images.push(image.LargeImage.URL);
                    });
                }
                _product = {
                    ProductId: product.ProductId || null,
                    ASIN: product.ASIN || null,
                    URL: product.DetailPageURL || null,
                    ProductName: product.ProductName || null,
                    SalesRank: product.SalesRank || null,
                    ProductImage: (product.LargeImage !== undefined) ? product.LargeImage.URL || null : null,
                    ProductImageSet: _images,
                    Brand: (product.ItemAttributes !== undefined) ? product.ItemAttributes.Brand || null : null,
                    Manufactor: (product.ItemAttributes !== undefined) ? product.ItemAttributes.Manufacturer || null : null,
                    EAN: (product.ItemAttributes !== undefined) ? product.ItemAttributes.EAN || null : null,
                    Description: (product.ItemAttributes !== undefined) ? product.ItemAttributes.Feature || null : null,
                    DescriptionCN: null,
                    Price: (product.Offers.Offer !== undefined) ? (product.Offers.Offer.OfferListing.Price.Amount / 100 || null) : (product.OfferSummary.LowestNewPrice.Amount / 100 || null),
                    PriceCurrency: (product.OfferSummary !== undefined) ? product.OfferSummary.LowestNewPrice.CurrencyCode || null : null,
                    Title: (product.ItemAttributes !== undefined) ? product.ItemAttributes.Title || null : null,
                    TitleCN: null,
                    ShopName: "Amazon",
                    Category: null,
                    LastProductChange: null,
                    DeliveryTime: null,
                    Keywords: null,
                    Source: "Amazon",
                    Tranlated: false,
                };
            }
        }
        return _product;
    }

    _Class.prototype.fromAffilinetToLocalProduct = function fromAffilinetToLocalProduct(product) {
        var _product = {
            ProductId: product.ProductId || null,
            ASIN: null,
            URL: product.Deeplink1 || null,
            ProductName: product.ProductName || null,
            SalesRank: null,
            ProductImage: (product.Images[0][0] !== undefined) ? product.Images[0][0].URL || null : null,
            ProductImageSet: [(product.Images[0][0] !== undefined) ? product.Images[0][0].URL || null : null],
            Brand: product.Brand || null,
            Manufactor: product.Manufacturer || null,
            EAN: product.EAN || null,
            Description: "" + product.DescriptionShort || null + " " + product.Description || null,
            DescriptionCN: null,
            Price: (product.Images[0][0] !== undefined) ? product.PriceInformation.PriceDetails.Price || null : null,
            PriceCurrency: (product.Images[0][0] !== undefined) ? product.PriceInformation.Currency || null : null,
            Title: product.ProductName || null,
            TitleCN: null,
            ShopName: product.ShopTitle || null,
            Category: null,
            LastProductChange: product.LastProductChange || null,
            DeliveryTime: product.DeliveryTime || null,
            Keywords: product.Keywords || null,
            Source: "Affilinet",
            Tranlated: false,
        };
        return _product;
    }

    _Class.prototype.isEmptyObject = function isEmptyObject(obj) {
        return JSON.stringify(obj) === '{}';
    }

    _Class.prototype.ToLocalProducts = function ToLocalProducts(products, type) {
        var self = this;
        var _products = [];
        if (products) {
            products.forEach(function(product) {
                var _product = {};
                (type == "amazon") ? _product = self.fromAmazonToLocalProduct(product): _product = self.fromAffilinetToLocalProduct(product);
                if (!self.isEmptyObject(_product)) {
                    _products.push(_product);
                }
            });
        }
        return _products;
    }

    _Class.prototype.checkMobile = function checkMobile(req) {
        var MobileDetect = require('mobile-detect');
        var md = new MobileDetect(req.headers['user-agent']);
        var ismobile = false;
        if ( md.mobile() ) {
            ismobile = true;
        }
        return ismobile;
    }

    _Class.prototype.urlToCategory = function urlToCategory(url) {
        if ( url == "clothing_shoes") {
            return "服装鞋子";
        } else if ( url == "food") {
            return "食品饮食";
        } else if ( url == "kitchenware") {
            return "厨房用具";
        } else if ( url == "electronic_product") {
            return "电子产品";
        } else if ( url == "maternal") {
            return "母婴";
        } else if ( url == "cosmetic") {
            return "化妆品";
        } else if ( url == "health") {
            return "健康保健";
        } else if ( url == "tourism") {
            return "旅游";
        } else if ( url == "home_appliances") {
            return "小家电";
        } else if ( url == "jewelry_watches") {
            return "钟表手饰";
        } else if ( url == "office") {
            return "办公";
        } else if ( url == "other") {
            return "其他";
        } else {
            return url;
        }
    }

    return _Class;
})();
