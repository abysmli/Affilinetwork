var express = require('express');
var router = express.Router();
var async = require('async');
var csv = require("fast-csv");
var fs = require('fs');
var parseString = require('xml2js').parseString;
var auth = require('../models/auth');
var affilinet = require('../utils/requester/AffilinetAPI');
var aws = require('aws-lib');
var uuidV4 = require('uuid/v4');
var Product = require('../models/product');
var Article = require('../models/article');
var Voucher = require('../models/voucher');
var Feedback = require('../models/feedback');
var Request = require('../models/request');
var Shop = require('../models/shop');
var Link = require("../models/link");
var User = require("../models/user");
var Scan = require("../models/scan");
var setting = require('../setting');
var utils = require('../utils/utils');
var Utils = new utils();

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var AffilinetSOAP = require('../utils/requester/AffilinetAPI.SOAP');

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

/* GET users listing. */
router.get('/', auth, function (req, res, next) {
    if (req.query.mode == "cloud") {
        Affilinet.getShopList({}, function (err, response, shops) {
            if (!err && response.statusCode == 200) {
                req.session.shops = shops.Shops;
                res.render('controller/index', {
                    title: 'Shops Manage',
                    mode: 'cloud',
                    shops: shops.Shops,
                    layout: 'controller/layout'
                });
            } else {
                next(err);
            }
        });
    } else {
        Shop.find({}, function (err, shops) {
            if (err) next(err);
            res.render('controller/index', {
                title: 'Shops Manage',
                mode: 'local',
                shops: shops,
                layout: 'controller/layout'
            });
        });
    }
});

router.post('/shopsync', auth, function (req, res, next) {
    Affilinet.getShopList({}, function (err, response, shops) {
        if (!err && response.statusCode == 200) {
            shops = shops.Shops;
            var update_count = 0;
            shops.forEach(function (shop, index) {
                Shop.findOne({
                    ShopId: shop.ShopId
                }, function (err, _shop) {
                    if (_shop == null) {
                        Utils.shortURL(shop.ShopLink, function (err, shorturl) {
                            shop.ShortURL = shorturl;
                            Shop.create(Utils.ShopConverter(shop), function (err, shop) {
                                if (err) {
                                    next(err);
                                }
                                update_count++;
                            });
                        });
                    }
                    if (++update_count == shops.length) {
                        res.json({
                            count: update_count
                        });
                    }
                });
            });
        } else {
            next(err);
        }
    });
});

router.get('/shop/add', auth, function (req, res, next) {
    var shop = {};
    if (req.query.id != undefined) {
        shop = req.session.shops[req.query.id];
        shop.LogoURL = shop.Logo.URL;
    }
    res.render('controller/shop_form', {
        title: 'Add Shop',
        shop: shop,
        layout: 'controller/layout'
    });
});

router.post('/shop/add', auth, function (req, res, next) {
    var shop = req.body;
    shop.Logo = JSON.parse(shop.Logo);
    Utils.shortURL(shop.ShopLink, function (err, shorturl) {
        shop.ShortURL = shorturl;
        Shop.create(shop, function (err, shop) {
            if (err) {
                next(err);
            }
            return res.redirect('/controller/');
        });
    });
});

router.get('/shop/edit', auth, function (req, res, next) {
    if (req.query.id !== undefined) {
        Shop.findById(req.query.id, function (err, shop) {
            if (err) next(err);
            else {
                res.render('controller/shop_form', {
                    title: 'Edit Shop',
                    shop: shop,
                    layout: 'controller/layout'
                });
            }
        });
    } else {
        Shop.findOne({
            ShopId: req.query.ShopId
        }, function (err, shop) {
            if (err) next(err);
            else {
                res.render('controller/shop_form', {
                    title: 'Edit Shop',
                    shop: shop,
                    layout: 'controller/layout'
                });
            }
        });
    }
});

router.post('/shop/edit', auth, function (req, res, next) {
    var query = {};
    if (req.query.id !== undefined) {
        query = {
            _id: req.query.id
        };
    } else {
        query = {
            ShopId: req.query.ShopId
        };
    }
    var shop = req.body;
    if (JSON.parse(shop.Logo) == "") {
        delete shop.Logo;
    } else {
        shop.Logo = JSON.parse(shop.Logo);
    }
    Shop.findOneAndUpdate(query, shop, function (err, shop) {
        if (err) next(err);
        else {
            res.redirect('/controller/');
        }
    });
});

router.post('/shop/activity', auth, function (req, res, next) {
    var Activity = (req.body.activity === 'true');
    Shop.update({
        _id: req.body.id
    }, {
            Activity: Activity
        }, function (err, doc) {
            if (err) return next(err);
            res.json({
                status: 'success'
            });
        });
});

router.get('/shop/remove', auth, function (req, res, next) {
    Shop.findByIdAndRemove(req.query.id, function (err, shop) {
        if (err) next(err);
        else {
            return res.redirect('/controller/');
        }
    });
});

router.get('/shop/remove_all', auth, function (req, res, next) {
    Shop.remove(function (err) {
        if (err)
            next(err);
        else
            res.redirect('/controller/');
    });
});

router.get('/category', auth, function (req, res, next) {
    var ShopId = req.query.shopid == undefined ? 0 : req.query.shopid;
    var shoptitle = req.query.shoptitle == undefined ? "for All Shops" : "for " + req.query.shoptitle;
    Affilinet.getCategoryList({
        ShopId: ShopId
    }, function (err, response, categorylist) {
        if (!err && response.statusCode == 200) {
            res.render('controller/category', {
                title: 'Categories Manage',
                categorylist: categorylist.Categories,
                shopid: ShopId,
                shoptitle: shoptitle,
                layout: 'controller/layout'
            });
        } else {
            next(err);
        }
    });
});

