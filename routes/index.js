var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var Affilinet = require('../utils/affilinetapis.js');
var request = require("request");
var setting = require('../setting.js');
//var test = require('../utils/affilinetapis/requestHandler.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    Product.count({}, function (err, count) {
        Product.find({}, null, {
            limit: 30,
            sort: {
                updated_at: -1
            }
        }, function (err, products) {
            if (err != null) res.render('error');
            else {
                res.render('home', {
                    title: 'Home Page',
                    count: count,
                    products: products,
                    layout: '/user_layout'
                });
            }
        });
    });
});

router.get('/product_des', function (req, res, next) {
    res.render('product_des', {
        title: '德国打折商品, 产品描述',
        layout: '/user_layout'

    });

});

router.get('/test', function (req, res, next) {
    request({
            url: "http://product-api.affili.net/V3/productservice.svc/JSON/GetShopList",
            qs: {
                publisherId: setting.affilinet_setting.publisherId,
                Password: setting.affilinet_setting.productWebservicePassword,
                CurrentPage: 1,
                PageSize: 500,
                LogoScale: "Logo120",
            },
            encoding: 'utf8',
            json: true
        },
        function (error, response, body) {
            //var result = JSON.parse(body.toString('utf8').replace(/^\uFEFF/, ''));
            console.log(body.Shops[0]);
        });
});

module.exports = router;
