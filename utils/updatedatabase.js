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
        this.Product.find({
            ProductId: {
                $ne: null
            }
        }, function(err, products) {
            var list = [];
            products.forEach(function(product, index) {
                list.push(product.ProductId);
            });
            generateProductIdList(list);
            loadAffilinetData();
        });

        this.Product.find({
            Source: "Amazon"
        }, function(err, products) {
            products.forEach(function(product, index) {
                _this.prodAdv.call("ItemLookup", {
                    ItemId: product.ASIN,
                    ResponseGroup: "Medium"
                }, function(err, _product) {
                    console.log("product:     "+JSON.stringify(_product))+"\n\n\n\n";
                    _product = _product.Items.Item;
                    
                    if (_product !== undefined && _product.OfferSummary !== undefined) {
                        if (_product.OfferSummary.TotalNew == "0") {
                            _this.Product.findOneAndRemove({
                                ASIN: product.ASIN
                            }, function(err, product) {
                                if (err != null) return err;
                            });
                        }
                        if ((_product.OfferSummary.LowestNewPrice.Amount / 100) == parseFloat(product.Price)) {
                            _this.Product.findOneAndUpdate({
                                ASIN: _product.ASIN
                            }, Utils.fromAmazonToLocalProduct(_product), function(err, product) {
                                if (err != null) return err;
                            });
                        }
                    } else {
                        _this.Product.findOneAndRemove({
                            ASIN: product.ASIN
                        }, function(err, product) {
                            if (err != null) return err;
                        });
                    }
                });
            });
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

    var generateProductIdList = function(_list) {
        _this.data.segment_length = parseInt(_list.length / 50) + 1;
        for (var i = 0; i < _list.length / 50; i++) {
            _this.data.productid_list.push(_list.slice(i * 50, i * 50 + 50));
        }
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

    return _Class;
})();