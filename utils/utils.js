var Link = require("../models/link");
var MsTranslator = require('mstranslator');
var client = new MsTranslator({
    api_key: "1d77d40d8eec46a180773798ce6cb46b" // use this for the new token API. 
}, true);

module.exports = (function () {
    function _Class() { }

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
                    product.ImageSets.ImageSet.forEach(function (image) {
                        _images.push(image.LargeImage.URL);
                    });
                }
                var ItemDimensions = {
                    Length: (product.ItemAttributes.ItemDimensions !== undefined) ? (product.ItemAttributes.ItemDimensions.Length !== undefined ? Math.round(product.ItemAttributes.ItemDimensions.Length['#'] * 0.0254 * 100) / 100 : null) : null,
                    Width: (product.ItemAttributes.ItemDimensions !== undefined) ? (product.ItemAttributes.ItemDimensions.Width !== undefined ? Math.round(product.ItemAttributes.ItemDimensions.Width['#'] * 0.0254 * 100) / 100 : null) : null,
                    Height: (product.ItemAttributes.ItemDimensions !== undefined) ? (product.ItemAttributes.ItemDimensions.Height !== undefined ? Math.round(product.ItemAttributes.ItemDimensions.Height['#'] * 0.0254 * 100) / 100 : null) : null,
                    Weight: (product.ItemAttributes.ItemDimensions !== undefined) ? (product.ItemAttributes.ItemDimensions.Weight !== undefined ? Math.round(product.ItemAttributes.ItemDimensions.Weight['#'] * 0.00453 * 100) / 100 : null) : null
                };
                var PackageDimensions = {
                    Length: (product.ItemAttributes.PackageDimensions !== undefined) ? (product.ItemAttributes.PackageDimensions.Length !== undefined ? Math.round(product.ItemAttributes.PackageDimensions.Length['#'] * 0.0254 * 100) / 100 : null) : null,
                    Width: (product.ItemAttributes.PackageDimensions !== undefined) ? (product.ItemAttributes.PackageDimensions.Width !== undefined ? Math.round(product.ItemAttributes.PackageDimensions.Width['#'] * 0.0254 * 100) / 100 : null) : null,
                    Height: (product.ItemAttributes.PackageDimensions !== undefined) ? (product.ItemAttributes.PackageDimensions.Height !== undefined ? Math.round(product.ItemAttributes.PackageDimensions.Height['#'] * 0.0254 * 100) / 100 : null) : null,
                    Weight: (product.ItemAttributes.PackageDimensions !== undefined) ? (product.ItemAttributes.PackageDimensions.Weight !== undefined ? Math.round(product.ItemAttributes.PackageDimensions.Weight['#'] * 0.00453 * 100) / 100 : null) : null
                };
                _product = {
                    ProductId: product.ProductId || null,
                    ASIN: product.ASIN || null,
                    URL: product.DetailPageURL || null,
                    ShortURL: this.shortURL(product.DetailPageURL, function (err, shortURL) { }),
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
                    Shipping: null,
                    PriceCurrency: (product.OfferSummary !== undefined) ? product.OfferSummary.LowestNewPrice.CurrencyCode || null : null,
                    Title: (product.ItemAttributes !== undefined) ? product.ItemAttributes.Title || null : null,
                    TitleCN: null,
                    ShopName: "Amazon",
                    ShopId: "-1",
                    Category: null,
                    LastProductChange: null,
                    DeliveryTime: null,
                    Keywords: null,
                    ProgramId: "amazon",
                    Source: "Amazon",
                    Weight: PackageDimensions.Weight || ItemDimensions.Weight || null,
                    ItemDimensions: ItemDimensions,
                    PackageDimensions: PackageDimensions,
                    Translated: false,
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
            ShortURL: this.shortURL(product.Deeplink1, function (err, shortURL) { }),
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
            Shipping: (product.Images[0][0] !== undefined) ? product.PriceInformation.ShippingDetails.Shipping || null : null,
            PriceCurrency: (product.Images[0][0] !== undefined) ? product.PriceInformation.Currency || null : null,
            Title: product.ProductName || null,
            TitleCN: null,
            ShopName: product.ShopTitle || null,
            ShopId: product.ShopId || null,
            Category: null,
            LastProductChange: product.LastProductChange || null,
            DeliveryTime: product.DeliveryTime || null,
            Keywords: product.Keywords || null,
            ProgramId: product.ProgramId || null,
            Source: "Affilinet",
            Weight: null,
            ItemDimensions: null,
            PackageDimensions: null,
            Translated: false,
        };
        return _product;
    }

    _Class.prototype.ShopConverter = function ShopConverter(shop) {
        var _shop = {
            ShopId: shop.ShopId || null,
            ShopTitle: shop.ShopTitle || null,
            CustomTitle: shop.ShopTitle || null,
            CustomTitleCN: shop.ShopTitle || null,
            Source: "Affilinet",
            Logo: "",
            LogoURL: shop.Logo.URL || null,
            ProductCount: shop.ProductCount || null,
            ProgramId: shop.ProgramId || null,
            ShopLink: shop.ShopLink || null,
            ShortURL: shop.ShortURL || null,
            LastUpdate: shop.LastUpdate || null,
            ShipToChina: false,
            Activity: 'activ',
            CustomContent: ""
        };
        return _shop;
    }

    _Class.prototype.isEmptyObject = function isEmptyObject(obj) {
        return JSON.stringify(obj) === '{}';
    }

    _Class.prototype.ToLocalProducts = function ToLocalProducts(products, type) {
        var self = this;
        var _products = [];
        if (products) {
            products.forEach(function (product) {
                var _product = {};
                (type == "amazon") ? _product = self.fromAmazonToLocalProduct(product) : _product = self.fromAffilinetToLocalProduct(product);
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
        if (md.mobile()) {
            ismobile = true;
        }
        return ismobile;
    }

    _Class.prototype.urlToCategory = function urlToCategory(url) {
        if (url == "clothing_shoes") {
            return "服装鞋子";
        } else if (url == "food") {
            return "食品饮食";
        } else if (url == "kitchenware") {
            return "厨房用具";
        } else if (url == "electronic_product") {
            return "电子产品";
        } else if (url == "maternal") {
            return "母婴";
        } else if (url == "cosmetic") {
            return "化妆品";
        } else if (url == "health") {
            return "健康保健";
        } else if (url == "tourism") {
            return "旅游";
        } else if (url == "home_appliances") {
            return "居家用品";
        } else if (url == "jewelry_watches") {
            return "钟表手饰";
        } else if (url == "office") {
            return "办公";
        } else if (url == "other") {
            return "其他";
        } else {
            return url;
        }
    }

    _Class.prototype.syncProductByEAN = function syncProductByEAN(Affilinet, prodAdv, Product, ean, cb) {
        var _this = this;
        var query = {};
        query.FQ = "EAN:" + ean;
        var Time1 = new Date().getTime();
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var _Time1 = new Date().getTime();
                console.log("EAN: " + ean + " | Step 1 time cost: " + (_Time1 - Time1) + "ms");
                var products = _this.ToLocalProducts(results.Products, "affilinet");
                query.FQ = "EAN:0" + ean;
                var Time2 = new Date().getTime();
                Affilinet.searchProducts(query, function (err, response, results) {
                    if (!err && response.statusCode == 200) {
                        var _Time2 = new Date().getTime();
                        console.log("EAN: " + ean + " | Step 2 time cost: " + (_Time2 - Time2) + "ms");
                        var _product = _this.ToLocalProducts(results.Products, "affilinet");
                        if (!_this.isEmptyObject(_product)) {
                            products = products.concat(_product);
                        }
                        var Time3 = new Date().getTime();
                        prodAdv.call("ItemLookup", {
                            ItemId: ean,
                            IdType: "EAN",
                            SearchIndex: "All",
                            ResponseGroup: "Large",
                            MerchantId: "Amazon"
                        }, function (err, product) {
                            if (!err) {
                                var _Time3 = new Date().getTime();
                                console.log("EAN: " + ean + " | Step 3 time cost: " + (_Time3 - Time3) + "ms");
                                var _product = {};
                                if (Array.isArray(product.Items.Item)) {
                                    _product = _this.fromAmazonToLocalProduct(product.Items.Item[0]);
                                } else {
                                    _product = _this.fromAmazonToLocalProduct(product.Items.Item);
                                }
                                if (!_this.isEmptyObject(_product)) {
                                    products.push(_product);
                                }
                                var update_count = 0;
                                if (products.length != 0) {
                                    products.forEach(function (product, index) {
                                        delete product['Brand'];
                                        delete product['Category'];
                                        delete product['Keywords'];
                                        delete product['Translated'];
                                        delete product['DescriptionCN'];
                                        delete product['TitleCN'];
                                        product.EAN != ean ? product.EAN = ean : null;
                                        if (product.EAN.length == 14) {
                                            product.EAN = product.EAN.substr(product.EAN.length - 13);
                                        } else if (product.EAN.length == 12) {
                                            product.EAN = "0" + product.EAN;
                                        }
                                        if (product.Source == "Affilinet") {
                                            _this.shortURL(product.URL, function (err, shorturl) {
                                                product.ShortURL = shorturl;
                                                Product.update({ ProductId: product.ProductId }, product, { upsert: true }, function (err, raw) {
                                                    if (err) {
                                                        console.log("Error occured at saving Affilinet Product into Database: " + JSON.stringify(err));
                                                        return cb(0, 0, true);
                                                    }
                                                    console.log("Affilinet Update Count: " + (update_count + 1) + " | Length: " + products.length);
                                                    if (++update_count == products.length) {
                                                        var Time4 = new Date().getTime();
                                                        _this.updateProductDatabase(Product, products, ean, update_count, function (update_count, deactiv_count) {
                                                            var _Time4 = new Date().getTime();
                                                            console.log("EAN: " + ean + " | Step 4 time cost: " + (_Time4 - Time4) + "ms");
                                                            console.log("EAN: " + ean + " | All Step time cost: " + (_Time4 - Time1) + "ms");
                                                            cb(update_count, deactiv_count, false);
                                                        });
                                                    }
                                                });
                                            });
                                        } else if (product.Source == "Amazon") {
                                            _this.shortURL(product.URL, function (err, shorturl) {
                                                product.ShortURL = shorturl;
                                                Product.update({ ASIN: product.ASIN }, product, { upsert: true }, function (err, raw) {
                                                    if (err) {
                                                        console.log("Error occured at saving Amazon Product into Database: " + JSON.stringify(err));
                                                        return cb(0, 0, true);
                                                    }
                                                    console.log("Amazon Update Count: " + (update_count + 1) + " | Length: " + products.length);
                                                    if (++update_count == products.length) {
                                                        var Time4 = new Date().getTime();
                                                        _this.updateProductDatabase(Product, products, ean, update_count, function (update_count, deactiv_count) {
                                                            var _Time4 = new Date().getTime();
                                                            console.log("EAN: " + ean + " | Step 4 time cost: " + (_Time4 - Time4) + "ms");
                                                            console.log("EAN: " + ean + " | All Step time cost: " + (_Time4 - Time1) + "ms");
                                                            cb(update_count, deactiv_count, false);
                                                        });
                                                    }
                                                });
                                            });
                                        }
                                    });
                                } else {
                                    var Time4 = new Date().getTime();
                                    _this.updateProductDatabase(Product, products, ean, update_count, function (update_count, deactiv_count) {
                                        var _Time4 = new Date().getTime();
                                        console.log("EAN: " + ean + " | Step 4 time cost: " + (_Time4 - Time4) + "ms");
                                        console.log("EAN: " + ean + " | All Step time cost: " + (_Time4 - Time1) + "ms");
                                        cb(update_count, deactiv_count, false);
                                    });
                                }
                            } else {
                                console.log("Error occured at reading Amazon API: " + JSON.stringify(err) + "\nError With EAN: " + ean);
                                cb(0, 0, true);
                            }
                        });
                    } else {
                        console.log("Error occured at reading Affilinet API Step 2: " + JSON.stringify(err) + "\nError With EAN: " + ean);
                        cb(0, 0, true);
                    }
                });
            } else {
                console.log("Error occured at reading Amazon API Step 1: " + JSON.stringify(err) + "\nError With EAN: " + ean);
                cb(0, 0, true);
            }
        });
    }

    _Class.prototype.updateProductDatabase = function updateProductDatabase(Product, products, ean, update_count, cb) {
        Product.findOne({ EAN: ean, Translated: true }, {}, { sort: { 'insert_at': -1 } }, function (err, lastChangedProduct) {
            Product.find({ EAN: ean }, {}, { sort: { 'insert_at': -1 } }, function (err, _products) {
                if (lastChangedProduct == {} || lastChangedProduct == null) {
                    lastChangedProduct = _products[0];
                }
                var product_count = 0,
                    deactiv_count = 0;

                _products.forEach(function (_product, index) {
                    console.log("Database -- Local ProductId: " + _product.ProductId + " | Local ASIN: " + _product.ASIN);
                });
                products.forEach(function (product, index) {
                    console.log("Database -- Remote ProductId: " + product.ProductId + " | Remote ASIN: " + product.ASIN);
                });

                _products.forEach(function (_product, index) {
                    var existFlag = false;
                    products.forEach(function (product, index) {
                        if (((product.ProductId == _product.ProductId) && (_product.ProductId != null) && (_product.ProductId != "null") && (_product.ProductId != "")) || ((product.ASIN == _product.ASIN) && (_product.ASIN != null) && (_product.ASIN != "null") && (_product.ASIN != ""))) {
                            existFlag = true;
                        }
                    });
                    if (_product.Source == "Amazon") {
                        _product.ShopId = "-1";
                    }
                    existFlag ? null : (_product.Activity ? deactiv_count++ : null);
                    _product.Activity = existFlag;
                    _product.Brand = lastChangedProduct.Brand || "";
                    _product.Category = lastChangedProduct.Category || "";
                    _product.Manufactor = lastChangedProduct.Manufactor || "";
                    _product.DescriptionCN = lastChangedProduct.DescriptionCN || "";
                    _product.TitleCN = lastChangedProduct.TitleCN;
                    _product.Weight = lastChangedProduct.Weight || "";
                    _product.ItemDimensions = lastChangedProduct.ItemDimensions || {};
                    _product.PackageDimensions = lastChangedProduct.PackageDimensions || {};
                    _product.Keywords = lastChangedProduct.Keywords || "";
                    _product.Views = lastChangedProduct.Views || 0;
                    _product.Sales = lastChangedProduct.Sales || 0;
                    _product.SearchCount = lastChangedProduct.SearchCount || 0;
                    _product.Translated = lastChangedProduct.Translated || false;
                    _product.Hot = lastChangedProduct.Hot || false;
                    _product.update_at = new Date();
                    _product.save(function (err) {
                        if (err) {
                            console.log("Error occured at updating Product!" + JSON.stringify(err));
                            return cb(update_count, deactiv_count, true);
                        }
                    });

                    console.log("Database -- Update Count: " + product_count + " | Local Length: " + _products.length + " | Remote Length: " + products.length + " | Exist: " + existFlag + " | Activity: " + _product.Activity + " | Remove: " + deactiv_count);
                    if (++product_count == _products.length) {
                        cb(update_count, deactiv_count, false);
                    }
                });
            });
        });
    }

    _Class.prototype.duoshuoUserParse = function duoshuoUserParse(user) {
        var _user = {
            user_id: user.user_id,
            username: user.name,
            displayName: user.name,
            avatar_url: user.avatar_url
        };
        return _user;
    }

    _Class.prototype.shortURL = function shortURL(newURL, cb) {
        var makeText = function () {
            var text = "";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
            for (var i = 0; i < 5; i++) {
                text += possible.charAt(Math.floor(Math.random() * possible.length));
            }
            return text;
        }
        var text = makeText();
        var checkText = function () {
            Link.findOne({ short: text }, function (err, url) {
                if (url) {
                    text = makeText();
                    checkText();
                }
                else {
                    Link.findOne({ long: newURL }, function (err, url) {
                        if (url) {
                            cb(null, url.short);
                        } else {
                            var newLink = Link({
                                short: text,
                                long: newURL
                            });
                            newLink.save(function (err, obj) {
                                if (err) return cb(err, null);
                                cb(null, obj.short);
                            });
                        }
                    });
                }
            });
        };
        checkText();
    };

    _Class.prototype.BingTranslate = function BingTranslate(translate, cb) {

        var params = {
            text: translate,
            from: 'de',
            to: 'zh'
        };
        // Using initialize_token manually.
        client.initialize_token(function (keys) {
            client.translate(params, function (err, data) {
                cb(err, data);
            });
        });
    };

    return _Class;
})();
