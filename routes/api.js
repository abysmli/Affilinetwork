var express = require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var aws = require('aws-lib');
var jwt = require('jsonwebtoken');
var tokencheck = require('../utils/tokencheck');
var Product = require('../models/product');
var Shop = require('../models/shop');
var Scan = require("../models/scan");
var User = require("../models/user");
var setting = require('../setting');
var utils = require('../utils/utils');
var Utils = new utils();

var affilinet = require('../utils/requester/AffilinetAPI');
var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var AffilinetSOAP = require('../utils/requester/AffilinetAPI.SOAP');

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

var AWS = require('../utils/requester/AWSProductAPI');

/*
 * POST appid and appsecret in order to get Auth Token, Token will expired in 10h. 
 * Set this token to Http-header ['x-access-token'], and then use the apis
 * If the token is expired, a new token must be regenerated.
 */
router.post('/auth', function (req, res) {
    console.log(req.body);
    // find the user
    User.findOne({
        appid: req.body.appid
    }, function (err, user) {
        if (err) throw err;
        if (!user) {
            res.json({ success: false, message: 'Authentication failed. App-ID not found.' });
        } else if (user) {
            // check if appsecret matches
            if (user.appsecret != req.body.appsecret) {
                res.json({ success: false, message: 'Authentication failed. Wrong App-Secret.' });
            } else {
                var token = jwt.sign({ _doc: user }, setting.secret, {
                    expiresIn: '10h' // expires in 24 hours
                });
                // return the information including token as JSON
                res.json({
                    success: true,
                    message: 'Authentification Success!',
                    token: token
                });
            }
        }
    });
});

router.get('/checkToken', tokencheck, function (req, res, next) {
    res.json({
        "success": true,
        "message": "Token Passed!"
    });
});

router.get('/getShops', tokencheck, function (req, res, next) {
    Shop.find({}, function (err, shops) {
        shops.forEach((shop, index) => {
            shop.ShortURL += "?subid=" + req.decoded._doc.appid;
        });
        res.json(shops);
    });
});

router.get('/test', function (req, res, next) {
    // AffilinetSOAP.SearchVoucherCodes({}, (data) => {
    //     res.json(data);
    // });
    AWS.getProductByEAN("7426601144104", (products) => {
        console.log(products);
        res.json(products);
    });
});

router.get('/getProgramRate', tokencheck, function (req, res, next) {
    var ProgramId = req.query.ProgramId;
    if (ProgramId == "amazon") {
        res.json([
            { Category: "Fernseher und Heimkino , Smartphones und Handys, Tablet-PCs ohne Vertragsbindung, PS4-Konsolen", Rate: "1,0%" },
            { Category: "Computer, Elektronik, Kamera, Elektro- Großgeräte, Geschenkgutscheine, Kindle und Fire Zubehör, Kindle (alle Geräte)", Rate: "3,0%" },
            { Category: "Software, Musik, DVDs & Blu-ray, Videospiele, Baumarkt, Spielzeug, Küche, Sport & Freizeit, Bier, Wein & Spirituosen, Gewerbe, Industrie & Wissenschaft, Handmade", Rate: "5,0%" },
            { Category: "Bücher*, Kindle eBooks*, Auto & Motorrad, Haushalt, Musikinstrumente, Büroartikel, Babyartikel, Kosmetik, Lebensmittel, Geräte für Gesundheit und Körperpflege, Drogerie, Haustierprodukte, Garten, Pantry", Rate: "7,0%" },
            { Category: "Videospiele-Downloads, Software-Downloads, Kleidung, Schmuck, Gepäck, Schuhe, Uhren, Möbel", Rate: "10,0%" },
            { Category: "Alle übrigen Produkte", Rate: "3,0%", }
        ]);
    } else {
        Affilinet.getProgramRates({ ProgramId: ProgramId }, function (err, response, results) {
            if (err) return next(err);
            parseString(results, { trim: true, mergeAttrs: true }, function (err, result) {
                if (err) return next(err);
                var Rates = result.GetProgramRatesResponse.RateCollection[0].Rate;
                res.json(Rates);
            });
        });
    }
});

router.get('/searchProduct', tokencheck, function (req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    var query = {};
    query.Query = req.query.search_value;
    Affilinet.searchProducts(query, function (err, response, results) {
        if (!err && response.statusCode == 200) {
            var products = Utils.ToLocalProducts(results.Products, "affilinet");
            prodAdv.call("ItemSearch", {
                SearchIndex: "All",
                Keywords: req.query.search_value,
                ResponseGroup: "Large",
                MerchantId: "Amazon"
            }, function (err, results) {
                if (!err) {
                    var _products = [];
                    if (Array.isArray(results.Items.Item)) {
                        _products = Utils.ToLocalProducts(results.Items.Item, "amazon");
                        products = products.concat(_products);
                    }
                    products.forEach((product, index) => {
                        product.URL += "?subid=" + req.decoded._doc.appid;
                    });
                    res.json(products);
                } else {
                    next(err);
                }
            });
        } else {
            next(err);
        }
    });
});

router.get('/eanSearch', tokencheck, function (req, res, next) {
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

router.get('/querySearch', tokencheck, function (req, res, next) {
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

router.get('/product/ean/:ean', tokencheck, function (req, res, next) {
    Product.find({
        EAN: req.params.ean,
        Activity: true,
        Translated: true
    }, function (err, products) {
        if (err) next(err);
        if (products.length !== 0) {
            res.redirect("/product?product_id=" + products[0]._id);
        } else {
            res.send("No Product Found!");
        }
    });
});

module.exports = router;