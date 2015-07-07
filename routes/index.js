var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var Affilinet = require('../utils/affilinetapis.js');

/* GET home page. */
router.get('/', function (req, res, next) {
    Product.find({}, null, {
            limit: 100,
            sort: {
                updated_at: -1
            }
        }, function (err, products) {
        if (err != null) res.render('error');
        else {
            res.render('home', {
                title: 'Home Page',
                products: products,
                layout: '/user_layout'
            });
        }
    });

});

module.exports = router;