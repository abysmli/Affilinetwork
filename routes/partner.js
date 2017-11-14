var express = require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var auth_partner = require('../models/auth_partner');
var affilinet = require('../utils/requester/AffilinetAPI');
var aws = require('aws-lib');
var Product = require('../models/product');
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

router.get('/', auth_partner, function (req, res, next) {
    res.render('partner/products', {
        title: 'Products View',
        products: [],
        layout: 'partner/layout'
    });
});

router.post('/', auth_partner, function (req, res, next) {
    var query = {};
    if (req.body.search_type == "Query") {
        query.Query = req.body.search_value;
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                prodAdv.call("ItemSearch", {
                    SearchIndex: "All",
                    Keywords: req.body.search_value,
                    ResponseGroup: "Large",
                    MerchantId: "Amazon"
                }, function (err, results) {
                    console.log(results);
                    if (!err) {
                        var _products = [];
                        if (Array.isArray(results.Items.Item)) {
                            _products = Utils.ToLocalProducts(results.Items.Item, "amazon");
                            products = products.concat(_products);
                        }
                        req.session.products = products;
                        res.render('partner/products', {
                            title: 'Products View',
                            products: products,
                            layout: 'partner/layout'
                        });
                    } else {
                        next(err);
                    }
                });
            } else {
                next(err);
            }
        });
    } else if (req.body.search_type == "ASIN") {
        query.FQ = "ASIN:" + req.body.search_value;
        prodAdv.call("ItemLookup", {
            ItemId: req.body.search_value,
            ResponseGroup: "Large",
            MerchantId: "Amazon"
        }, function (err, product) {
            if (!err) {
                var counter = 0;
                var products = [];
                var _product = {};
                if (Array.isArray(product.Items.Item)) {
                    _product = Utils.fromAmazonToLocalProduct(product.Items.Item[0]);
                } else {
                    _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                }
                if (!Utils.isEmptyObject(_product)) {
                    counter = 1;
                    products.push(_product);
                }
                req.session.products = products;
                res.render('partner/products', {
                    title: 'Products View',
                    products: products,
                    layout: 'partner/layout'
                });
            } else {
                next(err);
            }
        });
    } else if (req.body.search_type == "EAN") {
        query.FQ = "EAN:" + req.body.search_value;
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                query.FQ = "EAN:0" + req.body.search_value;
                Affilinet.searchProducts(query, function (err, response, results) {
                    if (!err && response.statusCode == 200) {
                        var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                        if (!Utils.isEmptyObject(_product)) {
                            products = products.concat(_product);
                        }
                        prodAdv.call("ItemLookup", {
                            ItemId: req.body.search_value,
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
                                    products.push(_product);
                                }
                                req.session.products = products;
                                res.render('partner/products', {
                                    title: 'Products View',
                                    products: products,
                                    layout: 'partner/layout'
                                });
                            } else {
                                next(err);
                            }
                        });
                    } else {
                        next(err);
                    }
                });
            } else {
                next(err);
            }
        });
    }
});

router.get('/getProgram', auth_partner, function (req, res, next) {
    var ProgramId = req.query.ProgramId;
    if (ProgramId == "amazon") {
        res.render('partner/rateinfo', {
            title: 'Rate Info',
            rates: "amazon",
            layout: 'partner/layout'
        });
    } else {
        Affilinet.getProgramRates({ ProgramId: ProgramId }, function (err, response, results) {
            if (err) return next(err);
            parseString(results, { trim: true, mergeAttrs: true }, function (err, result) {
                if (err) return next(err);
                var Rates = result.GetProgramRatesResponse.RateCollection[0].Rate;
                res.render('partner/rateinfo', {
                    title: 'Rate Info',
                    rates: Rates,
                    layout: 'partner/layout'
                });
            });
        });
    }
});

router.get('/voucher', auth_partner, function (req, res, next) {
    Affilinet.getMyPrograms({}, function (err, response, programs) {
        if (!err && response.statusCode == 200) {
            parseString(programs, {
                explicitArray: false
            }, function (err, programs) {
                var programs = programs.ProgramList.Programs.ProgramSummary;
                var allVouchers = [];
                var voucher_nummber = 0;
                programs.forEach(function (program, index) {
                    Affilinet.getVoucherCodes({
                        ProgramId: program.ProgramID
                    }, function (err, response, vouchers) {
                        parseString(vouchers, {
                            explicitArray: false,
                            async: true,
                        }, function (err, vouchers) {
                            var vouchers = vouchers.GetVoucherCodesResponse.VoucherCodeCollection.VoucherCode || [];
                            if (vouchers.constructor != Array) {
                                vouchers = [vouchers];
                            }
                            vouchers.forEach(function (voucher, index, object) {
                                voucher.Program = program.Title;
                                if (voucher.ActivePartnership == "true") {
                                    allVouchers.push(voucher);
                                }
                            });
                            if (++voucher_nummber == programs.length) {
                                req.session.vouchers = allVouchers;
                                res.render('partner/voucher', {
                                    title: 'Vouchers Manage',
                                    vouchers: allVouchers,
                                    type: 'remote',
                                    programTitle: "All Programs",
                                    layout: 'partner/layout'
                                });
                            }
                        });
                    });
                });
            });
        } else {
            next(err);
        }
    });
});

router.post('/voucher_details', auth_partner, function (req, res, next) {
    req.session.vouchers.forEach(function (voucher, index) {
        if (voucher.Id == req.body.voucher_id) {
            return res.json(voucher);
        }
    });
});

module.exports = router;