var express = require('express');
var router = express.Router();
var auth = require('../models/auth.js');
var affilinet = require('../utils/affilinetapi.js');
var Product = require('../models/product.js');
var setting = require('../setting.js');

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

/* GET users listing. */
router.get('/', auth, function (req, res, next) {
    Affilinet.getShopList({}, function (error, response, shops) {
        if (!error && response.statusCode == 200) {
            res.render('controller/index', {
                title: 'Shops Manage',
                shops: shops.Shops,
                layout: 'controller/layout'
            });
        } else {
            res.render('error');
        }
    });
});

router.get('/category', function (req, res, next) {
    var ShopId = req.query.shopid == undefined ? 0 : req.query.shopid;
    var shoptitle = req.query.shoptitle == undefined ? "for All Shops" : "for " + req.query.shoptitle;
    Affilinet.getCategoryList({
        ShopId: ShopId
    }, function (error, response, categorylist) {
        if (!error && response.statusCode == 200) {
            res.render('controller/category', {
                title: 'Categories Manage',
                categorylist: categorylist.Categories,
                shopid: ShopId,
                shoptitle: shoptitle,
                layout: 'controller/layout'
            });
        } else {
            res.render('error');
        }
    });
});

router.get('/programs', function (req, res, next) {
    res.render('controller/programs', {
        title: 'Programs Manage',
        layout: 'controller/layout'
    });
});

router.get('/product/remove_all', function (req, res, next) {
    Product.remove(function (err) {
        if (err)
            res.render('error');
        else
            res.redirect('/controller/product');
    });
});

router.get('/product', function (req, res, next) {
    if (req.query.type == "remote") {
        var query = {
            ShopIds: req.query.shopid,
            CategoryIds: req.query.categoryid,
        }
        if (req.query.shopid != 0) {
            query.ShopIdMode = "Include";
            query.UseAffilinetCategories = "false";
        }
        Affilinet.searchProducts(query, function (error, response, results) {
            if (!error && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = results.Products;
                res.render('controller/products', {
                    title: 'Products Manage',
                    shopid: req.query.shopid,
                    categoryid: req.query.categoryid,
                    type: 'remote',
                    counter: counter,
                    products: products,
                    layout: 'controller/layout'
                });
            } else {
                res.render('error');
            }
        });
    } else {
        Product.count({}, function (err, count) {
            Product.find({}, null, {
                limit: 500,
                sort: {
                    updated_at: -1
                }
            }, function (err, products) {
                if (err)
                    res.render('error');
                else
                    res.render('controller/products', {
                        title: 'Products Manage',
                        shopid: -1,
                        categoryid: -1,
                        type: 'local',
                        counter: count,
                        products: products,
                        layout: 'controller/layout'
                    });
            });
        });
    }
});

router.post('/product', function (req, res, next) {
    var query = {};
    if (req.body.search_type == "Query") {
        query.Query = req.body.search_value;
    } else {
        query.FQ = req.body.search_type+":"+req.body.search_value;
    }
    Affilinet.searchProducts(query, function (error, response, results) {
        if (!error && response.statusCode == 200) {
            var counter = results.ProductsSummary.TotalRecords;
            var products = results.Products;
            res.render('controller/products', {
                title: 'Products Manage',
                shopid: 0,
                categoryid: 0,
                query: query.Query || "",
                fq: query.FQ || "",
                type: 'search',
                counter: counter,
                products: products,
                layout: 'controller/layout'
            });
        } else {
            res.render('error');
        }
    });
});

router.get('/product/edit', function (req, res, next) {
    Product.findOne({
        ProductId: req.query.product_id
    }, function (err, product) {
        if (err != null) res.render('error');
        else {
            res.render('controller/product_edit', {
                title: 'Edit Product',
                product: product,
                layout: 'controller/layout'
            });
        }
    });
});

router.post('/product/edit', function (req, res, next) {
    Product.update({
        ProductId: req.query.product_id
    }, {
        ProductName_cn: req.body.product_name,
        Description_cn: req.body.product_desc,
        DescriptionShort_cn: req.body.product_desc_short,
        Tranlated: true
    }, function (err, product) {
        if (err != null) res.render('error');
        else {
            res.redirect('/controller/product');
        }
    });
});

module.exports = router;