router.get('/program', auth, function (req, res, next) {
    Affilinet.getMyPrograms({}, function (err, response, programs) {
        if (!err && response.statusCode == 200) {
            parseString(programs, {
                explicitArray: false
            }, function (err, programs) {
                var programs = programs.ProgramList.Programs.ProgramSummary;
                req.session.programs = programs;
                res.render('controller/program', {
                    title: 'Programs Manage',
                    programs: programs,
                    layout: 'controller/layout'
                });
            });
        } else {
            next(err);
        }
    });
});

router.post('/program_details', auth, function (req, res, next) {
    req.session.programs.forEach(function (program, index) {
        if (program.ProgramID == req.body.program_id) {
            return res.json(program);
        }
    });
});

router.get('/creativ', auth, function (req, res, next) {
    var ProgramIds = [parseInt(req.query.ProgramId)];
    var creativs = [];
    AffilinetSOAP.SearchCreatives({ ProgramIds: ProgramIds }, (data) => {
        var loops = parseInt(data.TotalResults / 100) + 1;
        creativs = data.CreativeCollection.Creative;
        if (loops == 1) {
            ParseLoop();
        } else {
            SearchLoop(2, loops);
        }
    });
    function SearchLoop(index, loops) {
        if (index <= loops) {
            AffilinetSOAP.SearchCreatives({ ProgramIds: ProgramIds, CurrentPage: index }, (data) => {
                creativs = creativs.concat(data.CreativeCollection.Creative);
                SearchLoop(index + 1, loops);
            });
        } else {
            ParseLoop();
        }
    }
    function ParseLoop() {
        var hrefs = [];
        creativs.forEach((creativ, index) => {
            var patt = /<a href="(.*?)"/g;
            while (match = patt.exec(creativ.IntegrationCode)) {
                hrefs.push({
                    CreativeTypeEnum: creativ.CreativeTypeEnum,
                    Title: creativ.Title,
                    URL: match[1]
                });
            }
        });
        res.json(hrefs);
    }
});

router.get('/voucher', auth, function (req, res, next) {
    if (req.query.type == 'remote') {
        Affilinet.getVoucherCodes({
            ProgramId: req.query.program_id,
        }, function (err, response, vouchers) {
            parseString(vouchers, {
                explicitArray: false
            }, function (err, vouchers) {
                var vouchers = vouchers.GetVoucherCodesResponse.VoucherCodeCollection.VoucherCode || [];
                if (vouchers.constructor != Array) {
                    vouchers = [vouchers];
                }
                vouchers.forEach(function (voucher) {
                    voucher.Program = req.query.program_title;
                });
                req.session.vouchers = vouchers;
                res.render('controller/voucher', {
                    title: 'Vouchers Manage',
                    vouchers: vouchers,
                    type: 'remote',
                    programTitle: req.query.program_title,
                    layout: 'controller/layout'
                });
            });
        });
    } else if (req.query.type == 'getAll') {
        Affilinet.getMyPrograms({}, function (err, response, programs) {
            if (!err && response.statusCode == 200) {
                parseString(programs, {
                    explicitArray: false
                }, function (err, programs) {
                    var programs = programs.ProgramList.Programs.ProgramSummary;
                    var allVouchers = [];
                    var voucher_nummber = 0;
                    programs.forEach(function (program, index) {
                        Affilinet.getVoucherCodes({
                            ProgramId: program.ProgramID
                        }, function (err, response, vouchers) {
                            parseString(vouchers, {
                                explicitArray: false,
                                async: true,
                            }, function (err, vouchers) {
                                var vouchers = vouchers.GetVoucherCodesResponse.VoucherCodeCollection.VoucherCode || [];
                                if (vouchers.constructor != Array) {
                                    vouchers = [vouchers];
                                }
                                vouchers.forEach(function (voucher, index, object) {
                                    voucher.Program = program.Title;
                                    if (voucher.ActivePartnership == "true") {
                                        allVouchers.push(voucher);
                                    }
                                });
                                if (++voucher_nummber == programs.length) {
                                    req.session.vouchers = allVouchers;
                                    res.render('controller/voucher', {
                                        title: 'Vouchers Manage',
                                        vouchers: allVouchers,
                                        type: 'remote',
                                        programTitle: "All Programs",
                                        layout: 'controller/layout'
                                    });
                                }
                            });
                        });
                    });
                });
            } else {
                next(err);
            }
        });
    } else if (req.query.ProgramId) {
        var ProgramId = parseInt(req.query.ProgramId);
        AffilinetSOAP.SearchVoucherCodes({ ProgramId: ProgramId }, (data) => {
            var vouchers = data.VoucherCodeCollection.VoucherCodeItem;
            var ProgramVouchers = [];
            vouchers.forEach((voucher, index) => {
                if (voucher.ProgramId == ProgramId) {
                    voucher.Program = voucher.ProgramId;
                    voucher.IsRestricted = voucher.CustomerRestriction;
                    voucher.ActivePartnership = voucher.PartnershipStatus;
                    ProgramVouchers.push(voucher);
                }
            });
            req.session.vouchers = ProgramVouchers;
            res.render('controller/voucher', {
                title: 'Vouchers Manage',
                vouchers: ProgramVouchers,
                type: 'remote',
                programTitle: "Program " + ProgramId,
                layout: 'controller/layout'
            });
        });
    } else {
        Voucher.find({
            EndDate: {
                $gte: new Date()
            }
        }).sort({
            updated_at: -1
        }).exec(function (err, vouchers) {
            req.session.vouchers = vouchers;
            res.render('controller/voucher', {
                title: 'Vouchers Manage',
                vouchers: vouchers,
                type: 'local',
                programTitle: 'Local',
                layout: 'controller/layout'
            });
        });
    }
});

