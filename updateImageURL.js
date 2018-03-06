const mongoose = require('mongoose');
const Product = require('./models/product');
var setting = require('./setting');
mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/' + setting.database, {
    useMongoClient: true
});
(() => {
    let product_sum = 0;
    Product.find().exec((err, products) => {
        console.log(`Product Sum: ${products.length}`);
        products.forEach(product => {
            product.ProductImage = product.ProductImage.split('?')[0];
            product.ProductImageSet.forEach(imageurl => {
                imageurl = imageurl.split('?')[0];
            });
            product.save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`${product_sum++} : ${product.EAN}`);
                    if (product_sum === products.length) {
                        process.exit(0);
                    }
                }
            });
        });
    });
})();