var express = require('express');
var router = express.Router();

var request = require("request");
var aws = require('aws-lib');
var passport = require('passport');
var parseString = require('xml2js').parseString;

var setting = require('../setting');
var Product = require('../models/product');
var Favourite = require('../models/favourite');
var Article = require('../models/article');
var Voucher = require('../models/voucher');
var Feedback = require('../models/feedback');
var Request = require('../models/request');
var Account = require("../models/account");
var Shop = require('../models/shop');

var affilinet = require('../utils/affilinetapi');

var emailSender = require('../utils/emailsender');
var EmailSender = new emailSender();

var utils = require('../utils/utils.js');
var Utils = new utils();

var UpdateDatabase = require('../utils/updatedatabase.js');

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

/* GET home page. */
router.get('/', function (req, res, next) {
    var group1 = {
        _id: "$EAN",
        ProductId: {
            $first: "$_id"
        },
        ProductImage: {
            $first: "$ProductImage"
        },
        TitleCN: {
            $first: "$TitleCN"
        },
        Title: {
            $first: "$Title"
        },

        DescriptionCN: {
            $first: "$DescriptionCN"
        },
        Price: {
            $push: "$Price"
        },
        Category: {
            $first: "$Category"
        },
        updated_at: {
            $first: "$updated_at"
        }
    };
    var group2 = {
        _id: "$Category",
        ProductId: {
            $push: "$ProductId"
        },
        EAN: {
            $push: "$_id"
        },
        ProductImage: {
            $push: "$ProductImage"
        },
        TitleCN: {
            $push: "$TitleCN"
        },
        Title: {
            $push: "$Title"
        },
        DescriptionCN: {
            $push: "$DescriptionCN"
        },
        Price: {
            $push: "$Price"
        },
        updated_at: {
            $push: "$updated_at"
        }
    };
    Product.aggregate([{
        "$match": {
            $and: [{
                Brand: {
                    $ne: ""
                },
                Translated: true,
                EAN: {
                    $ne: 'null'
                },
                EAN: {
                    $ne: null
                },
                Activity: true
            }]
        }
    }, {
        "$group": {
            _id: "$Brand",
            Sum: {
                $sum: 1
            },
        }
    }, {
        "$sort": {
            "Views": -1
        }
    }, {
        "$limit": 5
    }], function (err, brands) {
        Product.aggregate([{
            "$match": {
                $and: [{
                    Translated: true,
                    EAN: {
                        $ne: 'null'
                    },
                    EAN: {
                        $ne: null
                    },
                    Hot: true,
                    Activity: true
                }]
            }
        }, {
            "$group": group1
        }, {
            "$group": group2
        }], function (err, products) {
            res.render('index', {
                title: 'Allhaha 欧哈哈德国优选购物 － 商品比价 － 优惠券',
                footer_bottom: false,
                products: products,
                brands: brands,
                user: req.user,
                layout: 'layout'
            });
        });
    });
});


