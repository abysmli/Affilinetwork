var express = require('express');
var router = express.Router();
var Affilinet = require('../utils/affilinetapis.js');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index');
});

router.get('/user_layout', function(req, res, next){
    res.render('');
});

module.exports = router;