router.post('/voucher_details', auth, function (req, res, next) {
    req.session.vouchers.forEach(function (voucher, index) {
        if (voucher.Id == req.body.voucher_id) {
            return res.json(voucher);
        }
    });
});

router.get('/voucher/add', auth, function (req, res, next) {
    var voucher = {};
    if (req.query.add_type == "auto") {
        voucher = req.session.vouchers[req.query.id];
    }
    res.render('controller/voucher_form', {
        title: 'Add Voucher',
        voucher: voucher,
        layout: 'controller/layout'
    });
});

router.post('/voucher/add', auth, function (req, res, next) {
    var voucher = req.body;
    var query = Voucher.where({
        Id: voucher.Id
    });
    query.findOne(function (err, _voucher) {
        if (err) next(err);
        if (!_voucher) {
            voucher.Image = JSON.parse(voucher.Image);
            if (voucher.DescriptionCN !== "" && voucher.IntegrationCodeCN !== "") {
                voucher.Translated = true;
            }
            Voucher.create(voucher, function (err, voucher) {
                if (err) next(err);
            });
        }
        return res.redirect('/controller/voucher');
    });
});

router.get('/voucher/edit', auth, function (req, res, next) {
    Voucher.findById(req.query.id, function (err, voucher) {
        if (err) next(err);
        else {
            res.render('controller/voucher_form', {
                title: 'Edit Voucher',
                voucher: voucher,
                layout: 'controller/layout'
            });
        }
    });
});

router.post('/voucher/edit', auth, function (req, res, next) {
    var voucher = req.body;
    if (voucher.DescriptionCN !== "" && voucher.IntegrationCodeCN !== "") {
        voucher.Translated = true;
    }
    if (JSON.parse(voucher.Image) == "") {
        delete voucher.Image;
    } else {
        voucher.Image = JSON.parse(voucher.Image);
    }
    Voucher.findOneAndUpdate({
        _id: req.query.id
    }, voucher, function (err, voucher) {
        if (err) next(err);
        else {
            res.redirect('/controller/voucher');
        }
    });
});

router.get('/voucher/remove', auth, function (req, res, next) {
    Voucher.findByIdAndRemove(req.query.id, function (err, voucher) {
        if (err) next(err);
        else {
            return res.redirect('/controller/voucher');
        }
    });
});

router.get('/voucher/remove_all', auth, function (req, res, next) {
    Voucher.remove(function (err) {
        if (err)
            next(err);
        else
            res.redirect('/controller/voucher');
    });
});

router.get('/product', auth, function (req, res, next) {
    if (req.query.type == "remote") {
        var query = {
            ShopIds: req.query.shopid,
            CategoryIds: req.query.categoryid,
        }
        if (req.query.shopid != 0) {
            query.ShopIdMode = "Include";
            query.UseAffilinetCategories = "false";
        }
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                res.render('controller/products', {
                    title: 'Products Manage',
                    shopid: req.query.shopid,
                    categoryid: req.query.categoryid,
                    query: "",
                    fq: "",
                    type: 'remote',
                    counter: counter,
                    products: products,
                    layout: 'controller/layout'
                });
            } else {
                next(err);
            }
        });
    } else {

        if (req.query.EAN == undefined) {
            Product.count({}, function (err, count) {
                var group = {
                    _id: "$EAN",
                    Id: {
                        $first: "$_id"
                    },
                    ProductImage: {
                        $first: "$ProductImage"
                    },
                    Title: {
                        $first: "$Title"
                    },
                    TitleCN: {
                        $first: "$TitleCN"
                    },
                    Description: {
                        $first: "$Description"
                    },
                    Brand: {
                        $first: "$Brand"
                    },
                    ShopId: {
                        $first: "$ShopId"
                    },
                    Price: {
                        $first: "$Price"
                    },
                    URL: {
                        $first: "$URL"
                    },
                    EAN: {
                        $first: "$EAN"
                    },
                    ASIN: {
                        $first: "$ASIN"
                    },
                    Source: {
                        $first: "$Source"
                    },
                    Category: {
                        $first: "$Category"
                    },
                    Translated: {
                        $first: "$Translated"
                    },
                    TranslationQuality: {
                        $first: "$TranslationQuality"
                    },
                    Hot: {
                        $first: "$Hot"
                    },
                    Activity: {
                        $first: "$Activity"
                    },
                    Views: {
                        $first: "$Views"
                    },
                    SearchCount: {
                        $first: "$SearchCount"
                    },
                    Sales: {
                        $first: "$Sales"
                    },
                    insert_at: {
                        $first: "$insert_at"
                    },
                    updated_at: {
                        $first: "$updated_at"
                    },
                    Count: {
                        $sum: 1
                    }
                };
                matchQuery = {
                    $and: [{
                        Translated: (req.query.translated == 'true' || req.query.translated == undefined) ? true : {
                            $exists: true
                        },
                        Activity: (req.query.activity == 'true' || req.query.activity == undefined) ? true : {
                            $exists: true
                        }
                    }]
                };
                Product.aggregate([{
                    "$match": matchQuery
                }, {
                    "$group": group
                }, {
                    "$sort": {
                        insert_at: -1
                    }
                }], function (err, products) {
                    if (err) {
                        next(err);
                    } else {
                        res.render('controller/products', {
                            title: 'Products Manage',
                            shopid: -1,
                            categoryid: -1,
                            query: "",
                            fq: "",
                            type: 'local',
                            counter: count,
                            products: products,
                            layout: 'controller/layout'
                        });
                    }
                });
            });
        } else {
            Product.count({
                EAN: req.query.EAN
            }, function (err, count) {
                Product.find({
                    EAN: req.query.EAN
                }, function (err, products) {
                    if (err) {
                        next(err);
                    } else {
                        products.forEach(function (product, index) {
                            product.Id = product._id;
                            product.Count = "-";
                        });
                        res.render('controller/products', {
                            title: 'Products Manage',
                            shopid: -1,
                            categoryid: -1,
                            query: "",
                            fq: "",
                            type: 'local',
                            counter: count,
                            products: products,
                            layout: 'controller/layout'
                        });
                    }
                });
            });
        }
    }
});

