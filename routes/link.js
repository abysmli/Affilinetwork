var express = require('express');
var router = express.Router();
var url = require('url');
var Link = require("../models/link");
var Product = require('../models/product');
var Shop = require('../models/shop');
var setting = require('../setting');
var utils = require('../utils/utils.js');
var Utils = new utils();

router.get("/queryALL", function (req, res, next) {
    var productLength = 0;
    var shopLength = 0;
    Product.find({}, function (err, products) {
        products.forEach(function (product, index) {
            Utils.shortURL(product.URL, function (err, shorturl) {
                product.ShortURL = shorturl;
                product.save(function (err, product) {
                    if (products.length == ++productLength) {
                        Shop.find({}, function (err, shops) {
                            shops.forEach(function (shop, index) {
                                Utils.shortURL(shop.ShopLink, function (err, shorturl) {
                                    shop.ShortURL = shorturl;
                                    shop.save(function (err, shop) {
                                        if (shops.length == ++shopLength) {
                                            res.json({
                                                result: "success",
                                                shopNumber: shopLength,
                                                productNumber: productLength
                                            });
                                        }
                                    });
                                });
                            });
                        });
                    }
                });
            });
        });
    });
});

router.get('/:url', function (req, res, next) {
    var url = req.params.url;
    Link.findOne({ short: url }, function (err, link) {
        if (link) {
            var _url = url.parse(link.long, true);
            var __url;
            if (_url.search) {
                __url = link.long + '&subid=' + req.query.subid;
            } else {
                __url = link.long + '?subid=' + req.query.subid;
            }
            res.redirect(__url);
        }
        else {
            res.render('error', {
                title: 'Error'
            });
        }
    });
});

module.exports = router;