var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var affilinet = require('../utils/affilinetapis/affilinetapi.js');
var request = require("request");
var Account = require("../models/account.js");
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;

var setting = require('../setting.js');
var parseString = require('xml2js').parseString;

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

passport.use(new LocalStrategy(
    function (username, password, done) {
        User.findOne({
            username: username
        }, function (err, user) {
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
router.get('/', function (req, res, next) {
    var page = req.query.page;
    var pageColum;
    Product.count({}, function (err, count) {

        pageColum = count / 30;
        Product.find({},null, {
            limit: 30,
            skip: (page - 1) * 30,
            sort: {
                updated_at: -1
            }
        }, function (err, products) {
            if (err != null) res.render('error');
            else {
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
router.post('/', passport.authenticate('local', {failureRedirect: '/login', layout: 'layout', title: '错误登录信息'}), function (req, res) {
    res.redirect('/');

});

router.post('/filter', function(req, res, next){
    Product.aggregate([
    {
        $match: {$ne: null}
    }], function(err, result){
        console.log(result);
    });
});

router.get('/login', function (req, res){
    res.render('userlogin/login', {
        title: '登录',
        layout: 'layout',
        info: '用户名或密码错误, 请重新填写',
        user: req.user

    });

});

//logout
router.get('/logout', function(req, res){
    req.logout();
    res.redirect('/');
});


router.get('/product', function (req, res, next) {
    var query = Product.where({
        ProductId: req.query.product_id
    });
    query.findOne(function (err, product) {
        res.render('product_details', {
            title: '德国打折商品, 产品描述',
            product: product,
            layout: '/layout'
        });
    });
});

router.get('/test', function (req, res, next) {
    /*Affilinet.getTransactions({StartDate: new Date("2000-01-01"), EndDate: new Date()}, function (error, response, results) {
        if (!error && response.statusCode == 200) {
            parseString(results, {ignoreAttrs: true, mergeAttrs: true}, function (err, result) {
                res.json(result);
            });
        } else {
            res.json(response);
        }
    });*/
    Product.find({
        EAN: {
            $ne: null
        }
    }, null, function (err, products) {
        var _products = [];
        products.forEach(function (product, index) {
            _products.push({
                ProductId: product.ProductId,
                Image: product.Images[0][0].URL,
                ProductName_cn: product.ProductName_cn,
                DisplayPrice: [product.PriceInformation.DisplayPrice],
                EAN: product.EAN
            });
        });
        res.json(_products);
    });
});





module.exports = router;
