var fs = require('fs');
var Affilinet = require('./affilinetapis.js');

var affilinet = new Affilinet({
    publisherId: '512499',
    productWebservicePassword: 'FaI69alVX0eZ4i28TnIq',
    publisherWebservicePassword: 'lZONYNI32ieYq8kMPqKS'
});

var id;
var type;
var update_count = 1;
var Product;

var Sync = function (_product, _type, _id) {
    products = []
    id = _id;
    type = _type;
    sync(1);
    Product = _product;
};

function sync(CurrentPage) {
    if (type == "category") {
        affilinet.getProductListbyCategory(id, CurrentPage, 500, getData);
    } else if (type == "shop") {
        affilinet.getProductListbyShop(id, CurrentPage, 500, getData);
    }
}

function getData(err, results) {
    if (err != null)
        return err;
    else {
        var _products;
        if (type == "category") {
            var Records = results.ProductSearchResult.Records;
            var TotalRecords = results.ProductSearchResult.TotalRecords;
            var TotalPages = results.ProductSearchResult.TotalPages;
            CurrentPage = results.ProductSearchResult.CurrentPage;
            _products = results != null ? (_ref = results.ProductSearchResult) != null ? (_ref = _ref.Products) != null ? _ref.Product : void 0 : void 0 : void 0;
        } else if (type == "shop") {
            var Records = results.Records;
            var TotalRecords = results.TotalRecords;
            var TotalPages = results.TotalPages;
            CurrentPage = results.CurrentPage;
            _products = results != null ? (_ref = results.Products) != null ? _ref.Product : void 0 : void 0;
        }
        
        console.log(CurrentPage + "|" + TotalPages);

        writeIntoDatabase(_products);
        if (CurrentPage < TotalPages) {
            sync(CurrentPage + 1);
        } else {
            console.log("Finished! Updated: " + update_count + " Products!");
            return
        }
    }
}

function writeIntoDatabase(products) {
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
        var query = Product.where({
            product_id: data.product_id
        });
        query.findOne(function (err, product) {
            if (err) return err;
            if (!product) {
                Product.create(data, function (err, product) {
                    if (err) {
                        return err;
                    }
                    update_count++;
                });
            }
        });
    });
    return products;
}

module.exports = Sync;
