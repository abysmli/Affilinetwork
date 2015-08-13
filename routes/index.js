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
                    title: '',
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
