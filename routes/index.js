var express = require('express');
var router = express.Router();
var Affilinet = require('affilinet');

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

router.get('/test', function(req, res, next) {
	var affilinet = new Affilinet({
		publisherId: '512499',
		productWebservicePassword: 'FaI69alVX0eZ4i28TnIq',
		publisherWebservicePassword: 'lZONYNI32ieYq8kMPqKS'
	});

	affilinet.getShops(function(err, shops) {
		if (err != null) {
			throw err;
		}

		//console.log(shops);
		return affilinet.getSalesForDayRange(startDate, endDate, function(err, sales) {
			if (err != null) {
				throw err;
			}
			return console.log(sales);
		});
	});
});

module.exports = router;