router.post('/product', auth, function (req, res, next) {
    var query = {};
    if (req.body.search_type == "Query") {
        query.Query = req.body.search_value;
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                prodAdv.call("ItemSearch", {
                    SearchIndex: "All",
                    Keywords: req.body.search_value,
                    ResponseGroup: "Large",
                    MerchantId: "Amazon"
                }, function (err, results) {
                    if (!err) {
                        counter = "Affilinet: " + counter + " | Amazon: " + results.Items.TotalResults;
                        var _products = [];
                        if (Array.isArray(results.Items.Item)) {
                            _products = Utils.ToLocalProducts(results.Items.Item, "amazon");
                            products = products.concat(_products);
                        }
                        req.session.products = products;
                        res.render('controller/products', {
                            title: 'Products Manage',
                            shopid: 0,
                            categoryid: 0,
                            query: query.Query || "",
                            fq: query.FQ || "",
                            type: 'search',
                            counter: counter,
                            products: products,
                            layout: 'controller/layout'
                        });
                    } else {
                        next(err);
                    }
                });
            } else {
                next(err);
            }
        });
    } else if (req.body.search_type == "ASIN") {
        query.FQ = "ASIN:" + req.body.search_value;
        prodAdv.call("ItemLookup", {
            ItemId: req.body.search_value,
            ResponseGroup: "Large",
            MerchantId: "Amazon"
        }, function (err, product) {
            if (!err) {
                var counter = 0;
                var products = [];
                var _product = {};
                if (Array.isArray(product.Items.Item)) {
                    _product = Utils.fromAmazonToLocalProduct(product.Items.Item[0]);
                } else {
                    _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                }
                if (!Utils.isEmptyObject(_product)) {
                    counter = 1;
                    products.push(_product);
                }
                req.session.products = products;
                res.render('controller/products', {
                    title: 'Products Manage',
                    shopid: 0,
                    categoryid: 0,
                    query: query.Query || "",
                    fq: query.FQ || "",
                    type: 'search',
                    counter: counter,
                    products: products,
                    layout: 'controller/layout'
                });
            } else {
                next(err);
            }
        });
    } else if (req.body.search_type == "EAN") {
        query.FQ = "EAN:" + req.body.search_value;
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                query.FQ = "EAN:0" + req.body.search_value;
                Affilinet.searchProducts(query, function (err, response, results) {
                    if (!err && response.statusCode == 200) {
                        var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                        if (!Utils.isEmptyObject(_product)) {
                            products = products.concat(_product);
                        }
                        prodAdv.call("ItemLookup", {
                            ItemId: req.body.search_value,
                            IdType: "EAN",
                            SearchIndex: "All",
                            ResponseGroup: "Large",
                            MerchantId: "Amazon"
                        }, function (err, product) {
                            if (!err) {
                                var _product = {};
                                if (Array.isArray(product.Items.Item)) {
                                    _product = Utils.fromAmazonToLocalProduct(product.Items.Item[0]);
                                } else {
                                    _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                                }
                                if (!Utils.isEmptyObject(_product)) {
                                    products.push(_product);
                                }
                                req.session.products = products;
                                res.render('controller/products', {
                                    title: 'Products Manage',
                                    shopid: 0,
                                    categoryid: 0,
                                    query: query.Query || "",
                                    fq: query.FQ || "",
                                    type: 'search',
                                    counter: products.length,
                                    products: products,
                                    layout: 'controller/layout'
                                });
                            } else {
                                next(err);
                            }
                        });
                    } else {
                        next(err);
                    }
                });
            } else {
                next(err);
            }
        });
    }
});

router.get('/product/add', auth, function (req, res, next) {
    var product = {};
    if (req.query.add_type == "auto") {
        product = req.session.products[req.query.id];
    }
    res.render('controller/product_form', {
        title: 'Add Product',
        product: product,
        layout: 'controller/layout'
    });
});

