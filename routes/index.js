var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var affilinet = require('../utils/affilinetapi.js');
var aws = require('aws-lib');
var utils = require('../utils/utils.js');
var request = require("request");
var Account = require("../models/account.js");
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var stormpath = require('stormpath');
var setting = require('../setting.js');
var parseString = require('xml2js').parseString;


var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag);

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var utils = require('../utils/utils.js');
var Utils = new utils();

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            if (!user.verifyPassword(password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
));



/* GET home page. */
router.get('/', function(req, res, next) {
    var Utils = new utils();
    var page = req.query.page || 1;
    Product.count({}, function(err, count) {
        var pageColum = count / 50;
        Product.aggregate(
            [{
                "$match": {
                    //Tranlated: true,
                    EAN: {
                        $ne: null
                    }
                },
            }, {
                "$group": {
                    _id: "$EAN",
                    ProductId: {
                        $first: "$ProductId"
                    },
                    Images: {
                        $first: "$Images"
                    },
                    ProductName_cn: {
                        $first: "$ProductName_cn"
                    },
                    Price: {
                        $push: "$PriceInformation.PriceDetails.Price"
                    },
                }
            }, {
                "$skip": (page - 1) * 50,
            }, {
                "$limit": 50
            }, {
                "$sort": {
                    updated_at: -1
                }
            }],
            function(err, products) {
                if (err != null) {
                    console.log(JSON.stringify(err));
                    res.render('error');
                } else {
                    //console.log(JSON.stringify(products));
                    res.render('index', {
                        title: '',
                        count: count,
                        pageColum: pageColum,
                        currentPage: page,
                        products: products,
                        user: req.user,
                        layout: 'layout'
                    });
                }
            });
    });
});


//login
/*router.post('/', passport.authenticate('local', {
    failureRedirect: '/login',
    layout: 'layout',
    title: '错误登录信息'
}), function (req, res) {
    res.redirect('/');

});*/

router.post('/', passport.authenticate('stormpath', {
    failureRedirect: '/login',
    layout: 'layout',
    title: '错误登录信息'
}), function(req, res) {
    res.redirect('/');

});



router.post('/filter', function(req, res, next) {
    var category = req.body.category;
    var minprice = req.body.minprice;
    var maxprice = req.body.maxprice;
    var page = req.query.page || 1;
    Product.count({}, function(err, count) {


    });

});

router.get('/login', function(req, res) {
    res.render('userlogin/login', {
        title: '登录',
        layout: 'layout',
        info: '用户名或密码错误, 请重新填写',
        user: req.user

    });
});

//logout
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});


router.get('/product', function(req, res, next) {
    var query = Product.where({
        ProductId: req.query.product_id,
    });
    query.findOne(function(err, _product) {
        Product.find({
            EAN: _product.EAN
        }, null, function(err, _products) {
            console.log(req.user);
            if (err != null) res.render('error');
            else {
                res.render('product_details', {
                    title: '德国打折商品, 产品描述',
                    product: _product,
                    product_link: req.url,
                    products: _products,
                    layout: '/layout',
                    user: req.user
                });
            }
        });

    });
});

router.get('/test', function(req, res, next) {
    prodAdv.call("ItemLookup", {
        ItemId: "B00PWEYDZC",
        IdType: "ASIN",
        //SearchIndex: "All",
        ResponseGroup: "Medium"
    }, function(err, product) {
        res.json(product);
    });
    
    /*
        var query = {};
        //query.FQ = "EAN:04905524974720";
        query.Query = "Thinkpad"
        Affilinet.searchProducts(query, function(error, response, results) {
            var _product = Utils.fromAffilinetToLocalProduct(results.Products[0]);
            console.log(_product);
            res.json(results);
        });
    */
});


module.exports = router;