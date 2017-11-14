"use strict";
const _ = require('lodash');

class DataFormatter {
    constructor() { }

    formatAmazonProduct(product) {
        let _product = {};
        if (_.has(product, "OfferSummary") && _.get(product, "OfferSummary.TotalNew", "0") !== "0") {
            let ImageURLs = [];
            if (!_.isNil(product.ImageSets) && _.isArray(product.ImageSets.ImageSet)) {
                product.ImageSets.ImageSet.forEach((image) => {
                    ImageURLs.push(image.LargeImage.URL);
                });
            }
            let ItemDimensions = {
                Length: _.has(product, "ItemAttributes.ItemDimensions.Length") ? _.round(_.get(product, "ItemAttributes.ItemDimensions.Length.#", 0) * 0.0254, 2) : null,
                Width: _.has(product, "ItemAttributes.ItemDimensions.Width") ? _.round(_.get(product, "ItemAttributes.ItemDimensions.Width.#", 0) * 0.0254, 2) : null,
                Height: _.has(product, "ItemAttributes.ItemDimensions.Height") ? _.round(_.get(product, "ItemAttributes.ItemDimensions.Height.#", 0) * 0.0254, 2) : null,
                Weight: _.has(product, "ItemAttributes.ItemDimensions.Weight") ? _.round(_.get(product, "ItemAttributes.ItemDimensions.Weight.#", 0) * 0.00453, 2) : null,
            };
            let PackageDimensions = {
                Length: _.has(product, "ItemAttributes.PackageDimensions.Length") ? _.round(_.get(product, "ItemAttributes.PackageDimensions.Length.#", 0) * 0.0254, 2) : null,
                Width: _.has(product, "ItemAttributes.PackageDimensions.Width") ? _.round(_.get(product, "ItemAttributes.PackageDimensions.Width.#", 0) * 0.0254, 2) : null,
                Height: _.has(product, "ItemAttributes.PackageDimensions.Height") ? _.round(_.get(product, "ItemAttributes.PackageDimensions.Height.#", 0) * 0.0254, 2) : null,
                Weight: _.has(product, "ItemAttributes.PackageDimensions.Weight") ? _.round(_.get(product, "ItemAttributes.PackageDimensions.Weight.#", 0) * 0.00453, 2) : null,
            };
            _product = {
                ProductId: product.ASIN || null,
                ASIN: product.ASIN || null,
                URL: product.DetailPageURL || null,
                ProductName: _.get(product, "ItemAttributes.Title", null),
                SalesRank: parseInt(product.SalesRank) || null,
                ProductImage: _.get(product, "LargeImage.URL", null),
                ProductImageSet: ImageURLs,
                Brand: _.get(product, "ItemAttributes.Brand", null),
                Manufactor: _.get(product, "ItemAttributes.Manufacturer", null),
                EAN: _.get(product, "ItemAttributes.EAN", null),
                PZN: this.getPZNfromAmazonProduct(product),
                Description: this.generateAmazonDescription(product),
                DescriptionCN: null,
                Price: _.get(product, "Offers.Offer.OfferListing.Price.Amount", 0) / 100 || _.get(product, "OfferSummary.LowestNewPrice.Amount", 0) / 100 || null,
                PriceCurrency: _.get(product, "OfferSummary.LowestNewPrice.CurrencyCode", null),
                Shipping: null,
                Title: _.get(product, "ItemAttributes.Title", null),
                TitleCN: null,
                ShopName: "Amazon",
                ShopId: "-1",
                Category: null,
                Weight: PackageDimensions.Weight || ItemDimensions.Weight || null,
                ItemDimensions: ItemDimensions.Length ? ItemDimensions : null,
                PackageDimensions: PackageDimensions.Length ? PackageDimensions : null,
                LastProductChange: null,
                DeliveryTime: null,
                Keywords: null,
                Source: "Amazon",
                ProgramId: "-1",
                Translated: false,
            };
        }
        return _product;
    }

    formatAmazonProducts(products) {
        var _products = [];
        if (products) {
            products.forEach((product, index) => {
                var _product = this.formatAmazonProduct(product);
                if (!_.isEmpty(_product)) {
                    _products.push(_product);
                }
            });
        }
        return _products;
    }