router.post('/product/add', auth, function (req, res, next) {
    var product = req.body;
    var query = Product.where({
        ProductId: product.ProductId,
        ASIN: product.ASIN
    });
    product.ItemDimensions = {
        Length: product.ItemDimensions_Length,
        Width: product.ItemDimensions_Width,
        Height: product.ItemDimensions_Height,
        Weight: product.ItemDimensions_Weight
    };
    product.PackageDimensions = {
        Length: product.PackageDimensions_Length,
        Width: product.PackageDimensions_Width,
        Height: product.PackageDimensions_Height,
        Weight: product.PackageDimensions_Weight
    };
    query.findOne(function (err, _product) {
        if (err) next(err);
        if (!_product) {
            product.ProductImageSet = JSON.parse(product.ProductImageSet);
            if (product.TitleCN !== "" && product.DescriptionCN !== "") {
                product.Translated = true;
            }
            product.insert_at = new Date();
            Utils.shortURL(product.URL, function (err, shorturl) {
                product.ShortURL = shorturl;
                Product.create(product, function (err, product) {
                    if (err) {
                        next(err);
                    }
                });
            });
        }
        if (product.EAN !== null && product.EAN !== "") {
            Utils.syncProductByEAN(Affilinet, prodAdv, Product, product.EAN, function (update_count, deactiv_count) {
                return res.redirect('/controller/product');
            });
        } else {
            return res.redirect('/controller/product');
        }
    });
});

router.get('/product/edit', auth, function (req, res, next) {
    Product.findById(req.query.id, function (err, product) {
        if (err) next(err);
        else {
            res.render('controller/product_form', {
                title: 'Edit Product',
                product: product,
                layout: 'controller/layout'
            });
        }
    });
});

router.post('/product/edit', auth, function (req, res, next) {
    var product = req.body;
    product.ItemDimensions = {
        Length: product.ItemDimensions_Length,
        Width: product.ItemDimensions_Width,
        Height: product.ItemDimensions_Height,
        Weight: product.ItemDimensions_Weight
    };
    product.PackageDimensions = {
        Length: product.PackageDimensions_Length,
        Width: product.PackageDimensions_Width,
        Height: product.PackageDimensions_Height,
        Weight: product.PackageDimensions_Weight
    };
    if (product.TitleCN !== "" && product.DescriptionCN !== "") {
        product.Translated = true;
    }
    product.ProductImageSet = JSON.parse(product.ProductImageSet);
    product.insert_at = new Date();
    Product.findOneAndUpdate({
        _id: req.query.id
    }, product, function (err, _product) {
        if (err) next(err);
        else {
            if (Product.EAN !== null && Product.EAN !== "") {
                Utils.syncProductByEAN(Affilinet, prodAdv, Product, Product.EAN, function (update_count, deactiv_count) {
                    return res.redirect('/controller/product');
                });
            } else {
                return res.redirect('/controller/product');
            }
        }
    });
});

router.post('/product/auto_add', auth, function (req, res, next) {
    Utils.syncProductByEAN(Affilinet, prodAdv, Product, req.body.ean, function (update_count, deactiv_count) {
        res.json({
            update_count: update_count,
            deactiv_count: deactiv_count
        });
    });
});

router.post('/product/hot', auth, function (req, res, next) {
    var Hot = (req.body.hot === 'true');
    Product.update({
        EAN: req.body.ean
    }, {
            Hot: Hot
        }, {
            multi: true
        }, function (err, doc) {
            if (err) return next(err);
            res.json({
                status: 'success'
            });
        });
});

router.post('/product/translate', auth, function (req, res, next) {
    var Translated = (req.body.translate === 'true');
    Product.update({
        EAN: req.body.ean
    }, {
            Translated: Translated
        }, {
            multi: true
        }, function (err, doc) {
            if (err) return next(err);
            res.json({
                status: 'success'
            });
        });
});

router.post('/product/activity', auth, function (req, res, next) {
    var Activity = (req.body.activity === 'true');
    Product.update({
        _id: req.body.id
    }, {
            Activity: Activity
        }, {
            multi: true
        }, function (err, doc) {
            if (err) return next(err);
            res.json({
                status: 'success'
            });
        });
});

router.get('/product/remove', auth, function (req, res, next) {
    Product.findByIdAndRemove(req.query.id, function (err, product) {
        if (err) next(err);
        else {
            return res.redirect('/controller/product');
        }
    });
});

router.get('/product/remove_ean', auth, function (req, res, next) {
    Product.remove({
        EAN: req.query.ean
    }, function (err) {
        if (err)
            next(err);
        else
            res.redirect('/controller/product');
    });
});

router.get('/product/remove_deactived', auth, function (req, res, next) {
    Product.remove({
        Activity: false
    }, function (err) {
        if (err)
            next(err);
        else
            res.redirect('/controller/product');
    });
});

router.get('/product/remove_all', auth, function (req, res, next) {
    Product.remove(function (err) {
        if (err)
            next(err);
        else
            res.redirect('/controller/product');
    });
});

router.get('/article', auth, function (req, res, next) {
    Article.find({}, function (err, articles) {
        if (err) {
            next(err);
        } else {
            res.render('controller/article', {
                title: 'Articles Manage',
                articles: articles,
                layout: 'controller/layout'
            });
        }
    });
});

router.get('/article/add', auth, function (req, res, next) {
    res.render('controller/article_form', {
        title: 'Add Article',
        article: '',
        layout: 'controller/layout'
    });
});

router.post('/article/add', auth, function (req, res, next) {
    req.body.Image = JSON.parse(req.body.Image);
    Article.create(req.body, function (err, article) {
        if (err) {
            next(err);
        }
        return res.redirect('/controller/article');
    });
});

