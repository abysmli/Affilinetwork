var utils = require('./utils.js');
var Utils = new utils();

module.exports = (function() {
    var _this;

    function _Class(_product, _affilinet, _prodAdv, _socket) {
        this.data = {};
        this.data.productid_list = [];
        this.data.segment_count = 0;
        this.data.update_count = 0;
        this.Affilinet = _affilinet;
        this.prodAdv = _prodAdv;
        this.Product = _product;
        this.socket = _socket;
        _this = this;
    }

    _Class.prototype.update = function update(_currentPage) {
        this.Product.aggregate([{
            "$match": {
                EAN: {
                    $ne: 'null'
                }
            }
        }, {
            "$group": {
                _id: "$EAN"
            }
        }], function(err, eans) {
            var updateNumber = 0, updatedSum = 0;
            eans.forEach(function(ean, index){
                updateByEAN(ean._id, function(updatedCount){
                    updateNumber++;
                    updatedSum += updatedCount;
                    console.log("updatedCount: " + updatedCount + " updateNumber: " + updateNumber + " Length: " + eans.length);
                    if (updateNumber == eans.length-1) {
                        console.log("updatedSum: " + updatedSum);
                        //checkAvailability(products);
                    }
                });
            });
        });
    }

    var checkAvailability = function(products) {
        _this.Product.find({
            Source: "Affilinet"
        }, function(err, products) {
            var list = [];
            products.forEach(function(product, index) {
                list.push(product.ProductId);
            });
            generateProductIdList(list, function() {
                loadAffilinetData();
            });
            // this.Product.find({
            //     Source: "Amazon"
            // }, function(err, products) {
            //     products.forEach(function(product, index) {
            //         _this.prodAdv.call("ItemLookup", {
            //             ItemId: product.ASIN,
            //             ResponseGroup: "Medium"
            //         }, function(err, _product) {
            //             console.log("product:     "+JSON.stringify(_product))+"\n\n\n\n";
            //             _product = _product.Items.Item;
                        
            //             if (_product !== undefined && _product.OfferSummary !== undefined) {
            //                 if (_product.OfferSummary.TotalNew == "0") {
            //                     _this.Product.findOneAndRemove({
            //                         ASIN: product.ASIN
            //                     }, function(err, product) {
            //                         if (err != null) return err;
            //                     });
            //                 }
            //                 if ((_product.OfferSummary.LowestNewPrice.Amount / 100) == parseFloat(product.Price)) {
            //                     _this.Product.findOneAndUpdate({
            //                         ASIN: _product.ASIN
            //                     }, Utils.fromAmazonToLocalProduct(_product), function(err, product) {
            //                         if (err != null) return err;
            //                     });
            //                 }
            //             } else {
            //                 _this.Product.findOneAndRemove({
            //                     ASIN: product.ASIN
            //                 }, function(err, product) {
            //                     if (err != null) return err;
            //                 });
            //             }
            //         });
            //     });
            // });
        });
    }

    var loadAffilinetData = function() {
        _this.data.productid_list.forEach(function(_productidlist, index) {
            _this.Affilinet.getProducts({
                ProductIds: _productidlist.toString()
            }, resolveAffilinetData);
        });
    }

    var resolveAffilinetData = function(error, response, results) {
        if (!error && response.statusCode == 200) {
            _this.data.segment_count++;
            _this.socket.emit("update_process", {
                segment_count: _this.data.segment_count,
                segment_length: _this.data.segment_length
            });
            updateDatabase(results.Products);
        } else {
            return error;
        }
    }

    var generateProductIdList = function(_list, cb) {
        _this.data.segment_length = parseInt(_list.length / 50) + 1;
        for (var i = 0; i < _list.length / 50; i++) {
            _this.data.productid_list.push(_list.slice(i * 50, i * 50 + 50));
        }
        cb();
    }

    var updateDatabase = function(products) {
        products.forEach(function(_product, index) {
            var query = _this.Product.where({
                ProductId: _product.ProductId
            });
            query.findOne(function(err, product) {
                if (err) return err;
                if (product.LastProductChange !== _product.LastProductChange) {
                    _this.Product.update({
                        ProductId: _product.ProductId
                    }, _product, function(err, product) {
                        if (err) return err;
                        _this.data.update_count++;
                    });
                }
            });
            if ((_this.data.segment_count === _this.data.segment_length) && (products.length === index + 1)) {
                _this.socket.emit("update_finished", {
                    count: _this.data.update_count
                });
            }
        });
    }

    var updateByEAN = function(ean, callback) {
        var query = {};
        query.FQ = "EAN:" + ean;
        _this.Affilinet.searchProducts(query, function(err, response, results) {
            if (!err && response.statusCode == 200) {
                var products = Utils.ToLocalProducts(results.Products, "affilinet");
                query.FQ = "EAN:0" + ean;
                _this.Affilinet.searchProducts(query, function(err, response, results) {
                    if (!err && response.statusCode == 200) {
                        var _product = Utils.ToLocalProducts(results.Products, "affilinet");
                        if (!Utils.isEmptyObject(_product)) {
                            products = products.concat(_product);
                        }
                        _this.prodAdv.call("ItemLookup", {
                            ItemId: ean,
                            IdType: "EAN",
                            SearchIndex: "All",
                            ResponseGroup: "Large"
                        }, function(err, product) {
                            if (!err) {
                                var _product = Utils.fromAmazonToLocalProduct(product.Items.Item);
                                if (!Utils.isEmptyObject(_product)) {
                                    products.push(_product);
                                }
                                var update_count = 0;
                                if (products.length != 0) {
                                    products.forEach(function(product, index) {
                                        delete product['SalesRank'];
                                        delete product['Category'];
                                        delete product['Keywords'];
                                        delete product['Tranlated'];
                                        delete product['DescriptionCN'];
                                        delete product['TitleCN'];
                                        product.EAN = product.EAN.substr(product.EAN.length - 13);
                                        if (product.Source == "Affilinet") {
                                            _this.Product.update({ ProductId: product.ProductId }, product, { upsert: true }, function(err, raw) {
                                                if (err) return err;
                                                if (++update_count == products.length) {
                                                    callback(update_count);
                                                }
                                            });
                                        } else if (product.Source == "Amazon") {
                                            _this.Product.update({ ASIN: product.ASIN }, product, { upsert: true }, function(err, raw) {
                                                if (err) return err;
                                                if (++update_count == products.length) {
                                                    callback(update_count);
                                                }
                                            });
                                        }
                                    });
                                } else {
                                    callback(0);
                                }
                            } else {
                                return err;
                            }
                        });
                    } else {
                        return err;
                    }
                });
            } else {
                return err;
            }
        });
    }

    return _Class;
})();