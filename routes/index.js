var express = require('express');
var router = express.Router();
var Affilinet = require('../utils/affilinetapis.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('home', {
        title: 'Home Page',
        layout: '/user_layout'
    });
});

module.exports = router;
