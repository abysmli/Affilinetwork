var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var affilinet = require('../utils/affilinetapis/affilinetapi.js');
var request = require("request");
var setting = require('../setting.js');
var parseString = require('xml2js').parseString;

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

/* GET home page. */
router.get('/', function (req, res, next) {
    var page = req.query.page;
    var pageColum;
    Product.count({}, function (err, count) {
        pageColum = count / 30;
        Product.find({}, null, {
            limit: 30,
            skip: (page - 1) * 30,
            sort: {
                updated_at: -1
            }
        }, function (err, products) {
            if (err != null) res.render('error');
            else {
                res.render('index', {
                    title: 'Home Page',
                    count: count,
                    pageColum: pageColum,
                    currentPage: page,
                    products: products,
                    layout: '/layout'
                });
            }
        });
    });
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

    Affilinet.searchProducts({
        ShopIds: 0,
        CategoryIds: 14
    }, function (error, response, body) {
        res.json(body);
    });
});

module.exports = router;
