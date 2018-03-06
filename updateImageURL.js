const mongoose = require('mongoose');
const Product = require('./models/product');
mongoose.connect('mongodb://localhost/aok-china');
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