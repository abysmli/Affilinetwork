var express = require('express');
var router = express.Router();
var Order = require('../models/order.js');
var auth = require('../models/auth.js');

router.post('/getAll', function(req, res, next) {
	var data = {};
	Order.find(data, function (err, orders) {
		if (err) 
			res.json(err);
		else
			res.json(orders);
	});
});

router.post('/add', function(req, res, next) {
	var data = {
		name: req.body.name,
		pickup_date: req.body.pickup_date,
		amount: req.body.amount,
		pickup_status: false,
		device_info: req.body.device_info,
		ip: req.body.ip,
		phone_number: req.body.phone_number,
	};

	Order.create(data, function(err, order) {
	    if(err) 
	    	res.json(err);
	    else 
	    	res.json({status: 'success', order_no: order.order_no, message:'Successfully Add Order Record!'});
	});

});

router.post('/update', auth, function(req, res, next) {
	var data = {
		id: req.body.id,
		pickup_status: req.body.pickup_status,
	};
	Order.update({ order_no: data.id }, { pickup_status: data.pickup_status }, function (err, numberAffected, raw) {
		if (err) 
			res.json(err);
		else
			res.json({status: 'success', message:'Successfully Add Order Record!'});
	});		
});

router.post('/remove', auth, function(req, res, next) {
	var query;
	if (req.body['remove_order_no[]'].constructor == Array) {
		query = {$in: req.body['remove_order_no[]']};
	} else {
		query = req.body['remove_order_no[]'];
	}
	Order.remove({order_no: query}, function (err) {
  		if (err) 
			res.json(err);
		else
			res.json({status: 'success', message:'Successfully Add Order Record!'});
	});
});

module.exports = router;