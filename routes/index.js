var express = require('express');
var router = express.Router();

var ejs = require('ejs');
var request = require("request");
var aws = require('aws-lib');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var stormpath = require('stormpath');
var parseString = require('xml2js').parseString;

var setting = require('../setting.js');
var Product = require('../models/product.js');
var Favourite = require('../models/favourite.js');
var Article = require('../models/article.js');
var Voucher = require('../models/voucher.js');
var Feedback = require('../models/feedback.js');
var Request = require('../models/request.js');
var Account = require("../models/account.js");

var affilinet = require('../utils/affilinetapi.js');
var emailSender = require('../utils/emailsender.js');
var EmailSender = new emailSender();
var utils = require('../utils/utils.js');
var Utils = new utils();

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag);

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
    var hotproduct;
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
        "$group": {
            _id: "$EAN",
            ProductId: {
                $first: "$_id"
            },
            Images: {
                $first: "$ProductImage"
            },
            ProductName: {
                $first: "$TitleCN"
            },
            DescriptionCN: {
                $first: "$DescriptionCN"
            },
            Price: {
                $push: "$Price"
            }
        }
    }, {
        "$sort": {
            update_at: -1
        }
    }], function(err, hotresult) {
        hotproduct = hotresult;
    });
    Product.count({}, function(err, count) {
        var pageColum = count / 50;
        Product.aggregate(
            [{
                "$match": {
                    EAN: {
                        $ne: null
                    }
                },
            }, {
                "$group": {
                    _id: "$EAN",
                    ProductId: {
                        $first: "$_id"
                    },
                    Images: {
                        $first: "$ProductImage"
                    },
                    ProductName: {
                        $first: "$TitleCN"
                    },
                    DescriptionCN: {
                        $first: "$DescriptionCN"
                    },
                    Price: {
                        $push: "$Price"
                    },
                }
            }, {
                "$skip": (page - 1) * 50,
            }, {
                "$limit": 50
            }, {
                "$sort": {
                    updated_at: -1
                }
            }],
            function(err, products) {
                if (err != null) {
                    next(err);
                } else {
                    res.render('index', {
                        title: 'Allhaha',
                        count: count,
                        pageColum: pageColum,
                        currentPage: page,
                        products: products,
                        hotproducts: hotproduct,
                        category: '所有',
                        sort: '按日期',
                        user: req.user,
                        layout: 'layout'
                    });
                }
            });
    });
});

router.get('/pagination', function(req, res, next) {
    var page = req.query.page;
    if (page == 1) {
        res.redirect('/');
    } else {
        Product.count({}, function(err, count) {
            var pageColum = count / 50;
            Product.aggregate(
                [{
                    "$match": {
                        EAN: {
                            $ne: null
                        }
                    },
                }, {
                    "$group": {
                        _id: "$EAN",
                        ProductId: {
                            $first: "$_id"
                        },
                        Images: {
                            $first: "$ProductImage"
                        },
                        ProductName: {
                            $first: "$TitleCN"
                        },
                        DescriptionCN: {
                            $first: "$DescriptionCN"
                        },
                        Price: {
                            $push: "$Price"
                        },
                    }
                }, {
                    "$skip": (page - 1) * 50,
                }, {
                    "$limit": 50
                }, {
                    "$sort": {
                        updated_at: -1
                    }
                }],
                function(err, products) {
                    if (err != null) {
                        next(err);
                    } else {
                        res.render('searchproduct', {
                            title: 'Allhaha',
                            count: count,
                            pageColum: pageColum,
                            currentPage: page,
                            products: products,
                            category: '所有',
                            sort: '按日期',
                            user: req.user,
                            layout: 'layout'
                        });
                    }
                });
        });
    }

});

router.post('/', passport.authenticate('stormpath', {
    failureRedirect: '/login',
    layout: 'layout',
    title: '错误登录信息'
}), function(req, res, next) {
    res.redirect('/');
});


router.post('/filter', function(req, res, next) {
    var category = req.body.category;
    var minprice = req.body.minprice;
    var maxprice = req.body.maxprice;
    var sort = req.body.sort;
    var page = req.query.page || 1;
    if (minprice == '') {
        minprice = Number.NEGATIVE_INFINITY;
    }
    if (maxprice == '') {
        maxprice = Number.POSITIVE_INFINITY;
    }
    if (category == "所有") {
        Product.count({}, function(err, count) {
            var pageColum = count / 50;
            if (sort == '按日期') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            update_at: -1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }

                    });
            } else if (sort == '按价格由低到高') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            Price: 1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }

                    });
            } else if (sort == '按价格由高到低') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            Price: -1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }
                    });
            } else if (sort == '按热度') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            SaleRank: -1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }
                    });
            }
        });

    } else {
        Product.count({
            Category: category
        }, function(err, count) {
            var pageColum = count / 50;
            if (sort == '按日期') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }, {
                                Category: {
                                    $eq: category
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            update_at: -1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }

                    });
            } else if (sort == '按价格由低到高') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }, {
                                Category: {
                                    $eq: category
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            Price: 1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }

                    });
            } else if (sort == '按价格由高到低') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }, {
                                Category: {
                                    $eq: category
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            Price: -1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }
                    });
            } else if (sort == '按热度') {
                Product.aggregate([{
                        "$match": {
                            "$and": [{
                                EAN: {
                                    $ne: null
                                }
                            }, {
                                Price: {
                                    $lte: Number(maxprice),
                                    $gte: Number(minprice)
                                }
                            }, {
                                Category: {
                                    $eq: category
                                }
                            }]
                        }
                    }, {
                        "$group": {
                            _id: "$EAN",
                            ProductId: {
                                $first: "$_id"
                            },
                            Images: {
                                $first: "$ProductImage"
                            },
                            ProductName: {
                                $first: "$TitleCN"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$skip": (page - 1) * 50,
                    }, {
                        "$limit": 50
                    }, {
                        "$sort": {
                            SaleRank: -1
                        }
                    }],
                    function(err, products) {
                        if (err != null) {
                            next(err);
                        } else {
                            res.render('searchproduct', {
                                title: 'Allhaha',
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout'
                            });
                        }
                    });
            }
        });
    };
});

