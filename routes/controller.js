var express = require('express');
var router = express.Router();
//var Order = require('../models/order.js');
var Food = require('../models/food.js');
//var sss = require('../models/program.js');
var auth = require('../models/auth.js');

var Affilinet = require('../utils/affilinetapis.js');
	
var affilinet = new Affilinet({
	publisherId: '512499',
	productWebservicePassword: 'FaI69alVX0eZ4i28TnIq',
	publisherWebservicePassword: 'lZONYNI32ieYq8kMPqKS'
});

/* GET users listing. */
router.get('/', auth, function(req, res, next) {
	affilinet.getShops(function(err, shops) {
		if (err != null) 
			res.render('error');
		else
			res.render('controller/index', {
				title: 'Shops Manage',
				shops: shops,
				layout:'controller/layout'
			});
	});
});


router.get('/programs/update', function(req, res, next) {
	var displayOptions = {
		CurrentPage: 1,
		PageSize: 10,
	};
	var query = {
		// "Active", "Paused", "Waiting", "Refused", "NoPartnership", "Cancelled"
		PartnershipStatus: ["Active"],
	};
	affilinet.getPrograms(displayOptions, query, function(err, programs) {

		if (err != null) 
			res.render('error');
		else
		programs.forEach(function(program){

			var data = {
					ProgramId: program.ProgramId,
					ProgramTitle: program.ProgramTitle,
					ProgramDescription: program.ProgramDescription,
					PartnershipStatus: program.PartnershipStatus,
					ProgramClassificationEnum: program.ProgramClassificationEnum,
					LimitationsComment: program.LimitationsComment,
					LaunchDate: program.LaunchDate,
					ProgramURL: program.ProgramURL,
					LogoURL: program.LogoURL,
					TrackingMethod: program.TrackingMethod,
					CookieLifetime: program.CookieLifetime,
					SEMPolicyEnum: program.SEMPolicyEnum,
					ProgramStatusEnum: program.ProgramStatusEnum,
					ScreenshotURL: program.ScreenshotURL,
				};

				Food.create(data, function(err, food){
				    if(err) 
				    	res.render('error');
				    else 
				    	res.redirect('/controller/food');
				});
			});
		res.redirect('/controller/programs');
	});
});

router.get('/programs', function(req, res, next) {
	Food.find({},null,{sort: {updated_at: -1}}, function (err, foods) {
		if (err) 
			res.render('error');
		else
			res.render('controller/programs', {
				title: 'Programs Manage',
				programs: foods,
				layout:'controller/layout'
			});		
	});
});

router.get('/programs/remove_all', function(req, res, next) {
	Food.remove(function (err) {
		if (err) 
			res.render('error');
		else
			res.redirect('/controller/programs');
	});
});

/*
router.get('/food', auth, function(req, res, next) {
	Food.find({},null,{sort: {updated_at: -1}}, function (err, foods) {
		if (err) 
			res.render('error');
		else
			res.render('controller/food', {
				title: '菜品管理',
				foods: foods,
				layout:'controller/layout'
			});
	});
});

router.get('/food', auth, function(req, res, next) {
	Food.find({},null,{sort: {updated_at: -1}}, function (err, foods) {
		if (err) 
			res.render('error');
		else
			res.render('controller/food', {
				title: '菜品管理',
				foods: foods,
				layout:'controller/layout'
			});
	});
});

router.get('/food/add', auth, function(req, res, next) {
	res.render('controller/food_add', {
		title: '菜品管理 - 添加',
		layout:'controller/layout'
	});
});

router.post('/food/add', auth, function(req, res, next) {
	var data = {
		number: req.body.number,
		name: req.body.name,
		details: req.body.details,
		price: req.body.price,
		suspend_status: false,
		image: req.body.image,
	};

	Food.create(data, function(err, food){
	    if(err) 
	    	res.render('error');
	    else 
	    	res.redirect('/controller/food');
	});
});

router.get('/food/edit', auth, function(req, res, next) {
	Food.findOne({_id: req.query.food_id}, function (err, food) {
		if (err) 
			res.render('error');
		else
			res.render('controller/food_edit', {
				title: '菜品管理 - 编辑',
				food: food,
				layout:'controller/layout'
			});
	});
});

router.post('/food/edit', auth, function(req, res, next) {
	var data = {
		number: req.body.number,
		name: req.body.name,
		details: req.body.details,
		price: req.body.price,
		suspend_status: false,
	};
	if (req.body.image.length != 0) {
		data.image=req.body.image;
	}
	Food.update({_id: req.query.food_id}, data, function(err, food){
	    if(err) 
	    	res.render('error');
	    else 
	    	res.redirect('/controller/food');
	});
});

router.get('/food/suspend', auth, function(req, res, next) {
	Food.update({_id: req.query.food_id}, {suspend_status: req.query.suspend}, function(err, food){
	    if(err) 
	    	res.render('error');
	    else 
	    	res.redirect('/controller/food');
	});
});

router.get('/food/remove', auth, function(req, res, next) {
	Food.remove({ _id: req.query.food_id }, function (err) {
		if (err) 
			res.render('error');
		else
			res.redirect('/controller/food');
	});
});

router.get('/food/remove_all', auth, function(req, res, next) {
	Food.remove(function (err) {
		if (err) 
			res.render('error');
		else
			res.redirect('/controller/food');
	});
});*/

module.exports = router;