router.get('/article/edit', auth, function (req, res, next) {
    Article.findById(req.query.id, function (err, article) {
        if (err) next(err);
        else {
            res.render('controller/article_form', {
                title: 'Edit Article',
                article: article,
                layout: 'controller/layout'
            });
        }
    });
});

router.post('/article/edit', auth, function (req, res, next) {
    req.body.Image = JSON.parse(req.body.Image);
    Article.findOneAndUpdate({
        _id: req.query.id
    }, req.body, function (err, article) {
        if (err) next(err);
        else {
            res.redirect('/controller/article');
        }
    });
});

router.get('/article/remove', auth, function (req, res, next) {
    Article.findByIdAndRemove(req.query.id, function (err, article) {
        if (err) next(err);
        else {
            return res.redirect('/controller/article');
        }
    });
});

router.get('/article/remove_all', auth, function (req, res, next) {
    Article.remove(function (err) {
        if (err)
            next(err);
        else
            res.redirect('/controller/article');
    });
});

router.get('/feedback', auth, function (req, res, next) {
    Feedback.find({}, function (err, feedbacks) {
        if (err) {
            next(err);
        } else {
            Request.find({}, function (err, requests) {
                if (err) {
                    next(err);
                } else {
                    res.render('controller/feedback', {
                        title: 'Feedback Manage',
                        feedbacks: feedbacks,
                        requests: requests,
                        layout: 'controller/layout'
                    });
                }

            });
        }
    });
});

router.get('/feedback/remove', auth, function (req, res, next) {
    if (req.query.type == "feedback") {
        Feedback.findByIdAndRemove(req.query.id, function (err, feedback) {
            if (err) next(err);
            else {
                return res.redirect('/controller/feedback');
            }
        });
    } else if (req.query.type == "request") {
        Request.findByIdAndRemove(req.query.id, function (err, request) {
            if (err) next(err);
            else {
                return res.redirect('/controller/feedback');
            }
        });
    }
});

router.get('/link', auth, function (req, res, next) {
    Link.find({ $where: "this.short.length == 6" }).limit(2000).exec(function (err, links) {
        Link.find({ $where: "this.short.length == 5 " }).limit(2000).exec(function (err, mlinks) {
            if (err) {
                next(err);
            } else {
                res.render('controller/link', {
                    title: 'Links Manage',
                    links: links,
                    mlinks: mlinks,
                    layout: 'controller/layout'
                });
            }
        });
    });
});

router.get('/link/add', auth, function (req, res, next) {
    var makeText = function () {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 6; i++) {
            text += possible.charAt(Math.floor(Math.random() * possible.length));
        }
        return text;
    };
    res.render('controller/link_form', {
        title: 'Add Link',
        link: { short: makeText() },
        layout: 'controller/layout'
    });
});

router.post('/link/add', auth, function (req, res, next) {
    Link.create(req.body, function (err, link) {
        if (err) next(err);
        else {
            res.redirect('/controller/link');
        }
    });
});

router.get('/link/edit', auth, function (req, res, next) {
    if (req.query.id) {
        Link.findById(req.query.id, function (err, link) {
            if (err) {
                next(err);
            } else {
                res.render('controller/link_form', {
                    title: 'Edit Link',
                    link: link,
                    layout: 'controller/layout'
                });
            }
        });
    } else if (req.query.shorturl) {
        Link.findOne({ short: req.query.shorturl }, function (err, link) {
            if (err) {
                next(err);
            } else {
                res.render('controller/link_form', {
                    title: 'Edit Link',
                    link: link,
                    layout: 'controller/layout'
                });
            }
        });
    } else {
        res.send("Edit Link Failed!");
    }
});

router.post('/link/edit', auth, function (req, res, next) {
    if (req.query.id) {
        Link.findOneAndUpdate({ _id: req.query.id }, req.body, function (err, link) {
            if (err) {
                next(err);
            } else {
                res.redirect('/controller/link');
            }
        });
    }
    else if (req.query.shorturl) {
        Link.findOneAndUpdate({ short: req.query.shorturl }, req.body, function (err, link) {
            if (err) {
                next(err);
            } else {
                res.redirect('/controller/link');
            }
        });
    } else {
        res.send("Edit Link Failed!");
    }
});

router.get('/link/remove', auth, function (req, res, next) {
    Link.findByIdAndRemove(req.query.id, function (err, link) {
        if (err) next(err);
        else {
            return res.redirect('/controller/link');
        }
    });
});

router.get('/scan', auth, function (req, res, next) {
    Scan.find({}).sort({
        insert_at: -1
    }).exec(function (err, scans) {
        if (err) {
            next(err);
        } else {
            res.render('controller/scan', {
                title: 'Scan View',
                scans: scans,
                layout: 'controller/layout'
            });
        }
    });
});

router.get('/product_import', auth, function (req, res, next) {
    res.render('controller/product_import', {
        title: 'Products Import',
        layout: 'controller/layout'
    });
});

router.get('/user', auth, function (req, res, next) {
    User.find({}, function (err, users) {
        res.render('controller/user', {
            title: 'User Manager',
            users: users,
            layout: 'controller/layout'
        });
    });
});

router.get('/user/add', auth, function (req, res, next) {
    res.render('controller/user_form', {
        title: 'Add User',
        user: {},
        layout: 'controller/layout'
    });
});

