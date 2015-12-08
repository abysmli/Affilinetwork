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
                        $first: "$Title"
                    },
                    DescriptionCN: {
                        $first: "$Description"
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
                                $first: "$Title"
                            },
                            DescriptionCN: {
                                $first: "$Description"
                            },
                            Price: {
                                $push: "$Price"
                            }
                        }
                    }, {
                        "$sort": {
                            update_at: -1
                        }
                    }], function(err, hotproduct) {
                        res.render('index_de', {
                            title: 'Allhaha',
                            footer_bottom: false,
                            count: count,
                            pageColum: pageColum,
                            currentPage: page,
                            products: products,
                            hotproducts: hotproduct,
                            category: 'Alle',
                            sort: 'Datum',
                            user: req.user,
                            layout: 'layout_de'
                        });
                    });
                    
                }
            });
    });
});

router.get('/pagination', function(req, res, next) {
    var page = req.query.page;
    if (page == 1) {
        res.redirect('/DE');
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
                            $first: "$Title"
                        },
                        DescriptionCN: {
                            $first: "$Description"
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
                        res.render('searchproduct_de', {
                            title: 'Allhaha',
                            footer_bottom: true,
                            count: count,
                            pageColum: pageColum,
                            currentPage: page,
                            products: products,
                            category: 'Alle',
                            sort: 'Datum',
                            user: req.user,
                            layout: 'layout_de'
                        });
                    }
                });
        });
    }

});

router.post('/', passport.authenticate('stormpath', {
    failureRedirect: '/DE/login',
    layout: 'layout_de',
    title: 'Fehler beim Einloggen'
}), function(req, res, next) {
    res.redirect('/DE');
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
    if (category == "Alle") {
        Product.count({}, function(err, count) {
            var pageColum = count / 50;
            if (sort == 'Datum') {
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
                                $first: "$Title"
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
                            });
                        }

                    });
            } else if (sort == 'Preis tief nach hoch') {
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
                                $first: "$Title"
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
                            });
                        }

                    });
            } else if (sort == 'Preis hoch nach tief') {
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
                                $first: "$Title"
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
                            });
                        }
                    });
            } else if (sort == 'Bewertung') {
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
                                $first: "$Title"
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
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
            if (sort == 'Datum') {
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
                                $first: "$Title"
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
                            console.log(category);
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
                            });
                        }

                    });
            } else if (sort == 'Preis tief nach hoch') {
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
                            });
                        }

                    });
            } else if (sort == 'Preis hoch nach tief') {
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
                                $first: "$Title"
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
                            });
                        }
                    });
            } else if (sort == 'Bewertung') {
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
                                $first: "$Title"
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
                            res.render('searchproduct_de', {
                                title: 'Allhaha',
                                footer_bottom: true,
                                count: count,
                                pageColum: pageColum,
                                currentPage: page,
                                products: products,
                                category: category,
                                sort: sort,
                                user: req.user,
                                layout: 'layout_de'
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
                    $first: "$Title"
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
                res.render('searchproduct_de', {
                    title: 'Allhaha',
                    footer_bottom: true,
                    count: count,
                    pageColum: pageColum,
                    currentPage: page,
                    category: 'Alle',
                    sort: 'Datum',
                    products: results,
                    user: req.user,
                    layout: 'layout_de'
                });
            }

        });

    });
});

router.get('/category', function(req, res, next) {
    var category = req.query.category;
    var page = req.query.page || 1;
    if (category === 'clothes_shoes') {
        category = "Kleidung&Schuhe";
    } else if (category === 'food') {
        category = "Essen";
    } else if (category === 'kitchen') {
        category = "Küche";
    } else if (category === 'electronics') {
        category = "Elektro&Computer";
    } else if (category === 'handy_pad') {
        category = "Handy&Pad";
    } else if (category === 'makeup') {
        category = "Kosmetik";
    } else if (category === 'medicine') {
        category = "Medikamente";
    } else if (category === 'travel') {
        category = "Reisen&Urlaub";
    } else if (category === 'others') {
        category = "Andere";
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
                    $first: "$Title"
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
                res.render('searchproduct_de', {
                    title: 'Allhaha',
                    footer_bottom: true,
                    count: count,
                    pageColum: pageColumn,
                    currentPage: page,
                    category: category,
                    sort: 'Datum',
                    products: products,
                    user: req.user,
                    layout: 'layout_de'
                });
            }
        });

    });
});


router.get('/login', function(req, res, next) {
    res.render('userlogin/login_de', {
        title: 'Anmelden',
        footer_bottom: true,
        layout: 'layout_de',
        info: 'Fehler beim Einloggen. Bitte geben Sie Benutzername und Password erneut ein.',
        user: req.user
    });
});

//logout
router.get('/logout', function(req, res, next) {
    req.logout();
    res.redirect('/DE');
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
                res.render('product_details_de', {
                    title: 'Details',
                    footer_bottom: true,
                    product: _product,
                    product_link: req.url,
                    products: _products,
                    layout: '/layout_de',
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
        Product.find({
            'EAN': {
                $in: productEANs
            }
        }, function(err, products) {
            res.render('favourite_de', {
                title: 'Merkliste',
                footer_bottom: true,
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
            return res.redirect('/DE/favourite');
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
        footer_bottom: true,
        layout: 'layout_de',
        user: req.user,
    });
});

router.get('/contactus', function(req, res, next) {
    res.render('contact_de', {
        title: 'Kontakt',
        footer_bottom: true,
        layout: 'layout_de',
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
        res.redirect('/DE');
    });
});

router.get('/product_request', function(req, res, next) {
    res.render('product_request_de', {
        title: 'Von Ihnen gesuchte Produkte',
        footer_bottom: true,
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

module.exports = router;
