var express = require('express');
var router = express.Router();
var parseString = require('xml2js').parseString;
var affilinet = require('../utils/affilinetapi');
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
                                products.forEach(function(product) {
                                    if (price < product.Price) {
                                        price = product.Price;
                                    }
                                });
                                var data = {
                                    Result: "success",
                                    Title: products[0].Title,
                                    Image: products[0].ProductImage,
                                    Brand: products[0].Brand,
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
    var group = {
        _id: "$EAN",
        ProductId: {
            $first: "$_id"
        },
        Images: {
            $first: "$ProductImage"
        },
        ProductName: {
            $push: "$TitleCN"
        },
        DescriptionCN: {
            $push: "$DescriptionCN"
        },
        Price: {
            $push: "$Price"
        },
        updated_at: {
            $first: "$updated_at"
        }
    };
    var matchQuery = {
        $and: [{
            Translated: true,
            EAN: req.query.value,
            Activity: {
                $ne: false
            }
        }]
    };
    Product.aggregate([{
        "$match": matchQuery
    }, {
        "$group": group
    }], function (err, products) {
        var iterateNumber = 0;
        if (products.length !== 0) {
            res.render('product_list.ejs', {
                title: 'Allhaha.com 德国欧哈哈精品购物网 - 商品比价 - 优惠券',
                footer_bottom: false,
                pages: 1,
                currentPage: 1,
                products: 1,
                category: "",
                minprice: "",
                maxprice: "",
                brand: "",
                brands: "",
                sort: "",
                user: "",
                layout: 'layout'
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
                                        res.render('weixin/products', {
                                            title: 'Products View',
                                            products: products,
                                            layout: 'weixin/layout'
                                        });
                                    } else {
                                        res.render('weixin/add_product', {
                                            title: 'Products Add',
                                            EAN: req.query.value,
                                            layout: 'weixin/layout'
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
        }
    });
});

router.post('/ean', function (req, res, next) {
    var product = req.body;
    var query = Product.where({
        ProductId: product.ProductId,
        ASIN: product.ASIN
    });
    product.ItemDimensions = {
        Length: product.ItemDimensions_Length,
        Width: product.ItemDimensions_Width,
        Height: product.ItemDimensions_Height,
        Weight: product.ItemDimensions_Weight
    };
    product.PackageDimensions = {
        Length: product.PackageDimensions_Length,
        Width: product.PackageDimensions_Width,
        Height: product.PackageDimensions_Height,
        Weight: product.PackageDimensions_Weight
    };
    query.findOne(function (err, _product) {
        if (err) next(err);
        if (!_product) {
            product.ProductImageSet = JSON.parse(product.ProductImageSet);
            if (product.TitleCN !== "" && product.DescriptionCN !== "") {
                product.Translated = true;
            }
            product.insert_at = new Date();
            Utils.shortURL(product.URL, function (err, shorturl) {
                product.ShortURL = shorturl;
                Product.create(product, function (err, product) {
                    if (err) {
                        next(err);
                    }
                });
            });
        }
        if (product.EAN !== null && product.EAN !== "") {
            Utils.syncProductByEAN(Affilinet, prodAdv, Product, product.EAN, function (update_count, deactiv_count) {
                return res.redirect('/controller/product');
            });
        } else {
            return res.redirect('/controller/product');
        }
    });
});

module.exports = router;