module.exports = (function () {
    var _this;

    function _Class(_product, _affilinet, _options, _socket) {
        this.products = [];
        this.params = {
            count: 0
        };
        this.Affilinet = _affilinet;
        this.Product = _product;
        this.options = _options;
        this.socket = _socket;
        this.options.query = {
            ShopIds: _options.shopid == "0" ? 0 : _options.shopid ,
            CategoryIds: _options.categoryid == "0" ? 0 : _options.categoryid ,
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
    }

    var loadAffilinetData = function (error, response, results) {
        if (!error && response.statusCode == 200) {
            _this.params.Records = results.ProductsSummary.Records;
            _this.params.TotalRecords = results.ProductsSummary.TotalRecords;
            _this.params.TotalPages = results.ProductsSummary.TotalPages;
            _this.params.CurrentPage = results.ProductsSummary.CurrentPage;

            _this.socket.emit("sync_process", {
                currentpage: _this.params.CurrentPage,
                totalpage: _this.params.TotalPages
            });
            writeIntoDatabase(results.Products);

            if (_this.params.CurrentPage < _this.params.TotalPages) {
                _this.sync(_this.params.CurrentPage + 1);
            }
        } else {
            return error;
        }
    }

    var writeIntoDatabase = function (products) {
        products.forEach(function (_product, index) {
            var query = _this.Product.where({
                ProductId: _product.ProductId
            });
            query.findOne(function (err, product) {
                if (err) return err;
                if (!product) {
                    _this.Product.create(_product, function (err, product) {
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
    return _Class;
})();
