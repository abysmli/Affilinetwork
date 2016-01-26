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
    var mainPage = false;
    var _category = category;
    var ItemOnPage = 30;
    if (category == "" || category == "所有") {
        _category = {
            $in: ["服装鞋子", "食品饮食", "厨房用具", "电子产品", "手机平板", "化妆品", "健康保健", "旅游", "其他", "母婴"]
        };
    }
    if (sort == '按价格由低到高') {
        sort = {
            Price: 1
        };
    } else if (sort == '按价格由高到低') {
        sort = {
            Price: -1
        };
    } else if (sort == '按热度') {
        sort = {
            SaleRank: -1
        };
    } else {
        sort = {
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
            $push: "$TitleCN"
        },
        DescriptionCN: {
            $push: "$DescriptionCN"
        },
        Price: {
            $push: "$Price"
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
            $or: [{
                Title: new RegExp(search, 'gi')
            }, {
                TitleCN: new RegExp(search, 'gi')
            }, {
                Category: new RegExp(search, 'gi')
            }, {
                Keywords: new RegExp(search, 'gi')
            }]
        }]
    };
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
            "$sort": sort
        }], function(err, products) {
            if (err != null) {
                next(err);
            } else {
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
                        var iterateNumber=0;
                        hotproducts.forEach(function(hotproduct, index) {
                            Product.find({
                                EAN: hotproduct._id
                            }).stream ()
                            .on ("error", function (err) {
                                next(err);
                            })
                            .on ("data", function (_hotproduct) {
                                hotproduct.ProductName.push(_hotproduct.TitleCN);
                                hotproduct.DescriptionCN.push(_hotproduct.DescriptionCN);
                                hotproduct.Price.push(_hotproduct.Price);
                            })
                            .on ("close", function () {
                                if ( ++iterateNumber == hotproducts.length) {
                                    res.render('index', {
                                        title: 'Allhaha',
                                        footer_bottom: false,
                                        mainPage: mainPage,
                                        pages: pages,
                                        currentPage: page,
                                        products: products,
                                        hotproducts: hotproducts,
                                        category: '所有',
                                        sort: '按日期',
                                        user: req.user,
                                        layout: 'layout'
                                    });
                                }
                            });
                        });
                    });
                } else {
                    res.render('index', {
                        title: 'Allhaha',
                        footer_bottom: false,
                        mainPage: mainPage,
                        pages: pages,
                        currentPage: page,
                        products: products,
                        category: '所有',
                        sort: '按日期',
                        user: req.user,
                        layout: 'layout'
                    });
                }
            }
        });
    });
});

router.post('/', passport.authenticate('stormpath', {
    failureRedirect: '/login',
    layout: 'layout',
    title: '错误登录信息'
}), function(req, res, next) {
    res.redirect('/');
});

router.get('/login', function(req, res, next) {
    res.render('userlogin/login', {
        title: '登录',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
        info: '用户名或密码错误, 请重新填写',
        user: req.user
    });
});

//logout
router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/');
});

router.get('/product', function(req, res, next) {
    var query = Product.where({
        _id: req.query.product_id,
    });
    query.findOne(function(err, _product) {
        Product.find({
            EAN: _product.EAN
        }, null, function(err, _products) {
            if (err != null) next(err);
            else {
                res.render('product_details', {
                    title: '德国打折商品, 产品描述',
                    footer_bottom: !Utils.checkMobile(req),
                    product: _product,
                    product_link: req.url,
                    products: _products,
                    layout: '/layout',
                    user: req.user
                });
            }
        });
    });
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
                            result: "已经成功加入收藏夹!"
                        });
                    }
                });
            } else {
                return res.json({
                    result: "该收藏已经存在！"
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
        Product.find({
            'EAN': {
                $in: productEANs
            }
        }, function(err, products) {
            res.render('favourite', {
                title: '用户收藏',
                footer_bottom: !Utils.checkMobile(req),
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
            return res.redirect('/favourite');
        }
    });
});

router.get('/article', function(req, res, next) {
    Article.find({}, function(err, articles) {
        res.render('article', {
            title: '精彩的文章',
            footer_bottom: false,
            articles: articles,
            user: req.user
        });
    });
});

router.get('/article_detail', function(req, res, next) {
    Article.findById(req.query.id, function(err, article) {
        if (article) {
            res.render('article_details', {
                title: "精彩的文章",
                footer_bottom: !Utils.checkMobile(req),
                article: article,
                user: req.user
            });
        } else {
            next(err);
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
        res.render('voucher', {
            title: '折扣券',
            footer_bottom: false,
            vouchers: vouchers,
            user: req.user
        });
    });
});

router.get('/aboutus', function(req, res, next) {
    res.render('aboutus', {
        title: '关于我们',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
        user: req.user,
    });
});

router.get('/contact', function(req, res, next) {
    res.render('contactus', {
        title: '联系我们',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
        user: req.user,
    });
});

router.post('/contact', function(req, res, next) {
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
        subject: '非常感谢您的回馈信息',
        template: 'email_template',
        content: {
            title: "非常感谢您的回馈信息",
            content: "非常感谢您的回馈信息，我们将尽快进行处理，并由相关的客服人员与您联系！",
            image: "",
            url: req.protocol + '://' + req.get('host')
        }
    }, function(err) {
        if (err) return next(err);
    });

    new Feedback(feedback).save(function(err, todo, count) {
        res.redirect('/');
    });
});

router.get('/product_request', function(req, res, next) {
    res.render('product_request', {
        title: '产品请求',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
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
