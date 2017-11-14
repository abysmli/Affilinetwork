const aws = require('aws-lib');
const setting = require('../../setting');
const util = require('util');
const _ = require('lodash');
const DataFormatter = require('./DataFormatter');
const prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

module.exports = {
    getProductByEAN: (EAN, callback) => {
        console.time("GET Amazon Product by EAN: " + EAN);
        prodAdv.call("ItemLookup", {
            ItemId: EAN,
            IdType: "EAN",
            SearchIndex: "All",
            ResponseGroup: "Large",
        }, function (err, product) {
            if (err) {
                console.log(err);
                callback({});
            }
            console.timeEnd("GET Amazon Product by EAN: " + EAN);
            console.log(util.inspect(product, false, null));
            let _product = _.get(product, "Items.Item", null);
            callback(DataFormatter.formatAmazonProduct(_product));
        });
    },
    getProductByASIN: (ASIN, callback) => {
        console.time("GET Amazon Product by ASIN: " + ASIN);
        prodAdv.call("ItemLookup", {
            ItemId: ASIN,
            ResponseGroup: "Large", 
        }, function (err, product) {
            if (err) {
                console.log(err);
            }
            console.timeEnd("GET Amazon Product by ASIN: " + ASIN);
            console.log(util.inspect(product, false, null));
            callback(DataFormatter.formatAmazonProduct(product.Items.Item));
        });
    },
    getProductByPZN: () => {

    },
    searchProducts: () => {

    },
    retryRequestLoop: (actionFunction) => {
        actionFunction();
    }

}