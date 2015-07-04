var express = require('express');
var router = express.Router();
var Food = require('../models/food.js');
var auth = require('../models/auth.js');

router.post('/getAll', function(req, res, next) {
	Food.find({suspend_status: false}, function (err, foods) {
		if (err) 
			res.json(err);
		else
			res.json(foods);
	});
});

router.post('/add', auth, function(req, res, next) {
	var data = {};

	Food.create(data, function(err, food){
	    if(err) 
	    	res.json(err);
	    else 
	    	res.json({status: 'success', message:'Successfully Add Food Record!'});
	});

});

router.post('/update', auth, function(req, res, next) {
	var data = {};
	Food.update({ _id: 0 }, data, function (err, numberAffected, raw) {
		if (err) 
			res.json(err);
		else
			res.json({status: 'success', message:'Successfully Add Food Record!'});
	});		
});

router.post('/remove', auth, function(req, res, next) {
	var data = {};
	Food.remove(data, function (err) {
  		if (err) 
			res.json(err);
		else
			res.json({status: 'success', message:'Successfully Add Food Record!'});
	});
});

module.exports = router;