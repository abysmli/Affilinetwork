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
            $in: ["服装鞋子", "食品饮食", "厨房用具", "电子产品", "手机平板", "化妆品", "健康保健", "旅游", "其他", "母婴", "小家电", "钟表手饰", "办公", "null"]
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
            Tranlated: true,
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
                                product.ProductName.push(_product.TitleCN);
                                product.DescriptionCN.push(_product.DescriptionCN);
                                product.Price.push(_product.Price);
                            })
                            .on("close", function() {
                                if (++iterateNum == products.length) {
                                    if (page == 1 && search == "" && category == "" && minprice == Number.NEGATIVE_INFINITY && maxprice == Number.POSITIVE_INFINITY) {
                                        mainPage = true;
                                        Product.aggregate([{
                                            "$match": {
                                                $and: [{
                                                    Tranlated: true,
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
                                                        hotproduct.ProductName.push(_hotproduct.TitleCN);
                                                        hotproduct.DescriptionCN.push(_hotproduct.DescriptionCN);
                                                        hotproduct.Price.push(_hotproduct.Price);
                                                    })
                                                    .on("close", function() {
                                                        if (++iterateNumber == hotproducts.length) {
                                                            res.render('index', {
                                                                title: 'Allhaha 欧哈哈德国优选购物 － 商品比价 － 优惠券',
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
                                            title: 'Allhaha.com 德国欧哈哈精品购物网 - 商品比价 - 优惠券',
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
                } else {
                    res.render('notfound', {
                        title: '没有找到您需要的产品',
                        footer_bottom: !Utils.checkMobile(req),
                        layout: 'layout'
                    });
                }
            }
        });
    });
});

router.get('/product', function(req, res, next) {
    var query = Product.where({
        _id: req.query.product_id,
    });
    query.findOne(function(err, _product) {
        Product.find({
            EAN: _product.EAN,
        }, null, {
            sort: {
                Price: 1
            }
        }, function(err, _products) {
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
    var modal = false,
        gutscheinCode = "",
        voucherContent = "";
    if (req.query.id != undefined) {
        Voucher.findOne({
            Id: req.query.id
        }, function(err, voucher) {
            modal = true;
            gutscheinCode = voucher.Code;
            voucherContent = voucher.DescriptionCN;
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
                    modal: modal,
                    gutscheinCode: gutscheinCode,
                    voucherContent: voucherContent,
                    user: req.user
                });
            });
        });
    } else {
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
                modal: modal,
                gutscheinCode: gutscheinCode,
                voucherContent: voucherContent,
                user: req.user
            });
        });
    }
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

router.get('/ean', function(req, res, next) {
    var query = {};
    query.FQ = "EAN:" + req.query.value;
    Affilinet.searchProducts(query, function(err, response, results) {
        if (!err && response.statusCode == 200) {
            var counter = results.ProductsSummary.TotalRecords;
            var products = Utils.ToLocalProducts(results.Products, "affilinet");
            query.FQ = "EAN:0" + req.query.value;
            Affilinet.searchProducts(query, function(err, response, results) {
                if (!err && response.statusCode == 200) {
                    counter = parseInt(counter) + parseInt(results.ProductsSummary.TotalRecords);
                    var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                    if (!Utils.isEmptyObject(_product)) {
                        counter = parseInt(counter) + 1;
                        products = products.concat(_product);
                    }
                    prodAdv.call("ItemLookup", {
                        ItemId: req.query.value,
                        IdType: "EAN",
                        SearchIndex: "All",
                        ResponseGroup: "Medium"
                    }, function(err, product) {
                        if (!err) {
                            var _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                            if (!Utils.isEmptyObject(_product)) {
                                counter = parseInt(counter) + 1;
                                products.push(_product);
                            }
                            res.json(products);
                        } else {
                            res.send(err);
                        }
                    });
                } else {
                    res.send(err);
                }
            });
        } else {
            res.send(err);
        }
    });
});

router.get('/currencyExchange', function(req, res, next) {
    request({
        url: "https://www.exchangerate-api.com/EUR/CNY?k=2d8c6e862f92ff48d10fa915"
    }, function(err, response, data) {
        res.send(data);
    });
});

module.exports = router;
