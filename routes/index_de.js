var express = require('express');
var router = express.Router();

var request = require("request");
var aws = require('aws-lib');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var parseString = require('xml2js').parseString;

var setting = require('../setting');
var Product = require('../models/product');
var Favourite = require('../models/favourite');
var Article = require('../models/article');
var Voucher = require('../models/voucher');
var Feedback = require('../models/feedback');
var Request = require('../models/request');
var Account = require("../models/account");

var affilinet = require('../utils/affilinetapi');

var emailSender = require('../utils/emailsender');
var EmailSender = new emailSender();

var utils = require('../utils/utils.js');
var Utils = new utils();

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

passport.use(new LocalStrategy(
    function(username, password, done) {
        User.findOne({
            username: username
        }, function(err, user) {
            if (err) {
                return done(err);
            }
            if (!user) {
                return done(null, false);
            }
            if (!user.verifyPassword(password)) {
                return done(null, false);
            }
            return done(null, user);
        });
    }
));

/* GET home page. */
router.get('/', function(req, res, next) {
    var Utils = new utils();
    var page = req.query.page || 1;
    var search = req.query.search || "";
    var category = req.query.category || "";
    var minprice = req.query.minprice || Number.NEGATIVE_INFINITY;
    var maxprice = req.query.maxprice || Number.POSITIVE_INFINITY;
    var sort = req.query.sort || "";
    var brand = req.query.brand || "";
    var mainPage = false;
    var _category = Utils.urlToCategory(category);
    var _sort = {};
    var _brand = brand;
    var ItemOnPage = 30;
    if (category == "" || category == "all") _category = {
        $exists: true
    };
    if (brand == "" || brand == "all") _brand = {
        $exists: true
    };
    if (sort == 'price_asc') {
        _sort = {
            Price: 1
        };
    } else if (sort == 'price_desc') {
        _sort = {
            Price: -1
        };
    } else if (sort == 'rank') {
        _sort = {
            SaleRank: -1
        };
    } else {
        _sort = {
            updated_at: -1
        };
    }
    var group = {
        _id: "$EAN",
        ProductId: {
            $first: "$_id"
        },
        Images: {
            $first: "$ProductImage"
        },
        ProductName: {
            $push: "$Title"
        },
        Description: {
            $push: "$Description"
        },
        Price: {
            $push: "$Price"
        },
        updated_at: {
            $first: "$updated_at"
        }
    };
    var matchQuery = {
        $and: [{
            EAN: {
                $ne: 'null'
            },
            Price: {
                $lte: Number(maxprice),
                $gte: Number(minprice)
            },
            Category: _category,
            Brand: _brand,
            $or: [{
                Title: new RegExp(search, 'gi')
            }, {
                Category: new RegExp(search, 'gi')
            }, {
                Keywords: new RegExp(search, 'gi')
            }]
        }]
    };
    Product.aggregate([{
        "$match": matchQuery
    }, {
        "$group": {
            _id: "$Brand",
            Sum: {
                $sum: 1
            },
        }
    }, {
        "$sort": {
            "_id": 1
        }
    }], function(err, brands) {
        Product.distinct("EAN", matchQuery, function(err, results) {
            var pages = Math.ceil(results.length / ItemOnPage);
            Product.aggregate([{
                "$match": matchQuery
            }, {
                "$group": group
            }, {
                "$skip": (page - 1) * ItemOnPage
            }, {
                "$limit": ItemOnPage
            }, {
                "$sort": _sort
            }], function(err, products) {
                if (err != null) {
                    next(err);
                } else {
                    var iterateNum = 0;
                    if (products.length != 0) {
                        products.forEach(function(product, index) {
                            Product.find({
                                EAN: product._id
                            }).stream()
                                .on("error", function(err) {
                                    next(err);
                                })
                                .on("data", function(_product) {
                                    product.ProductName.push(_product.Title);
                                    product.Description.push(_product.Description);
                                    product.Price.push(_product.Price);
                                })
                                .on("close", function() {
                                    if (++iterateNum == products.length) {
                                        if (page == 1 && search == "" && category == "" && minprice == Number.NEGATIVE_INFINITY && maxprice == Number.POSITIVE_INFINITY) {
                                            mainPage = true;
                                            Product.aggregate([{
                                                "$match": {
                                                    $and: [{
                                                        EAN: {
                                                            $ne: 'null'
                                                        },
                                                        SalesRank: {
                                                            $lte: 15,
                                                            $gte: 1
                                                        }
                                                    }]
                                                }
                                            }, {
                                                "$group": group
                                            }, {
                                                "$sort": {
                                                    SalesRank: -1
                                                }
                                            }], function(err, hotproducts) {
                                                var iterateNumber = 0;
                                                hotproducts.forEach(function(hotproduct, index) {
                                                    Product.find({
                                                        EAN: hotproduct._id
                                                    }).stream()
                                                        .on("error", function(err) {
                                                            next(err);
                                                        })
                                                        .on("data", function(_hotproduct) {
                                                            hotproduct.ProductName.push(_hotproduct.Title);
                                                            hotproduct.Description.push(_hotproduct.Description);
                                                            hotproduct.Price.push(_hotproduct.Price);
                                                        })
                                                        .on("close", function() {
                                                            if (++iterateNumber == hotproducts.length) {
                                                                res.render('index_de', {
                                                                    title: 'Allhaha - Preisvergleich und Gutscheine',
                                                                    footer_bottom: false,
                                                                    mainPage: mainPage,
                                                                    pages: pages,
                                                                    currentPage: page,
                                                                    products: products,
                                                                    hotproducts: hotproducts,
                                                                    category: Utils.urlToCategory(category),
                                                                    minprice: req.query.minprice || "",
                                                                    maxprice: req.query.maxprice || "",
                                                                    brand: brand,
                                                                    brands: brands,
                                                                    sort: sort,
                                                                    user: req.user,
                                                                    layout: 'layout_de'
                                                                });
                                                            }
                                                        });
                                                });
                                            });
                                        } else {
                                            res.render('index_de', {
                                                title: 'Allhaha - Preisvergleich und Gutscheine',
                                                footer_bottom: false,
                                                mainPage: mainPage,
                                                pages: pages,
                                                currentPage: page,
                                                products: products,
                                                category: Utils.urlToCategory(category),
                                                minprice: req.query.minprice || "",
                                                maxprice: req.query.maxprice || "",
                                                brand: brand,
                                                brands: brands,
                                                sort: sort,
                                                user: req.user,
                                                layout: 'layout_de'
                                            });
                                        }
                                    }
                                });
                        });
                    } else {
                        res.render('notfound_de', {
                            title: 'Produkte nicht gefunden',
                            footer_bottom: !Utils.checkMobile(req),
                            layout: 'layout_de'
                        });
                    }
                }
            });
        });
    });
});

