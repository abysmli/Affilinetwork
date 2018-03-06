const mongoose = require('mongoose');
const Product = require('./models/product');
const setting = require('./setting');

mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/' + setting.database, {
    useMongoClient: true
});


(() => {
    console.log("Get In Program");
    var _products = [],
        product_sum = 0,
        limit = 1000,
        skip = 0,
        pages = 0;
    Product.count({}, function (err, counts) {
        console.log(`Product Sum: ${counts}`);
        pages = Math.round(counts / limit);
        console.log(`Pages : ${pages}`);
        mainLoop(0);
    });

    function mainLoop(page) {
        if (page < pages) {
            skip = page * limit;
            Product.find({}).limit(limit).skip(skip).exec((err, products) => {
                console.log(`Page: ${page} | Skip: ${skip}`);
                _products = products;
                updateURL(0, page);
            });
        } else {
            console.log('finished!');
            process.exit(0);
        }
    }

    function updateURL(i, page) {
        let product = _products[i];
        if (product.ProductImage) {
            product.ProductImage = product.ProductImage.split('?')[0];
            if (product.ProductImageSet.length !== 0) {
                product.ProductImageSet.forEach(imageurl => {
                    imageurl = imageurl.split('?')[0];
                });
            }
            product.save((err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log(`${++product_sum} : ${page} : ${product.EAN}`);
                    if ((i + 1) === _products.length) {
                        mainLoop(page + 1);
                    } else {
                        updateURL(i + 1);
                    }
                }
            });
        } else {
            console.log(`${++product_sum} : ${page} : ${product.EAN}`);
            if ((i + 1) === _products.length) {
                mainLoop(page + 1);
            } else {
                updateURL(i + 1);
            }
        }
    }
})();