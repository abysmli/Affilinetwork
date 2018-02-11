const express = require('express');
const router = express.Router();
const URL = require('url');
const util = require('util');
const Link = require("../models/link");
const Product = require('../models/product');
const Shop = require('../models/shop');
const setting = require('../setting');
const utils = require('../utils/utils.js');
const Utils = new utils();

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
            var _url = URL.parse(link.long, true);
            var __url;
            if (_url.search) {
                __url = link.long + '&subid=' + req.query.subid;
            } else {
                __url = link.long + '?subid=' + req.query.subid;
            }
            res.render('redirect', {
                layout: null,
                url: "http://allhaha.com/go/test"
            });
        }
        else {
            res.render('error', {
                title: 'Error',
                error: {
                    status: "404",
                    message: "link not found"
                }
            });
        }
    });
});

router.get('/test', function (req, res, next) {
    res.json(req.headers);
});

module.exports = router;