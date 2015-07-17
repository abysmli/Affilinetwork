var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var Affilinet = require('../utils/affilinetapis.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    var page = req.query.page;
    var pageColum;
    Product.count({}, function (err, count) {
        pageColum = count/30;

        Product.find({}, null, {
            limit: 30,
            skip: (page-1)*30,
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

module.exports = router;
