var express = require('express');
var router = express.Router();
//var Order = require('../models/order.js');
var Food = require('../models/food.js');
//var sss = require('../models/program.js');
var auth = require('../models/auth.js');

var Affilinet = require('../utils/affilinetapis.js');

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
    var displayOptions = {
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
    });
});

router.get('/programs', function (req, res, next) {
    Food.find({}, null, {
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
    });
});

router.get('/programs/remove_all', function (req, res, next) {
    Food.remove(function (err) {
        if (err)
            res.render('error');
        else
            res.redirect('/controller/programs');
    });
});

router.get('/product', function (req, res, next) {
    if (req.query.type == "shop") {
        affilinet.getProductListbyShop(parseInt(req.query.shopid), function (err, results) {
            if (err != null)
                res.render('error');
            else {
                var products = results != null ? (_ref = results.Products) != null ? _ref.Product : void 0 : void 0;
                res.render('controller/products', {
                    title: 'Products Manage',
                    products: products,
                    layout: 'controller/layout'
                });
            }

        });
    } else if (req.query.type == "category") {
        affilinet.getProductListbyCategory(parseInt(req.query.categoryid), function (err, results) {
            if (err != null)
                res.render('error');
            else {
                var products = results != null ? (_ref = results.ProductSearchResult) != null ? (_ref = _ref.Products) != null ? _ref.Product : void 0 : void 0 : void 0
                res.render('controller/products', {
                    title: 'Products Manage',
                    products: products,
                    layout: 'controller/layout'
                });
            }

        });
    } else {
        res.json({});
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

module.exports = router;