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
        _this = this;
    }

    _Class.prototype.sync = function sync(_currentPage) {
        _currentPage = typeof _currentPage !== 'undefined' ? _currentPage : 1;

        if (this.options.type == "category") {
            this.Affilinet.getProductListbyCategory(this.options.id, _currentPage, 500, loadAffilinetData);
        } else if (this.options.type == "shop") {
            this.Affilinet.getProductListbyShop(this.options.id, _currentPage, 500, loadAffilinetData);
        }
    }

    var loadAffilinetData = function (err, results) {
        if (err != null)
            return err;
        else {
            var _products, _param;
            _products = (_this.options.type == "category") ? results.ProductSearchResult : results;
            _this.params.records = _products.Records;
            _this.params.totalRecords = _products.TotalRecords;
            _this.params.totalPages = _products.TotalPages;
            _this.params.currentPage = _products.CurrentPage;
            _products = _products != null ? (_products = _products.Products) != null ? _products.Product : void 0 : void 0;

            _this.socket.emit("sync_process", {
                currentpage: _this.params.currentPage,
                totalpage: _this.params.totalPages
            });
            
            writeIntoDatabase(_products);
            
            if (_this.params.currentPage < _this.params.totalPages) {
                _this.sync(_this.params.currentPage + 1);
            }
        }
    }

    var writeIntoDatabase = function (products) {
        products.forEach(function (_product, index) {
            var data = {
                product_id: _product.Id,
                article_num: _product.ArticleNumber,
                ean: _product.EAN,
                title: _product.Title,
                brand: _product.Brand,
                shop_name: _product.ShopInformation.ShopName,
                desc_cn: "",
                desc_de_short: _product.DescriptionShort,
                desc_de: _product.Description,
                price: _product.Price,
                shipping: _product.Shipping,
                link: _product.DeepLink1,
                category_path: _product.CategoryPath,
                tranlated: false,
                image: _product.Image.ImageUrl,
                image90: _product.Image60.ImageUrl
            };
            var query = _this.Product.where({
                product_id: data.product_id
            });
            query.findOne(function (err, product) {
                if (err) return err;
                if (!product) {
                    _this.Product.create(data, function (err, product) {
                        if (err) return err;
                        _this.params.count++;
                    });
                }
            });
        });
        return 0;
    }
    return _Class;
})();
