var express = require('express');
var router = express.Router();
var Product = require('../models/product.js');
var Favourite = require('../models/favourite.js');
var Article = require('../models/article.js');
var affilinet = require('../utils/affilinetapi.js');
var aws = require('aws-lib');
var utils = require('../utils/utils.js');
var request = require("request");
var Account = require("../models/account.js");
var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy;
var stormpath = require('stormpath');
var setting = require('../setting.js');
var parseString = require('xml2js').parseString;


var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag);

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var utils = require('../utils/utils.js');
var Utils = new utils();

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
        console.log(hotproduct);

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
                    console.log(JSON.stringify(err));
                    res.render('error');
                } else {
                    res.render('index', {
                        title: '',
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

router.get('/pagination', function(req, res) {
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
                        console.log(JSON.stringify(err));
                        res.render('error');
                    } else {
                        res.render('searchproduct', {
                            title: '',
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
}), function(req, res) {
    res.redirect('/');
});


router.post('/filter', function(req, res, next) {
    var category = req.body.category;
    var minprice = req.body.minprice;
    var maxprice = req.body.maxprice;
    var sort = req.body.sort;
    console.log(category);
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
                        console.log(JSON.stringify(products));
                        if (err != null) {
                            res.render('error');
                        } else {
                            res.render('searchproduct', {
                                title: '',
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
router.post('/search', function(req, res) {
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
            console.log(JSON.stringify(results));
            if (err != null) {
                res.render('error');
            } else {
                res.render('searchproduct', {
                    title: '',
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

router.get('/category', function(req, res) {
    var category = req.query.category;
    var page = req.query.page || 1;
    console.log(page);
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
            console.log(JSON.stringify(products));
            if (err != null) {
                res.render('error');
            } else {
                res.render('searchproduct', {
                    title: '',
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


router.get('/login', function(req, res) {
    res.render('userlogin/login', {
        title: '登录',
        layout: 'layout',
        info: '用户名或密码错误, 请重新填写',
        user: req.user

    });
});

//logout
router.get('/logout', function(req, res) {
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
            if (err != null) res.render('error');
            else {
                console.log(_product);
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
    console.log(data);
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
            console.log(products)
            res.render('favourite', {
                title: '用户收藏',
                products: products,
                user: req.user
            });
        });
    });
});

router.get('/article', function(req, res, next) {
    Article.find({}, function(err, articles) {
        res.render('article', {
            title: '精彩的文章点评',
            articles: articles,
            user: req.user
        });
    });
});

router.get('/aboutus', function(req, res){
    res.render('aboutus', {
        layout: 'layout',
        user: req.user,
    });
});

module.exports = router;