/*search the product from input*/
router.post('/search', function(req, res, next) {
    var search = req.body.search;
    var page = req.body.page || 1;
    var count = 0;
    var query = {
        $or: [{
            Title: new RegExp(search, 'gi')
        }, {
            Category: new RegExp(search, 'gi')
        }, {
            Keywords: new RegExp(search, 'gi')
        }]
    };

    Product.count(query, function(err, count) {
        var pageColum = count / 50;
        Product.aggregate([{
            "$match": {
                $and: [{
                    EAN: {
                        $ne: null
                    },
                    $or: [{
                        Title: new RegExp(search, 'gi')
                    }, {
                        Category: new RegExp(search, 'gi')
                    }, {
                        Keywords: new RegExp(search, 'gi')
                    }]

                }]
            }
        }, {
            "$group": {
                _id: "$EAN",
                ProductId: {
                    $first: "$_id"
                },
                Images: {
                    $first: "$ProductImage"
                },
                ProductName: {
                    $first: "$TitleCN"
                },
                Price: {
                    $push: "$Price"
                }
            }
        }, {
            "$skip": (page - 1) * 50
        }, {
            "$limit": 50
        }, {
            "$sort": {
                update_at: -1
            }
        }], function(err, results) {
            if (err != null) {
                next(err);
            } else {
                res.render('searchproduct', {
                    title: 'Allhaha',
                    count: count,
                    pageColum: pageColum,
                    currentPage: page,
                    category: '所有',
                    sort: '按日期',
                    products: results,
                    user: req.user,
                    layout: 'layout'
                });
            }

        });

    });
});

router.get('/category', function(req, res, next) {
    var category = req.query.category;
    var page = req.query.page || 1;
    if (category === 'clothes_shoes') {
        category = "服装鞋子";
    } else if (category === 'food') {
        category = "食品饮食";
    } else if (category === 'kitchen') {
        category = "厨房用具";
    } else if (category === 'electronics') {
        category = "电子产品";
    } else if (category === 'handy_pad') {
        category = "手机平板";
    } else if (category === 'makeup') {
        category = "化妆品";
    } else if (category === 'medicine') {
        category = "药品";
    } else if (category === 'travel') {
        category = "旅游";
    } else if (category === 'coupon') {
        category = "打折券";
    } else if (category === 'others') {
        category = "其他";
    }

    Product.count({
        Category: category
    }, function(err, count) {
        var pageColumn = count / 50;
        Product.aggregate([{
            "$match": {
                $and: [{
                    EAN: {
                        $ne: null
                    },
                    Category: {
                        $eq: category
                    }
                }]
            }
        }, {
            "$group": {
                _id: "$EAN",
                ProductId: {
                    $first: "$_id"
                },
                Images: {
                    $first: "$ProductImage"
                },
                ProductName: {
                    $first: "$TitleCN"
                },
                Price: {
                    $push: "$Price"
                }
            }
        }, {
            "$skip": (page - 1) * 50,
        }, {
            "$limit": 50
        }, {
            "$sort": {
                update_at: -1
            }
        }], function(err, products) {
            if (err != null) {
                next(err);
            } else {
                res.render('searchproduct', {
                    title: 'Allhaha',
                    count: count,
                    pageColum: pageColumn,
                    currentPage: page,
                    category: category,
                    sort: '按日期',
                    products: products,
                    user: req.user,
                    layout: 'layout'
                });
            }
        });

    });
});


router.get('/login', function(req, res, next) {
    res.render('userlogin/login', {
        title: '登录',
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
                    return res.redirect('/controller/article');
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
            vouchers: vouchers,
            user: req.user
        });
    });
});

router.get('/aboutus', function(req, res, next) {
    res.render('aboutus', {
        title: '关于我们',
        layout: 'layout',
        user: req.user,
    });
});

router.get('/contactus', function(req, res, next) {
    res.render('contactus', {
        title: '联系我们',
        layout: 'layout',
        user: req.user,
    });
});

router.post('/contactus', function(req, res, next) {
    var feedback = {
        name: req.body.name,
        email: req.body.email,
        subtitle: req.body.subject,
        feedback: req.body.message
    };

    EmailSender.send({
        to: "abysmli@gmail.com",
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
        to: "abysmli@gmail.com",
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

router.get('/test', function(req, res, next) {
    res.json();
});

router.get('/email', function(req, res, next) {
    res.render('email_template', {
        layout: null,
        title: "非常感谢您的回馈信息",
        content: "非常感谢您的回馈信息，我们将尽快进行处理，并由相关的客服人员与您联系！",
        image: "http://lostinasupermarket.com/wp-content/uploads/2011/06/sexy-girl-2-500x375.jpg",
        url: req.protocol + '://' + req.get('host')
    });
});

module.exports = router;