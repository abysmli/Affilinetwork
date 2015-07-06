var express = require('express');
var router = express.Router();
var Affilinet = require('../utils/affilinetapis.js');

var affilinet = new Affilinet({
    publisherId: '512499',
    productWebservicePassword: 'FaI69alVX0eZ4i28TnIq',
    publisherWebservicePassword: 'lZONYNI32ieYq8kMPqKS'
});

router.get('/getIndentifierExpiration', function (req, res, next) {
    affilinet.getIndentifierExpiration(function (err, result) {
        if (err != null) {
            throw err;
        }

        res.json(result);
    });
});

router.get('/getShopList', function (req, res, next) {
    affilinet.getShopList(function (err, shops) {
        if (err != null) {
            throw err;
        }

        res.json(shops);
    });
});

router.get('/getCategorys', function (req, res, next) {
    affilinet.getCategorys(function (err, categorys) {
        if (err != null) {
            throw err;
        }

        res.json(categorys);
    });
});

router.get('/getProducts', function (req, res, next) {
    affilinet.getProducts(function (err, products) {
        if (err != null) {
            throw err;
        }

        res.json(products);
    });
});

router.get('/getSalesForDayRange', function (req, res, next) {
    affilinet.getSalesLeadsBySubIdPerDay(new Date("2014-06-01"), new Date(), function (err, sales) {
        if (err != null) {
            throw err;
        }
        res.json(sales);
    });
});

router.get('/getPrograms', function (req, res, next) {
    var displayOptions = {
        CurrentPage: 1,
        PageSize: 100,
    };
    var query = {
        // "Active", "Paused", "Waiting", "Refused", "NoPartnership", "Cancelled"
        PartnershipStatus: ["Active"],
    };
    affilinet.getPrograms(displayOptions, query, function (err, programs) {
        if (err != null) {
            throw err;
        }
        res.json(programs);
    });
});

router.get('/searchCreatives', function (req, res, next) {
    var displayOptions = {
        CurrentPage: 1,
        PageSize: 5,
    };
    var query = {
        ProgramIds: [0]
    };
    affilinet.searchCreatives(displayOptions, query, function (err, creatives) {
        if (err != null) {
            throw err;
        }
        res.json(creatives);
    });
});

module.exports = router;