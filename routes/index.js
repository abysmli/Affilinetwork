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
    var query = {
        ShopIds: 0,
        Query: "tft",
        //FQ: "Title:Schule",
        FQ: "Brand:Sony",
        FQ: "EAN:04901780681921"
    };
    Affilinet.searchProducts(query, function (error, response, results) {
        if (!error && response.statusCode == 200) {
            var counter = results.ProductsSummary.TotalRecords;
            var products = results.Products;
            res.render('controller/products', {
                title: 'Products Manage',
                shopid: 0,
                categoryid: 0,
                type: 'remote',
                counter: counter,
                products: products,
                layout: 'controller/layout'
            });
        } else {
            console.log(JSON.stringify(response));
            res.render('error');
        }
    });
});

module.exports = router;
