module.exports = (function () {
    function _Class() {}

    _Class.prototype.findByEAN = function findByEAN(product, EAN) {
        for (var i = 0; i < product.length; i++) {
            if (product[i].EAN === EAN) {
                return product[i];
            }
        }
        return 0;
    }

    _Class.prototype.fromAffilinetToLocalProducts = function fromAffilinetToLocalProducts(products) {
        var _products = [];
        products.forEach(function(product){
            var _product = {
                ASIN: "",
                URL: product.Deeplink1,
                SalesRank: "",
                ProductImage: (product.Images[0][1] !== undefined) ? product.Images[0][1].URL : null,
                ProductImageSet: (product.Images[0][1] !== undefined) ? product.Images[0][1].URL : null,
                Brand: product.Brand,
                Manufactor: product.Manufactor,
                EAN: product.EAN,
                Description: product.DescriptionShort + " " + product.Description,
                DescriptionCN: "",
                Price: product.PriceInformation.PriceDetails.Price,
                PriceCurrency: product.PriceInformation.Currency,
                Title: product.ProductName,
                TitleCN: "",
                LastproductChange: product.LastProductChange,
                DeliveryTime: product.DeliveryTime,
                Keywords: product.Keywords || "",
                Source: "Affilinet",
                Tranlated: false,
            };
            _products.push(_product);
        });
        return _products;
    }

    _Class.prototype.fromAmazonToLocalProducts = function fromAmazonToLocalProducts(products) {
        
        var _products = [];
        products.forEach(function(product){
            var _images = [];
            //product.ImageSets.ImageSet.forEach(function(image){
            //    _images.push(image.LargeImage.URL);
            //});
            var _product = {
                ASIN: product.ASIN,
                URL: product.DetailPageURL,
                SalesRank: product.SalesRank,
                ProductImage: product.LargeImage.URL,
                ProductImageSet: _images,
                Brand: product.ItemAttributes.Brand,
                Manufactor: product.ItemAttributes.Manufactor,
                EAN: product.ItemAttributes.EAN,
                Description: product.ItemAttributes.Feature,
                DescriptionCN: "",
                Price: product.ItemAttributes.ListPrice.Amount / 100,
                PriceCurrency: "Dollar",
                Title: product.ItemAttributes.Title,
                TitleCN: "",
                LastproductChange: "",
                DeliveryTime: "",
                Keywords: "",
                Source: "Amazon",
                Tranlated: false,
            };
            _products.push(_product);
        });
        return _products;
    }
    
    return _Class;
})();
