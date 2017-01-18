var express = require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var affilinet = require('../utils/affilinetapi');
var aws = require('aws-lib');
var Product = require('../models/product');
var Shop = require('../models/shop');
var Request = require('../models/request');
var setting = require('../setting');
var utils = require('../utils/utils');
var Utils = new utils();

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

router.get('/', function (req, res, next) {
    res.render('weixin/products', {
        title: 'Products View',
        products: [],
        layout: 'weixin/layout'
    });
});

router.get('/prerequest', function (req, res, next) {
    var query = {};
    query.FQ = "EAN:" + req.query.value;
    Affilinet.searchProducts(query, function (err, response, results) {
        if (!err && response.statusCode == 200) {
            var counter = results.ProductsSummary.TotalRecords;
            var products = Utils.ToLocalProducts(results.Products, "affilinet");
            query.FQ = "EAN:0" + req.query.value;
            Affilinet.searchProducts(query, function (err, response, results) {
                if (!err && response.statusCode == 200) {
                    counter = parseInt(counter) + parseInt(results.ProductsSummary.TotalRecords);
                    var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                    if (!Utils.isEmptyObject(_product)) {
                        counter = parseInt(counter) + 1;
                        products = products.concat(_product);
                    }
                    prodAdv.call("ItemLookup", {
                        ItemId: req.query.value,
                        IdType: "EAN",
                        SearchIndex: "All",
                        ResponseGroup: "Large",
                        MerchantId: "Amazon"
                    }, function (err, product) {
                        if (!err) {
                            var _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                            if (!Utils.isEmptyObject(_product)) {
                                counter = parseInt(counter) + 1;
                                products.push(_product);
                            }
                            if (products.length !== 0) {
                                var price = products[0].Price;
                                products.forEach(function (product) {
                                    console.log(product.Price);
                                    if (price > product.Price) {
                                        price = product.Price;
                                    }
                                });
                                var data = {
                                    Result: "success",
                                    Title: products[0].Title || "",
                                    Image: products[0].ProductImage || "",
                                    Brand: products[0].Brand || "",
                                    Price: price
                                };
                                res.json(data);
                            } else {
                                res.json({
                                    Result: "产品未找到，我们将及时添加。"
                                });
                            }
                        } else {
                            res.send(err);
                        }
                    });
                } else {
                    res.send(err);
                }
            });
        } else {
            res.send(err);
        }
    });
});

router.get('/ean', function (req, res, next) {
    var currenturl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var scanResult = {
        Result: "",
        EAN: req.query.value,
        From: req.query.from,
        Type: req.query.type
    };
    Product.find({
        EAN: req.query.value,
        Activity: true
    }, null, {
            sort: {
                Price: 1
            }
        }, function (err, _products) {
            if (_products.length !== 0) {
                scanResult.Result = "In Local";
                Utils.syncProductByEAN(Affilinet, prodAdv, Product, req.query.value, function (update_count, deactiv_count) {
                    res.redirect("/weixin/product?EAN=" + req.query.value);
                });
            } else {
                var query = {};
                query.FQ = "EAN:" + req.query.value;
                Affilinet.searchProducts(query, function (err, response, results) {
                    if (!err && response.statusCode == 200) {
                        var counter = results.ProductsSummary.TotalRecords;
                        var products = Utils.ToLocalProducts(results.Products, "affilinet");
                        query.FQ = "EAN:0" + req.query.value;
                        Affilinet.searchProducts(query, function (err, response, results) {
                            if (!err && response.statusCode == 200) {
                                counter = parseInt(counter) + parseInt(results.ProductsSummary.TotalRecords);
                                var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                                if (!Utils.isEmptyObject(_product)) {
                                    counter = parseInt(counter) + 1;
                                    products = products.concat(_product);
                                }
                                prodAdv.call("ItemLookup", {
                                    ItemId: req.query.value,
                                    IdType: "EAN",
                                    SearchIndex: "All",
                                    ResponseGroup: "Large",
                                    MerchantId: "Amazon"
                                }, function (err, product) {
                                    if (!err) {
                                        var _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                                        if (!Utils.isEmptyObject(_product)) {
                                            counter = parseInt(counter) + 1;
                                            products.push(_product);
                                        }
                                        if (products.length !== 0) {
                                            scanResult.Result = "In Cloud";
                                            Utils.syncProductByEAN(Affilinet, prodAdv, Product, req.query.value, function (update_count, deactiv_count) {
                                                res.redirect("/weixin/product?EAN=" + req.query.value);
                                            });
                                        } else {
                                            scanResult.Result = "Not Found";
                                            res.send("产品未找到，我们将及时添加。");
                                        }
                                    } else {
                                        res.send(err);
                                    }
                                });
                            } else {
                                res.send(err);
                            }
                        });
                    } else {
                        res.send(err);
                    }
                });
            }
        });
});

router.get('/product', function (req, res, next) {
    var currenturl = req.protocol + '://' + req.get('host') + req.originalUrl;
    Product.find({
        EAN: req.query.EAN,
        Activity: true
    }, null, {
            sort: {
                Price: 1
            }
        }, function (err, _products) {
            if (err !== null || _products.length === 0) next(err);
            else {
                Product.update({
                    EAN: _products[0].EAN
                }, {
                        Views: _products[0].Views + 1
                    }, {
                        multi: true
                    }, function (err, doc) {
                        if (err) return next(err);
                        var productsCount = 0;
                        _products.forEach(function (__product, index) {
                            Shop.findOne({
                                ShopId: __product.ShopId,
                                Activity: true
                            }, function (err, shop) {
                                if (shop !== null) {
                                    __product.ShopName = shop.CustomTitleCN;
                                } else {
                                    __product.ShopId = "deactiv";
                                }
                                if (++productsCount == _products.length) {
                                    res.render('weixin/product', {
                                        title: _products[0].TitleCN || _products[0].Title,
                                        footer_bottom: !Utils.checkMobile(req),
                                        product: _products[0],
                                        currenturl: currenturl,
                                        product_link: req.url,
                                        products: _products,
                                        layout: 'weixin/layout',
                                        user: req.user
                                    });
                                }
                            });
                        });
                    });
            }
        });

});

module.exports = router;