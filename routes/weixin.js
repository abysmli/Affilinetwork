var express = require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var affilinet = require('../utils/affilinetapi');
var aws = require('aws-lib');
var jwt = require('jsonwebtoken');
var uuidV4 = require('uuid/v4');
var tokencheck = require('../utils/tokencheck');
var Product = require('../models/product');
var Shop = require('../models/shop');
var Scan = require("../models/scan");
var User = require("../models/user");
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

router.get('/prerequest', function (req, res, next) {
    if (req.query.value != undefined) {
        var query = {};
        query.FQ = "EAN:" + req.query.value;
        var scanResult = {
            Result: "",
            EAN: req.query.value,
            FromUser: req.query.from,
            Type: req.query.type
        };
        Product.find({
            EAN: req.query.value
        }, (err, products) => {
            var counter = products.length;
            Affilinet.searchProducts(query, function (err, response, results) {
                if (!err && response.statusCode == 200) {
                    counter = parseInt(counter) + parseInt(results.ProductsSummary.TotalRecords);
                    var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                    if (!Utils.isEmptyObject(_product)) {
                        counter = parseInt(counter) + 1;
                        products = products.concat(_product);
                    }
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
                                    var _product = {};
                                    if (Array.isArray(product.Items.Item)) {
                                        _product = Utils.fromAmazonToLocalProduct(product.Items.Item[0]);
                                    } else {
                                        _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                                    }
                                    if (!Utils.isEmptyObject(_product)) {
                                        counter = parseInt(counter) + 1;
                                        products.push(_product);
                                    }
                                    if (products.length !== 0) {
                                        var price = products[0].Price;
                                        products.forEach(function (product) {
                                            if (price > product.Price) {
                                                price = product.Price;
                                            }
                                        });
                                        var data = {
                                            Result: "success",
                                            Title: products[0].Title || "",
                                            TitleCN: products[0].TitleCN || "",
                                            Image: products[0].ProductImage || "",
                                            Brand: products[0].Brand || "",
                                            Price: price || ""
                                        };
                                        res.json(data);
                                    } else {
                                        scanResult.Result = "Not Found";
                                        Scan.create(scanResult, function (err, scan) {
                                            if (err) next(err);
                                        });
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
    } else if (req.query.content != undefined) {
        var scanResult = {
            Result: "",
            Content: req.query.content,
            FromUser: req.query.from,
            Type: req.query.type
        };
        Product.find({
            $and: [{
                Translated: true,
                EAN: {
                    $ne: 'null'
                },
                EAN: {
                    $ne: null
                },
                Activity: {
                    $ne: false
                },
                $or: [{
                    Title: new RegExp(scanResult.Content, 'gi')
                }, {
                    TitleCN: new RegExp(scanResult.Content, 'gi')
                }, {
                    Category: new RegExp(scanResult.Content, 'gi')
                }, {
                    Keywords: new RegExp(scanResult.Content, 'gi')
                }]
            }]
        }, (err, products) => {
            var sum = products.length;
            var data = {
                Result: "success",
                Content: scanResult.Content,
                Sum: sum
            };
            res.json(data);
        });
    } else {
        res.json({
            Result: "Request not supported!"
        });
    }
});

router.get('/ean', function (req, res, next) {
    var currenturl = req.protocol + '://' + req.get('host') + req.originalUrl;
    var scanResult = {
        Result: "",
        EAN: req.query.value,
        FromUser: req.query.from,
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
                Scan.create(scanResult, function (err, scan) {
                    if (err) next(err);
                });
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
                                        var _product = {};
                                        if (Array.isArray(product.Items.Item)) {
                                            _product = Utils.fromAmazonToLocalProduct(product.Items.Item[0]);
                                        } else {
                                            _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                                        }
                                        if (!Utils.isEmptyObject(_product)) {
                                            counter = parseInt(counter) + 1;
                                            products.push(_product);
                                        }
                                        if (products.length !== 0) {
                                            scanResult.Result = "In Cloud";
                                            Scan.create(scanResult, function (err, scan) {
                                                if (err) next(err);
                                            });
                                            Utils.syncProductByEAN(Affilinet, prodAdv, Product, req.query.value, function (update_count, deactiv_count) {
                                                res.redirect("/product?EAN=" + req.query.value);
                                            });
                                        } else {
                                            scanResult.Result = "Not Found";
                                            Scan.create(scanResult, function (err, scan) {
                                                if (err) next(err);
                                            });
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

router.get('/eanSearch', function (req, res, next) {
    Product.find({
        EAN: req.query.value,
        Activity: true,
        Translated: true
    }, null, {
            sort: {
                Price: 1
            }
        }, function (err, _products) {
            if (_products.length !== 0) {
                Utils.syncProductByEAN(Affilinet, prodAdv, Product, req.query.value, function (update_count, deactiv_count) {
                    Product.find({
                        EAN: req.query.value,
                        Activity: true
                    }, null, {
                            sort: {
                                Price: 1
                            }
                        }, function (err, _products) {
                            var scanResult = {
                                Result: "In Local",
                                EAN: req.query.value,
                                FromUser: "Mini App",
                                Type: "Mini App"
                            };
                            Scan.create(scanResult, function (err, scan) {
                                if (err) next(err);
                            });
                            res.json(_products.slice(0, 10));
                        });
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
                                        var _product = {};
                                        if (Array.isArray(product.Items.Item)) {
                                            _product = Utils.fromAmazonToLocalProduct(product.Items.Item[0]);
                                        } else {
                                            _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                                        }
                                        if (!Utils.isEmptyObject(_product)) {
                                            counter = parseInt(counter) + 1;
                                            products.push(_product);
                                        }
                                        if (products.length !== 0) {
                                            Utils.syncProductByEAN(Affilinet, prodAdv, Product, req.query.value, function (update_count, deactiv_count) {
                                                Product.find({
                                                    EAN: req.query.value,
                                                    Activity: true
                                                }, null, {
                                                        sort: {
                                                            Price: 1
                                                        }
                                                    }, function (err, _products) {
                                                        var scanResult = {
                                                            Result: "In Cloud",
                                                            EAN: req.query.value,
                                                            FromUser: "Mini App",
                                                            Type: "Mini App"
                                                        };
                                                        Scan.create(scanResult, function (err, scan) {
                                                            if (err) next(err);
                                                        });
                                                        res.json(_products.slice(0, 10));
                                                    });
                                            });
                                        } else {
                                            var scanResult = {
                                                Result: "Not Found",
                                                EAN: req.query.value,
                                                FromUser: "Mini App",
                                                Type: "Mini App"
                                            };
                                            Scan.create(scanResult, function (err, scan) {
                                                if (err) next(err);
                                            });
                                            res.json({ result: "Product not found!" });
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

router.get('/querySearch', function (req, res, next) {
    console.log(req.query.value);
    Product.find({
        $and: [{
            Translated: true,
            Activity: {
                $ne: false
            },
            $or: [{
                Title: new RegExp(req.query.value, 'gi')
            }, {
                TitleCN: new RegExp(req.query.value, 'gi')
            }, {
                Keywords: new RegExp(req.query.value, 'gi')
            }, {
                Brand: new RegExp(req.query.value, 'gi')
            }]
        }]
    }, null, {
            sort: {
                Price: 1
            }
        }, function (err, _products) {
            if (_products.length !== 0) {
                var __products = [], eanBuffer = "";
                _products.forEach(function (_product, index) {
                    if (_product.EAN != eanBuffer) {
                        __products.push(_product);
                        eanBuffer = _product.EAN;
                    }
                });
                res.json(__products.slice(0, 10));
            } else {
                res.json({ result: "No Product found!" });
            }
        });
});

router.get('/product', function (req, res, next) {
    Product.findOne({ EAN: req.query.EAN }, function (err, product) {
        res.redirect("/product?product_id=" + product._id);
    });
});

module.exports = router;