    formatAffilinetProduct(product) {
        var _product = {
            ProductId: product.ProductId || null,
            ASIN: null,
            URL: product.Deeplink1 || null,
            ProductName: product.ProductName || null,
            SalesRank: null,
            ProductImage: _.get(product, "Images[0][0].URL", null),
            ProductImageSet: [_.get(product, "Images[0][0].URL", null)],
            Brand: product.Brand || null,
            Manufactor: product.Manufacturer || null,
            EAN: product.EAN || null,
            PZN: null,
            Description: "" + product.DescriptionShort || null + " " + product.Description || null,
            DescriptionCN: null,
            Price: _.get(product, "PriceInformation.PriceDetails.Price", null),
            Shipping: _.get(product, "PriceInformation.ShippingDetails.Shipping", null),
            PriceCurrency: _.get(product, "PriceInformation.Currency", null),
            Title: product.ProductName || null,
            TitleCN: null,
            ShopName: product.ShopTitle || null,
            ShopId: product.ShopId || null,
            Category: null,
            LastProductChange: product.LastProductChange || null,
            DeliveryTime: product.DeliveryTime || null,
            Keywords: product.Keywords || null,
            ProgramId: product.ProgramId || null,
            Source: "Affilinet",
            Weight: null,
            ItemDimensions: null,
            PackageDimensions: null,
            Translated: false,
        };
        return _product;
    }

    formatAffilinetShop(shop) {
        return {
            ShopId: shop.ShopId || null,
            ShopTitle: shop.ShopTitle || null,
            CustomTitle: shop.ShopTitle || null,
            CustomTitleCN: shop.ShopTitle || null,
            Source: "Affilinet",
            Logo: "",
            LogoURL: shop.Logo.URL || null,
            ProductCount: shop.ProductCount || null,
            ProgramId: shop.ProgramId || null,
            ShopLink: shop.ShopLink || null,
            ShortURL: shop.ShortURL || null,
            LastUpdate: shop.LastUpdate || null,
            ShipToChina: false,
            Activity: 'activ',
            CustomContent: ""
        };
    }

    formatAffilinetProducts(products) {
        var _products = [];
        if (products) {
            products.forEach((product, index) => {
                var _product = this.formatAffilinetProduct(product);
                if (!_.isEmpty(_product)) {
                    _products.push(_product);
                }
            });
        }
        return _products;
    }

    getPZNfromAmazonProduct(product) {
        let matchPattern = /\d{6,8}\s|\d{6,8}$/i;
        let ProductTitle = _.get(product, "ItemAttributes.Title", null);
        let PZNOfTitle = null;
        if (!_.isNull(ProductTitle) && ProductTitle.match(/PZN/i)) {
            PZNOfTitle = ProductTitle ? ProductTitle.match(matchPattern) ? ProductTitle.match(matchPattern)[0] : null : null;
        }
        let ProductFeature = _.get(product, "ItemAttributes.Feature", null);
        let PZNOfFeature;
        if (_.isArray(ProductFeature)) {
            ProductFeature.forEach((feature, index) => {
                let pzn = feature.match(matchPattern) ? feature.match(matchPattern)[0] : null;
                if (pzn && feature.match(/PZN/i)) {
                    PZNOfFeature = pzn;
                }
            });
        } else if (ProductFeature) {
            let pzn = ProductFeature.match(matchPattern) ? ProductFeature.match(matchPattern)[0] : null;
            if (pzn && ProductFeature.match(/PZN/i)) {
                PZNOfFeature = pzn;
            }
        }
        return PZNOfTitle || PZNOfFeature || null;
    }

    generateAmazonDescription(product) {
        let Features = _.get(product, "ItemAttributes.Feature", null);
        let html = "";
        if (_.isArray(Features)) {
            html = "<b>Feature:</b><br>";
            Features.forEach((feature, index) => {
                html += `${index + 1}. ${feature}<br>`;
            });
            html += "<br>";
        } else if (Features) {
            html = `<b>Feature:</b><br>${Features}<br><br>`;
        }
        html += _.get(product, "EditorialReviews.EditorialReview.Content", "");
        return html;
    }

}

const dataFormatter = new DataFormatter();

module.exports = dataFormatter;