router.get('/filter', function (req, res, next) {
    var page = req.query.page || 1;
    var search = req.query.search || "";
    var category = req.query.category || "";
    var minprice = req.query.minprice || Number.NEGATIVE_INFINITY;
    var maxprice = req.query.maxprice || Number.POSITIVE_INFINITY;
    var sort = req.query.sort || "";
    var brand = req.query.brand || "";
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
        EAN: {
            $first: "$EAN"
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
        },
        updated_at: {
            $first: "$updated_at"
        }
    };
    var matchQuery = {
        $and: [{
            Translated: true,
            EAN: {
                $ne: 'null'
            },
            EAN: {
                $ne: null
            },
            Activity: {
                $ne: false
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
                TitleCN: new RegExp(search, 'gi')
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
    }], function (err, brands) {
        Product.distinct("EAN", matchQuery, function (err, results) {
            var pages = Math.ceil(results.length / ItemOnPage);
            Product.aggregate([{
                "$match": matchQuery
            }, {
                "$group": group
            }, {
                "$sort": _sort
            }, {
                "$skip": (page - 1) * ItemOnPage
            }, {
                "$limit": ItemOnPage
            }], function (err, products) {
                if (err != null) {
                    next(err);
                } else {
                    var iterateNum = 0;
                    if (products.length != 0) {
                        products.forEach(function (product, index) {
                            Product.find({
                                EAN: product._id
                            }).stream()
                                .on("error", function (err) {
                                    next(err);
                                })
                                .on("data", function (_product) {
                                    product.ProductName.push(_product.TitleCN);
                                    product.DescriptionCN.push(_product.DescriptionCN);
                                    product.Price.push(_product.Price);
                                })
                                .on("close", function () {
                                    if (++iterateNum == products.length) {
                                        if (page == 1 && search == "" && category == "" && minprice == Number.NEGATIVE_INFINITY && maxprice == Number.POSITIVE_INFINITY) {
                                            Product.aggregate([{
                                                "$match": {
                                                    $and: [{
                                                        Translated: true,
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
                                            }], function (err, hotproducts) {
                                                var iterateNumber = 0;
                                                hotproducts.forEach(function (hotproduct, index) {
                                                    Product.find({
                                                        EAN: hotproduct._id
                                                    }).stream()
                                                        .on("error", function (err) {
                                                            next(err);
                                                        })
                                                        .on("data", function (_hotproduct) {
                                                            hotproduct.ProductName.push(_hotproduct.TitleCN);
                                                            hotproduct.DescriptionCN.push(_hotproduct.DescriptionCN);
                                                            hotproduct.Price.push(_hotproduct.Price);
                                                        })
                                                        .on("close", function () {
                                                            if (++iterateNumber == hotproducts.length) {
                                                                res.render('product_list.ejs', {
                                                                    title: 'Allhaha 欧哈哈德国优选购物 － 商品比价 － 优惠券',
                                                                    footer_bottom: false,
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
                                                                    layout: 'layout'
                                                                });
                                                            }
                                                        });
                                                });
                                            });
                                        } else {
                                            res.render('product_list.ejs', {
                                                title: 'Allhaha.com 德国欧哈哈精品购物网 - 商品比价 - 优惠券',
                                                footer_bottom: false,
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
});

router.get('/product', function (req, res, next) {
    var currenturl = req.protocol + '://' + req.get('host') + req.originalUrl;
    Product.find({
        EAN: req.query.EAN,
        Activity: true
    }, null, {
            sort: {
                Price: 1
            }
        }, function (err, _products) {
            if (err != null || _products.length == 0) next(err);
            else {
                Product.update({
                    EAN: _products[0].EAN
                }, {
                        Views: _products[0].Views + 1
                    }, {
                        multi: true
                    }, function (err, doc) {
                        if (err) return next(err);
                        var productsCount = 0;
                        _products.forEach(function (__product, index) {
                            Shop.findOne({
                                ShopId: __product.ShopId,
                                Activity: true
                            }, function (err, shop) {
                                if (shop != null) {
                                    __product.ShopName = shop.CustomTitleCN;
                                } else {
                                    __product.ShopId = "deactiv";
                                }
                                if (++productsCount == _products.length) {
                                    res.render('product_details', {
                                        title: _products[0].TitleCN,
                                        footer_bottom: !Utils.checkMobile(req),
                                        product: _products[0],
                                        currenturl: currenturl,
                                        product_link: req.url,
                                        products: _products,
                                        layout: '/layout',
                                        user: req.user
                                    });
                                }
                            });
                        });
                    });
            }
        });
});

router.post('/favourite', function (req, res, next) {
    var data = {
        Username: req.body.Username,
        ProductEAN: req.body.ProductEAN,
    };
    if (data.Username != "" && data.Username != undefined && data.ProductEAN != "" && data.ProductEAN != undefined) {
        var query = Favourite.where(data);
        query.findOne(function (err, _favourite) {
            if (err) return res.status(500).send('Service Error!');
            if (!_favourite) {
                Favourite.create(data, function (err, favourite) {
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

router.get('/favourite', function (req, res, next) {
    Favourite.find({
        Username: req.user.username
    }, function (err, favourites) {
        var productEANs = [];
        favourites.forEach(function (favourite) {
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
            TitleCN: {
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
                    $in: productEANs
                },
                Activity: {
                    $ne: false
                },
                Translated: true
            }]
        };
        Product.aggregate([{
            "$match": matchQuery
        }, {
            "$group": group
        }], function (err, products) {
            res.render('favourite', {
                title: '用户收藏',
                footer_bottom: !Utils.checkMobile(req),
                products: products,
                user: req.user
            });
        });
    });
});

router.get('/favourite/remove', function (req, res, next) {
    Favourite.remove({
        Username: req.user.username,
        ProductEAN: req.query.ean
    }, function (err, feedback) {
        if (err != null) next(err);
        else {
            return res.redirect('/favourite');
        }
    });
});

router.get('/article', function (req, res, next) {
    Article.find({}, function (err, articles) {
        res.render('article', {
            title: '精彩的文章',
            footer_bottom: false,
            articles: articles,
            user: req.user
        });
    });
});

router.get('/article_detail', function (req, res, next) {
    Article.findById(req.query.id, function (err, article) {
        if (article) {
            res.render('article_details', {
                title: article.Title,
                footer_bottom: !Utils.checkMobile(req),
                article: article,
                user: req.user
            });
        } else {
            next(err);
        }
    });
});

router.get('/voucher', function (req, res, next) {
    var page = req.query.page || 1;
    var ItemOnPage = 10;
    var modal = false,
        gutscheinCode = "",
        voucherContent = "";
    Voucher.count({
        EndDate: {
            $gte: new Date()
        }
    }, function (err, count) {
        var pages = Math.ceil(count / ItemOnPage);
        if (req.query.id != undefined) {
            Voucher.findOne({
                Id: req.query.id
            }, function (err, voucher) {
                modal = true;
                gutscheinCode = voucher.Code;
                voucherContent = voucher.DescriptionCN;
                Voucher.find({
                    EndDate: {
                        $gte: new Date()
                    }
                }).sort({
                    updated_at: -1
                }).exec(function (err, vouchers) {
                    res.render('voucher', {
                        title: '折扣券',
                        footer_bottom: false,
                        vouchers: vouchers,
                        modal: modal,
                        pages: pages,
                        currentPage: page,
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
            }).skip((page - 1) * ItemOnPage)
                .limit(ItemOnPage)
                .exec(function (err, vouchers) {
                    res.render('voucher', {
                        title: '折扣券',
                        footer_bottom: false,
                        vouchers: vouchers,
                        modal: modal,
                        pages: pages,
                        currentPage: page,
                        gutscheinCode: gutscheinCode,
                        voucherContent: voucherContent,
                        user: req.user
                    });
                });
        }
    });
});

router.get('/aboutus', function (req, res, next) {
    res.render('aboutus', {
        title: '关于我们',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
        user: req.user,
    });
});

router.get('/contact', function (req, res, next) {
    res.render('contactus', {
        title: '联系我们',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
        user: req.user,
    });
});

router.post('/contact', function (req, res, next) {
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
    }, function (err) {
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
    }, function (err) {
        if (err) return next(err);
    });

    new Feedback(feedback).save(function (err, todo, count) {
        res.redirect('/');
    });
});

router.get('/product_request', function (req, res, next) {
    res.render('product_request', {
        title: '产品请求',
        footer_bottom: !Utils.checkMobile(req),
        layout: 'layout',
        user: req.user,
    });
});

router.post('/product_request', function (req, res, next) {
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
    }, function (err) {
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
    }, function (err) {
        if (err) return next(err);
    });

    new Request(request).save(function (err, todo, count) {
        res.redirect('/');
    });
});

router.get('/currencyExchange', function (req, res, next) {
    request({
        url: "https://www.exchangerate-api.com/EUR/CNY?k=2d8c6e862f92ff48d10fa915"
    }, function (err, response, data) {
        res.send(data);
    });
});

router.get('/nav', function (req, res, next) {
    Shop.find({
        Activity: {
            $ne: false
        }
    }, function (err, shops) {
        if (err) next(err);
        res.render('nav', {
            title: '导航链接',
            shops: shops,
            footer_bottom: false,
            layout: 'layout'
        });
    });
});

router.post('/nav/customContent', function (req, res, next) {
    if (req.query.id != undefined) {
        Shop.findById(req.query.id, function (err, shop) {
            res.json({
                content: shop.CustomContent || ""
            });
        });
    } else {
        Shop.findOne({
            ShopId: req.query.ShopId
        }, function (err, shop) {
            if (shop != {} && shop != null) {
                res.json({
                    content: shop.CustomContent
                });
            } else {
                res.json({
                    content: ""
                });
            }

        });
    }
});

//logout
router.get('/logout', function (req, res, next) {
    req.logout();
    res.clearCookie("duoshuo_token");
    res.redirect(req.query.from || '/');
});

router.get('/ean', function (req, res, next) {
    var query = {};
    query.FQ = "EAN:" + req.query.value;
    Affilinet.searchProducts(query, function (err, response, results) {
        if (!err && response.statusCode == 200) {
            var counter = results.ProductsSummary.TotalRecords;
            var products = Utils.ToLocalProducts(results.Products, "affilinet");
            query.FQ = "EAN:0" + req.query.value;
            Affilinet.searchProducts(query, function (err, response, results) {
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
                        ResponseGroup: "Large",
                        MerchantId: "Amazon"
                    }, function (err, product) {
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

router.get('/test', function (req, res, next) {
    prodAdv.call("ItemLookup", {
        ItemId: '4015014029363',
        IdType: "EAN",
        SearchIndex: "All",
        ResponseGroup: "Large",
        MerchantId: "Amazon"
    }, function (err, products) {
        if (!err) {
            // var _product = {};
            // if (Array.isArray(products.Items.Item)) {
            //     _product = Utils.fromAmazonToLocalProduct(products.Items.Item[0]);
            // } else {
            //     _product = Utils.fromAmazonToLocalProduct(products.Items.Item);
            // }
            res.json(products);
        } else {
            res.send(err);
        }
    });
    // Affilinet.getProducts({ProductIds: 20940203}, function(err, response, results) {
    //     res.json(results);
    // });
    // Affilinet.getShopList({}, function(err, response, shops) {
    //     if (!err && response.statusCode == 200) {
    //         res.json(shops);
    //     } else {
    //         next(err);
    //     }
    // });
    // var query = {};
    // query.FQ = "EAN:03760108930650";
    // Affilinet.searchProducts(query, function(err, response, results) {
    //     if (!err && response.statusCode == 200) {
    //         res.json(results);
    //     }
    // });
});

module.exports = router;