router.get('/product', function(req, res, next) {
    var currenturl = req.protocol + '://' + req.get('host') + req.originalUrl;;
    var query = Product.where({
        _id: req.query.product_id,
    });
    query.findOne(function(err, _product) {
        if (_product != undefined && _product != {}) {
            Product.find({
                EAN: _product.EAN
            }, null, {
                sort: {
                    Price: 1
                }
            }, function(err, _products) {
                if (err != null) next(err);
                else {
                    res.render('product_details_de', {
                        title: _product.Title,
                        footer_bottom: !Utils.checkMobile(req),
                        product: _product,
                        currenturl: currenturl,
                        product_link: req.url,
                        products: _products,
                        layout: '/layout_de',
                        user: req.user
                    });
                }
            });
        } else {
            next(err);
        }
    });
});

router.post('/', passport.authenticate('stormpath', {
    failureRedirect: '/de/login',
    layout: 'layout_de',
    title: 'Fehler beim Einloggen'
}), function(req, res, next) {
    res.redirect('/de');
});

router.get('/login', function(req, res, next) {
    res.render('userlogin/login_de', {
        title: 'Anmelden',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout_de',
        info: 'Fehler beim Einloggen. Bitte geben Sie Benutzername und Password erneut ein.',
        user: req.user
    });
});

//logout
router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/de');
});

router.post('/favourite', function(req, res, next) {
    var data = {
        Username: req.body.Username,
        ProductEAN: req.body.ProductEAN,
    };
    if (data.Username != "" && data.Username != undefined && data.ProductEAN != "" && data.ProductEAN != undefined) {
        var query = Favourite.where(data);
        query.findOne(function(err, _favourite) {
            if (err) return res.status(500).send('Service Error!');
            if (!_favourite) {
                Favourite.create(data, function(err, favourite) {
                    if (err) {
                        return res.status(500).send('Service Error!');
                    } else {
                        return res.json({
                            result: "Ware wurde in der Merkliste hinzugefügt!"
                        });
                    }
                });
            } else {
                return res.json({
                    result: "Bereits in der Merkliste！"
                });
            }
        });
    } else {
        res.status(500).send('Service Error!');
    }
});

