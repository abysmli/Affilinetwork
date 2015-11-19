var utils = require('./utils.js');
var Utils = new utils();

module.exports = (function() {
    var _this;

    function _Class(_product, _affilinet, _prodAdv, _options, _socket) {
        this.products = [];
        this.params = {
            count: 0
        };
        this.Affilinet = _affilinet;
        this.prodAdv = _prodAdv;
        this.Product = _product;
        this.options = _options;
        this.socket = _socket;
        this.options.query = {
            ShopIds: _options.shopid == "0" ? 0 : _options.shopid,
            CategoryIds: _options.categoryid == "0" ? 0 : _options.categoryid,
            Query: _options.query,
            FQ: _options.fq,
            CurrentPage: 1,
            PageSize: 500
        }
        if (this.options.shopid != 0) {
            this.options.query.ShopIdMode = "Include";
            this.options.query.UseAffilinetCategories = "false";
        }
        _this = this;
    }

    _Class.prototype.sync = function sync(_currentPage) {
        this.options.query.CurrentPage = typeof _currentPage !== 'undefined' ? _currentPage : 1;
        this.Affilinet.searchProducts(this.options.query, loadAffilinetData);
        if (this.options.query.Query !== "" && this.options.query.CurrentPage == 1) {
            loadAmazonDataByKeywords(this.options.query.Query);
        }
        /*
        if (this.options.query.FQ !== "" && _currentPage == 1) {
            loadAmazonDataByKeywords(this.options.query.Query);
        }*/
    }

    var loadAffilinetData = function(error, response, results) {
        if (!error && response.statusCode == 200) {
            _this.params.Records = results.ProductsSummary.Records;
            _this.params.TotalRecords = results.ProductsSummary.TotalRecords;
            _this.params.TotalPages = results.ProductsSummary.TotalPages;
            _this.params.CurrentPage = results.ProductsSummary.CurrentPage;

            _this.socket.emit("sync_process", {
                currentpage: _this.params.CurrentPage,
                totalpage: _this.params.TotalPages
            });
            writeAffilinetDataIntoDatabase(Utils.ToLocalProducts(results.Products, "affilinet"));
            if (_this.params.CurrentPage < _this.params.TotalPages) {
                _this.sync(_this.params.CurrentPage + 1);
            }
        } else {
            return error;
        }
    }

    var writeAffilinetDataIntoDatabase = function(products) {
        products.forEach(function(_product, index) {
            var query = _this.Product.where({
                ProductId: _product.ProductId
            });
            query.findOne(function(err, product) {
                if (err) return err;
                if (!product) {
                    _this.Product.create(_product, function(err, product) {
                        if (err) {
                            console.log(err);
                            return err;
                        }
                        _this.params.count++;
                    });
                }
            });
            if ((_this.params.CurrentPage === _this.params.TotalPages) && (products.length === index + 1)) {
                _this.socket.emit("sync_finished", {
                    count: _this.params.count
                });
            }
        });
        return 0;
    }

    var loadAmazonDataByKeywords = function(keywords) {
        for (var i = 1; i <= 5; i++) {
            _this.prodAdv.call("ItemSearch", {
                SearchIndex: "All",
                Keywords: keywords,
                ItemPage: i,
                ResponseGroup: "Medium"
            }, function(err, results) {
                if (!err) {
                    writeAmazonDataIntoDatabase(Utils.ToLocalProducts(results.Items.Item, "amazon"));
                } else {
                    return err;
                }
            });
        }
    }

    var writeAmazonDataIntoDatabase = function(products) {
        products.forEach(function(_product, index) {
            var query = _this.Product.where({
                ASIN: _product.ASIN
            });
            query.findOne(function(err, product) {
                if (err) return err;
                if (!product) {
                    _this.Product.create(_product, function(err, product) {
                        if (err) {
                            console.log(err);
                            return err;
                        }
                        _this.params.count++;
                    });
                }
            });
        });
    }

    return _Class;
})();