router.post('/user/add', auth, function (req, res, next) {
    req.body.admin = (req.body.admin == "true");
    req.body.appid = uuidV4();
    req.body.appsecret = uuidV4();
    User.create(req.body, function (err, user) {
        if (err) {
            next(err);
        }
        return res.redirect('/controller/user');
    });
});

router.get('/user/edit', auth, function (req, res, next) {
    User.findById(req.query.id, function (err, user) {
        res.render('controller/user_form', {
            title: 'Edit User',
            user: user,
            layout: 'controller/layout'
        });
    });
});

router.post('/user/edit', auth, function (req, res, next) {
    User.findOneAndUpdate({
        _id: req.query.id
    }, req.body, function (err, user) {
        if (err) next(err);
        else {
            res.redirect('/controller/user');
        }
    });
});

router.get('/user/remove', auth, function (req, res, next) {
    User.findByIdAndRemove(req.query.id, function (err, user) {
        if (err) next(err);
        else {
            return res.redirect('/controller/user');
        }
    });
});

router.get('/csv', auth, function (req, res, next) {
    if (req.query.type == "product") {
        var csvStream = csv.createWriteStream({ headers: true }).transform(function (row) {
            return {
                ProductId: row.a,
                ASIN: row.b,
                URL: row.c,
                ProductName: row.d,
                SalesRank: row.e,
                ProductImage: row.f,
                ProductImageSet: row.g,
                Brand: row.h,
                Manufactor: row.i,
                EAN: row.j,
                PZN: row.k,
                Description: row.l,
                DescriptionCN: row.m,
                Price: row.n,
                Shipping: row.o,
                PriceCurrency: row.p,
                Title: row.q,
                TitleCN: row.r,
                ShopName: row.s,
                ShopId: row.t,
                Category: row.u,
                LastProductChange: row.v,
                DeliveryTime: row.w,
                Keywords: row.x,
                Source: row.y
            };
        });
        var writableStream = fs.createWriteStream(process.cwd() + '/data/products.csv');
        writableStream.on("finish", function () {
            res.sendFile(process.cwd() + '/data/products.csv');
        });
        var query = {
            ShopIds: req.query.shopid,
            CategoryIds: req.query.categoryid,
        }
        if (req.query.shopid != 0) {
            query.ShopIdMode = "Include";
            query.UseAffilinetCategories = "false";
        }
        Affilinet.searchProducts(query, function (err, response, results) {
            if (!err && response.statusCode == 200) {
                var counter = results.ProductsSummary.TotalRecords;
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                csvStream.pipe(writableStream);
                products.forEach(function (product, index) {
                    csvStream.write({
                        a: product.ProductId,
                        b: product.ASIN,
                        c: product.URL,
                        d: product.ProductName,
                        e: product.SalesRank,
                        f: product.ProductImage,
                        g: product.ProductImageSet,
                        h: product.Brand,
                        i: product.Manufactor,
                        j: product.EAN,
                        k: product.PZN,
                        l: product.Description,
                        m: product.DescriptionCN,
                        n: product.Price,
                        o: product.Shipping,
                        p: product.PriceCurrency,
                        q: product.Title,
                        r: product.TitleCN,
                        s: product.ShopName,
                        t: product.ShopId,
                        u: product.Category,
                        v: (new Date(parseInt(product.LastProductChange.substr(6, 13)))).toLocaleString("en-US", { timeZone: "Asia/Shanghai" }),
                        w: product.DeliveryTime,
                        x: product.Keywords,
                        y: product.Source,
                    });
                });
                csvStream.end();
            } else {
                next(err);
            }
        });
    } else if (req.query.type == "translate") {
        var csvStream = csv.createWriteStream({ headers: true }).transform(function (row) {
            return {
                ProductId: row.a,
                ASIN: row.b,
                URL: row.c,
                ProductName: row.d,
                SalesRank: row.e,
                ProductImage: row.f,
                ProductImageSet: row.g,
                Brand: row.h,
                Manufactor: row.i,
                EAN: row.j,
                PZN: row.k,
                Description: row.l,
                DescriptionCN: row.m,
                TranslationQuality: row.z,
                Price: row.n,
                Shipping: row.o,
                PriceCurrency: row.p,
                Title: row.q,
                TitleCN: row.r,
                ShopName: row.s,
                ShopId: row.t,
                Category: row.u,
                LastProductChange: row.v,
                DeliveryTime: row.w,
                Keywords: row.x,
                Source: row.y,
            };
        });
        var writableStream = fs.createWriteStream(process.cwd() + '/data/products.csv');
        writableStream.on("finish", function () {
            res.sendFile(process.cwd() + '/data/products.csv');
        });
        var ean = "";
        Product.find({
            Activity: true,
            Translated: true
        }, function (err, products) {
            if (err) return next(err);
            csvStream.pipe(writableStream);

            products.forEach(function (product, index) {
                if (ean != product.EAN) {
                    ean = product.EAN;
                    var LastProductChange = "";
                    if (product.LastProductChange) {
                        LastProductChange = (new Date(parseInt(product.LastProductChange.substr(6, 13)))).toLocaleString("en-US", { timeZone: "Asia/Shanghai" });
                    }
                    csvStream.write({
                        a: product.ProductId,
                        b: product.ASIN,
                        c: product.URL,
                        d: product.ProductName,
                        e: product.SalesRank,
                        f: product.ProductImage,
                        g: product.ProductImageSet,
                        h: product.Brand,
                        i: product.Manufactor,
                        j: product.EAN,
                        k: product.PZN,
                        l: product.Description,
                        m: product.DescriptionCN,
                        z: product.TranslationQuality,
                        n: product.Price,
                        o: product.Shipping,
                        p: product.PriceCurrency,
                        q: product.Title,
                        r: product.TitleCN,
                        s: product.ShopName,
                        t: product.ShopId,
                        u: product.Category,
                        v: LastProductChange,
                        w: product.DeliveryTime,
                        x: product.Keywords,
                        y: product.Source,
                    });
                }
            });
            csvStream.end();
        });
    } else if (req.query.type == "scanview") {
        var csvStream = csv.createWriteStream({ headers: true }).transform(function (row) {
            return {
                FromUser: row.a,
                EAN: row.b,
                Result: row.c,
                Type: row.d,
                insert_at: row.e
            };
        });
        var writableStream = fs.createWriteStream(process.cwd() + '/data/scan.csv');
        writableStream.on("finish", function () {
            res.sendFile(process.cwd() + '/data/scan.csv');
        });
        Scan.find({}).sort({ insert_at: -1 }).exec(function (err, scans) {
            if (err) return next(err);
            csvStream.pipe(writableStream);
            scans.forEach(function (scan, index) {
                csvStream.write({
                    a: scan.FromUser,
                    b: scan.EAN,
                    c: scan.Result,
                    d: scan.Type,
                    e: (new Date(scan.insert_at)).toISOString(),
                });
            });
            csvStream.end();
        });
    } else {
        res.send("Type error!");
    }
});

