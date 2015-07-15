var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var Affilinet = require('../utils/affilinetapis.js');

/* GET home page. */
router.get('/', function (req, res, next) {
        Product.count({}, function (err, count){
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

router.get('/product_des', function(req, res, next){
    res.render('product_des', {
        title: '德国打折商品, 产品描述',
        layout: '/user_layout'

    });

});

module.exports = router;
