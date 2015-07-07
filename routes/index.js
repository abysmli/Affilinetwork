var express = require('express');
var router = express.Router();
var Affilinet = require('../utils/affilinetapis.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/food_details', function(req, res, next) {
    res.render('food_details');
});

router.get('/order_details', function(req, res, next) {
    res.render('order_details');
});

router.get('/my_orders', function(req, res, next) {
    res.render('my_orders');
});

router.get('/about', function(req, res, next) {
    res.render('about');
});

router.get('/home', function(req, res, next){
    res.render('home', {
        title: 'Home Page',
        layout: '/user_layout'
    });
});

module.exports = router;
