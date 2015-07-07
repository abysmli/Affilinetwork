var express = require('express');
var router = express.Router();
var auth = require('../models/auth.js');
var Affilinet = require('../utils/affilinetapis.js');
var Sync = require('../utils/synchronization.js');
var Product = require('../models/product.js');

var affilinet = new Affilinet({
    publisherId: '512499',
    productWebservicePassword: 'FaI69alVX0eZ4i28TnIq',
    publisherWebservicePassword: 'lZONYNI32ieYq8kMPqKS'
});

/* GET users listing. */
router.get('/', auth, function (req, res, next) {
    affilinet.getShopList(function (err, shops) {
        if (err != null)
            res.render('error');
        else
            res.render('controller/index', {
                title: 'Shops Manage',
                shops: shops,
                layout: 'controller/layout'
            });
    });
});

router.get('/programs/update', function (req, res, next) {
    /*var displayOptions = {
        CurrentPage: 1,
        PageSize: 10,
    };
    var query = {
        // "Active", "Paused", "Waiting", "Refused", "NoPartnership", "Cancelled"
        PartnershipStatus: ["Active"],
    };
    affilinet.getPrograms(displayOptions, query, function (err, programs) {

        if (err != null)
            res.render('error');
        else
            programs.forEach(function (program) {

                var data = {
                    ProgramId: program.ProgramId,
                    ProgramTitle: program.ProgramTitle,
                    ProgramDescription: program.ProgramDescription,
                    PartnershipStatus: program.PartnershipStatus,
                    ProgramClassificationEnum: program.ProgramClassificationEnum,
                    LimitationsComment: program.LimitationsComment,
                    LaunchDate: program.LaunchDate,
                    ProgramURL: program.ProgramURL,
                    LogoURL: program.LogoURL,
                    TrackingMethod: program.TrackingMethod,
                    CookieLifetime: program.CookieLifetime,
                    SEMPolicyEnum: program.SEMPolicyEnum,
                    ProgramStatusEnum: program.ProgramStatusEnum,
                    ScreenshotURL: program.ScreenshotURL,
                };

                Food.create(data, function (err, food) {
                    if (err)
                        res.render('error');
                    else
                        res.redirect('/controller/food');
                });
            });
        res.redirect('/controller/programs');
    });*/
});

router.get('/programs', function (req, res, next) {
    /*Food.find({}, null, {
        sort: {
            updated_at: -1
        }
    }, function (err, foods) {
        if (err)
            res.render('error');
        else
            res.render('controller/programs', {
                title: 'Programs Manage',
                programs: foods,
                layout: 'controller/layout'
            });
    });*/
    res.json({});
});

router.get('/programs/remove_all', function (req, res, next) {
    /*Food.remove(function (err) {
        if (err)
            res.render('error');
        else
            res.redirect('/controller/programs');
    });*/
});

router.get('/product/remove_all', function (req, res, next) {
    Product.remove(function (err) {
        if (err)
            res.render('error');
        else
            res.redirect('/controller/product');
    });
});

router.get('/product/update', function (req, res, next) {
    var sync = new Sync(Product, req.query.type, req.query.id);
    res.json({
        status: "Processing..."
    });
});

router.get('/product', function (req, res, next) {
    if (req.query.type == "shop") {
        affilinet.getProductListbyShop(req.query.shopid, req.query.currentpage, req.query.pagesize, function (err, results) {
            if (err != null)
                res.render('error');
            else {
                var products = results != null ? (_ref = results.Products) != null ? _ref.Product : void 0 : void 0;
                res.render('controller/products', {
                    title: 'Products Manage',
                    url: '?id=' + req.query.shopid + '&type=shop',
                    products: productConvert(products),
                    layout: 'controller/layout'
                });
            }

        });
    } else if (req.query.type == "category") {
        affilinet.getProductListbyCategory(req.query.categoryid, req.query.currentpage, req.query.pagesize, function (err, results) {

            if (err != null)
                res.render('error');
            else {
                var products = results != null ? (_ref = results.ProductSearchResult) != null ? (_ref = _ref.Products) != null ? _ref.Product : void 0 : void 0 : void 0;
                res.render('controller/products', {
                    title: 'Products Manage',
                    url: '?id=' + req.query.categoryid + '&type=category',
                    products: productConvert(products),
                    layout: 'controller/layout'
                });
            }

        });
    } else {
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
                    url: '',
                    products: products,
                    layout: 'controller/layout'
                });
        });

    }
});

router.get('/category', function (req, res, next) {
    affilinet.getCategoryList(function (err, categorylist) {
        if (err != null)
            res.render('error');
        else {
            res.render('controller/category', {
                title: 'Categories Manage',
                categorylist: categorylist,
                layout: 'controller/layout'
            });
        }

    });
});

router.get('/product/edit', function (req, res, next) {
    Product.findOne({ product_id: req.query.product_id }, function (err, product) {
        if (err != null) res.render('error');
        else {
            res.render('controller/products_edit', {
                title: 'Edit Product',
                product: product,
                layout: 'controller/layout'
            });
        }
    });
});

router.post('/product/edit', function (req, res, next) {
    Product.update({ product_id: req.query.product_id }, {desc_cn: req.body.translate, tranlated: true}, function (err, product) {
        if (err != null) res.render('error');
        else {
            res.redirect('/controller/product');
        }
    });
});

function productConvert(products) {
    var _products = [];
    products.forEach(function (product, index) {
        var _product = {
            product_id: product.Id,
            article_num: product.ArticleNumber,
            ean: product.EAN,
            title: product.Title,
            brand: product.Brand,
            shop_name: product.ShopInformation.ShopName,
            price: product.Price,
            shipping: product.Shipping,
            link: product.DeepLink1,
            category_path: product.CategoryPath,
            image90: product.Image60.ImageUrl
        }
        _products.push(_product);
    });
    return _products;
}

module.exports = router;
