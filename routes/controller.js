var express = require('express');
var router = express.Router();
var auth = require('../models/auth.js');
var affilinet = require('../utils/affilinetapi.js');
var aws = require('aws-lib');
var Product = require('../models/product.js');
var Article = require('../models/article.js');
var setting = require('../setting.js');
var utils = require('../utils/utils.js');
var Utils = new utils();
var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag);

/* GET users listing. */
router.get('/', auth, auth, function(req, res, next) {
    Affilinet.getShopList({}, function(error, response, shops) {
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

router.get('/category', auth, function(req, res, next) {
    var ShopId = req.query.shopid == undefined ? 0 : req.query.shopid;
    var shoptitle = req.query.shoptitle == undefined ? "for All Shops" : "for " + req.query.shoptitle;
    Affilinet.getCategoryList({
        ShopId: ShopId
    }, function(error, response, categorylist) {
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

router.get('/programs', auth, function(req, res, next) {
    res.render('controller/programs', {
        title: 'Programs Manage',
        layout: 'controller/layout'
    });
});

router.get('/product/remove_all', auth, function(req, res, next) {
    Product.remove(function(err) {
        if (err)
            res.render('error');
        else
            res.redirect('/controller/product');
    });
});

router.get('/product', auth, function(req, res, next) {
    if (req.query.type == "remote") {
        var query = {
            ShopIds: req.query.shopid,
            CategoryIds: req.query.categoryid,
        }
        if (req.query.shopid != 0) {
            query.ShopIdMode = "Include";
            query.UseAffilinetCategories = "false";
        }
        Affilinet.searchProducts(query, function(error, response, results) {
            if (!error && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");

                res.render('controller/products', {
                    title: 'Products Manage',
                    shopid: req.query.shopid,
                    categoryid: req.query.categoryid,
                    query: "",
                    fq: "",
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
        Product.count({}, function(err, count) {
            Product.find({}, null, {
                limit: 500,
                sort: {
                    updated_at: -1
                }
            }, function(err, products) {
                if (err)
                    res.render('error');
                else
                    res.render('controller/products', {
                        title: 'Products Manage',
                        shopid: -1,
                        categoryid: -1,
                        query: "",
                        fq: "",
                        type: 'local',
                        counter: count,
                        products: products,
                        layout: 'controller/layout'
                    });
            });
        });
    }
});

router.post('/product', auth, function(req, res, next) {
    var query = {};
    if (req.body.search_type == "Query") {
        query.Query = req.body.search_value;
        Affilinet.searchProducts(query, function(err, response, results) {
            if (!err && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                prodAdv.call("ItemSearch", {
                    SearchIndex: "All",
                    Keywords: req.body.search_value,
                    ResponseGroup: "Medium"
                }, function(err, results) {
                    if (!err) {
                        counter = "Affilinet: " + counter + " | Amazon: " + results.Items.TotalResults;
                        var _products = Utils.ToLocalProducts(results.Items.Item, "amazon");
                        products = products.concat(_products);
                        req.session.products = products;
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
            } else {
                res.render('error');
            }
        });
    } else if (req.body.search_type == "ASIN") {
        query.FQ = "ASIN:" + req.body.search_value;
        prodAdv.call("ItemLookup", {
            ItemId: req.body.search_value,
            ResponseGroup: "Medium"
        }, function(err, product) {
            if (!err) {
                var counter = 0;
                var products = [];
                var _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                if (!Utils.isEmptyObject(_product)) {
                    counter = 1;
                    products.push(_product);
                }
                req.session.products = products;
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
    } else if (req.body.search_type == "EAN") {
        query.FQ = "EAN:" + req.body.search_value;
        Affilinet.searchProducts(query, function(err, response, results) {
            if (!err && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                prodAdv.call("ItemLookup", {
                    ItemId: req.body.search_value,
                    IdType: "EAN",
                    SearchIndex: "All",
                    ResponseGroup: "Medium"
                }, function(err, product) {
                    if (!err) {
                        var _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                        if (!Utils.isEmptyObject(_product)) {
                            counter = parseInt(counter) + 1;
                            products.push(_product);
                        }
                        req.session.products = products;
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
            } else {
                res.render('error');
            }
        });
    }
});

router.get('/product/add', auth, function(req, res, next) {
    var product = {};
    if (req.query.add_type == "auto") {
        product = req.session.products[req.query.id];
    }
    res.render('controller/product_form', {
        title: 'Add Product',
        product: product,
        layout: 'controller/layout'
    });
});

router.post('/product/add', function(req, res, next) {
    var product = req.body;
    var query = Product.where({
        ProductId: product.ProductId,
        ASIN: product.ASIN
    });
    query.findOne(function(err, _product) {
        if (err) return err;
        if (!_product) {
            product.ProductImageSet = JSON.parse(product.ProductImageSet);
            if (product.TitleCN !== "" && product.DescriptionCN !== "") {
                product.Tranlated = true;
            }
            Product.create(product, function(err, product) {
                if (err) {
                    console.log(err);
                    return err;
                }
            });
        }
        return res.redirect('/controller/product');
    });
});

router.get('/product/edit', auth, function(req, res, next) {
    Product.findById(req.query.id, function(err, product) {
        if (err != null) res.render('error');
        else {
            res.render('controller/product_form', {
                title: 'Edit Product',
                product: product,
                layout: 'controller/layout'
            });
        }
    });
});

router.post('/product/edit', auth, function(req, res, next) {
    var product = req.body;
    if (product.TitleCN !== "" && product.DescriptionCN !== "") {
        product.Tranlated = true;
    }
    product.ProductImageSet = JSON.parse(product.ProductImageSet);
    Product.findOneAndUpdate({
        _id: req.query.id
    }, product, function(err, product) {
        if (err != null) res.render('error');
        else {
            res.redirect('/controller/product');
        }
    });
});

router.get('/product/remove', auth, function(req, res, next) {
    Product.findByIdAndRemove(req.query.id, function(err, product) {
        if (err != null) res.render('error');
        else {
            return res.redirect('/controller/product');
        }
    });
});

router.get('/article', auth, function(req, res, next) {
    Article.find({}, function(err, articles) {
        if (err) {
            return res.render('error');
        } else {
            res.render('controller/article', {
                title: 'Articles Manage',
                articles: articles,
                layout: 'controller/layout'
            });
        }
    });

})

router.get('/article/add', auth, function(req, res, next) {
    res.render('controller/article', {
        title: 'Articles Manage',
        article: 'article',
        layout: 'controller/layout'
    });
})

router.post('/article/add', auth, function(req, res, next) {
    res.render('controller/article', {
        title: 'Articles Manage',
        article: 'article',
        layout: 'controller/layout'
    });
})

router.get('/article/edit', auth, function(req, res, next) {
    res.render('controller/article', {
        title: 'Articles Manage',
        article: 'article',
        layout: 'controller/layout'
    });
})

router.post('/article/edit', auth, function(req, res, next) {
    res.render('controller/article', {
        title: 'Articles Manage',
        article: 'article',
        layout: 'controller/layout'
    });
})

router.get('/article/remove', auth, function(req, res, next) {
    res.render('controller/article', {
        title: 'Articles Manage',
        article: 'article',
        layout: 'controller/layout'
    });
})

router.get('/article/remove_all', auth, function(req, res, next) {
    res.render('controller/article', {
        title: 'Articles Manage',
        article: 'article',
        layout: 'controller/layout'
    });
})

module.exports = router;