router.get('/favourite', function(req, res, next) {
    Favourite.find({
        Username: req.user.username
    }, function(err, favourites) {
        var productEANs = [];
        favourites.forEach(function(favourite) {
            productEANs.push(favourite.ProductEAN);
        });
        var group = {
            _id: "$EAN",
            ProductId: {
                $first: "$_id"
            },
            ProductImage: {
                $first: "$ProductImage"
            },
            Title: {
                $push: "$Title"
            },
            Description: {
                $push: "$Description"
            },
            Price: {
                $push: "$Price"
            }
        };
        var matchQuery = {
            EAN: {
                $in: productEANs
            }
        };
        Product.aggregate([{
            "$match": matchQuery
        }, {
            "$group": group
        }], function(err, products) {
            res.render('favourite_de', {
                title: 'Merkliste',
                footer_bottom: !Utils.checkMobile(req),
                layout: 'layout_de',
                products: products,
                user: req.user
            });
        });
    });
});

router.get('/favourite/remove', function(req, res, next) {
    Favourite.remove({
        Username: req.user.username,
        ProductEAN: req.query.ean
    }, function(err, feedback) {
        if (err != null) next(err);
        else {
            return res.redirect('/de/favourite');
        }
    });
});

router.get('/voucher', function(req, res, next) {
    Voucher.find({
        EndDate: {
            $gte: new Date()
        }
    }).sort({
        updated_at: -1
    }).exec(function(err, vouchers) {
        res.render('voucher_de', {
            title: 'Coupon',
            footer_bottom: false,
            layout: 'layout_de',
            vouchers: vouchers,
            user: req.user
        });
    });
});

router.get('/aboutus', function(req, res, next) {
    res.render('aboutus', {
        title: '关于我们',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout_de',
        user: req.user,
    });
});

router.get('/kontakt', function(req, res, next) {
    res.render('contact_de', {
        title: 'Kontakt',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout_de',
        user: req.user,
    });
});

router.get('/impressum', function(req, res, next) {
    res.render('impressum_de', {
        title: 'Impressum',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout_de',
        user: req.user,
    });
});

router.post('/kontakt', function(req, res, next) {
    var feedback = {
        name: req.body.name,
        email: req.body.email,
        subtitle: req.body.subject,
        feedback: req.body.message
    };

    EmailSender.send({
        to: "info@allhaha.com",
        subject: 'Feedback from ' + feedback.name,
        template: 'email_template',
        content: {
            title: feedback.subtitle,
            content: feedback.feedback,
            image: "",
            url: req.protocol + '://' + req.get('host')
        }
    }, function(err) {
        if (err) return next(err);
    });

    EmailSender.send({
        to: feedback.email,
        subject: 'Vielen Dank für Ihre Ideen',
        template: 'email_template',
        content: {
            title: "Vielen Dank für Ihre Ideen",
            content: "Vielen Dank für Ihre Aufmerksamkeit. Wir werden schnell wie möglich mit Ihnen im Kontakt setzen！",
            image: "",
            url: req.protocol + '://' + req.get('host')
        }
    }, function(err) {
        if (err) return next(err);
    });

    new Feedback(feedback).save(function(err, todo, count) {
        res.redirect('/de');
    });
});

router.get('/product_request', function(req, res, next) {
    res.render('product_request_de', {
        title: 'Von Ihnen gesuchte Produkte',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout_de',
        user: req.user,
    });
});

router.post('/product_request', function(req, res, next) {
    var request = {
        name: req.body.name,
        email: req.body.email,
        description: req.body.description,
        image: JSON.parse(req.body.image)
    };

    EmailSender.send({
        to: "info@allhaha.com",
        subject: 'Product Request from ' + request.name,
        template: 'email_template',
        content: {
            title: 'Product Request from ' + request.name,
            content: request.description,
            image: request.image,
            url: req.protocol + '://' + req.get('host')
        }
    }, function(err) {
        if (err) return next(err);
    });

    EmailSender.send({
        to: request.email,
        subject: '非常感谢您的产品请求',
        template: 'email_template',
        content: {
            title: "非常感谢您的产品请求",
            content: "非常感谢您的产品请求，我们的采购人员会以最快的速度找到您要的产品并告知您！",
            image: "",
            url: req.protocol + '://' + req.get('host')
        }
    }, function(err) {
        if (err) return next(err);
    });

    new Request(request).save(function(err, todo, count) {
        res.redirect('/');
    });
});

module.exports = router;