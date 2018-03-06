const mongoose = require('mongoose');
const Product = require('./models/product');
let setting = require('./setting');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/' + setting.database, {
    useMongoClient: true
});
var _products = [];
(() => {
    let product_sum = 0;
    Product.find({}, (err, products) => {
        console.log(`Product Sum: ${products.length}`);
        _products = products;
        // updateURL(0);
        process.exit(0);
    });
})();

function updateURL(i) {
    let product = _products[i];
    product.ProductImage = product.ProductImage.split('?')[0];
    product.ProductImageSet.forEach(imageurl => {
        imageurl = imageurl.split('?')[0];
    });
    product.save((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`${i+1} : ${product.EAN}`);
            if ((i + 1) === _products.length) {
                process.exit(0);
            } else {
                updateURL(i + 1);
            }
        }
    });
}