router.get('/productstest', auth, function (req, res, next) {
    res.render('controller/productstest', {
        title: 'Products Manage Test',
        layout: 'controller/layout'
    });
});

router.get('/productstestapi', auth, function (req, res, next) {
    let queryparam = {
        draw: req.query.draw,
        order: {
            column: req.query.order[0].column == '0' ? "ProductImage" : req.query.order[0].column == '1' ? "Title" : req.query.order[0].column == '2' ? "TitleCN" : req.query.order[0].column == '3' ? "Brand" : req.query.order[0].column == '4' ? "ShopId" : req.query.order[0].column == '5' ? "Price" : req.query.order[0].column == '6' ? "URL" : req.query.order[0].column == '7' ? "Date" : req.query.order[0].column == '8' ? "EAN" : req.query.order[0].column == '9' ? "ASIN" : req.query.order[0].column == '10' ? "Source" : req.query.order[0].column == '11' ? "Count" : req.query.order[0].column == '12' ? "Views" : req.query.order[0].column == '13' ? "Category" : req.query.order[0].column == '14' ? "Status" : req.query.order[0].column == '15' ? "Manipulate" : "Price",
            dir: req.query.order[0].dir == "asc" ? 1 : -1,
        },
        start: parseInt(req.query.start),
        length: parseInt(req.query.length),
        search: req.query.search
    }
    console.log(queryparam);
    let sort = {};
    sort[queryparam.order.column] = queryparam.order.dir;
    var group = {
        _id: "$EAN",
        ProductImage: {
            $first: "$ProductImage"
        },
        Title: {
            $first: "$Title"
        },
        TitleCN: {
            $first: "$TitleCN"
        },
        Brand: {
            $first: "$Brand"
        },
        ShopId: {
            $first: "$ShopId"
        },
        Price: {
            $first: "$Price"
        },
        URL: {
            $first: "$URL"
        },
        EAN: {
            $first: "$EAN"
        },
        ASIN: {
            $first: "$ASIN"
        },
        Source: {
            $first: "$Source"
        },
        Count: {
            $first: "$Count"
        },
        Category: {
            $first: "$Category"
        }
    };

    var matchQuery = {
        $and: [{
            $or: [{
                Title: new RegExp(queryparam.search.value, 'gi')
            }, {
                TitleCN: new RegExp(queryparam.search.value, 'gi')
            }, {
                Brand: new RegExp(queryparam.search.value, 'gi')
            }, {
                ShopId: new RegExp(queryparam.search.value, 'gi')
            }, {
                Price: new RegExp(queryparam.search.value, 'gi')
            }, {
                EAN: new RegExp(queryparam.search.value, 'gi')
            }, {
                ASIN: new RegExp(queryparam.search.value, 'gi')
            }, {
                Source: new RegExp(queryparam.search.value, 'gi')
            }, {
                Category: new RegExp(queryparam.search.value, 'gi')
            }, {
                Status: new RegExp(queryparam.search.value, 'gi')
            }]
        }]
    };

    Product.distinct("EAN", {}, function (err, results) {
        let counts = results.length;
        Product.aggregate([{
            "$match": matchQuery
        }, {
            "$group": group
        }, {
            "$sort": sort
        }, {
            "$skip": queryparam.start
        }, {
            "$limit": queryparam.length == -1 ? 0 : queryparam.length
        }], function (err, products) {
            let data = [];
            if (products) {
                products.forEach((product) => {
                    data.push([
                        product.ProductImage,
                        product.Title,
                        product.TitleCN,
                        product.Brand,
                        product.ShopId,
                        product.Price,
                        product.URL,
                        product.Date,
                        product.EAN,
                        product.ASIN,
                        product.Source,
                        product.Count,
                        product.Views,
                        product.Category,
                        product.Status,
                        product.Manipulate
                    ]);
                });
            }
            let packet = {
                draw: queryparam.draw,
                recordsTotal: products.length,
                recordsFiltered: counts - products.length,
                data: data
            }
            res.json(packet);
        });
    });

});


module.exports = router;