const utils = require('./utils.js');
const Utils = new utils();
const csv = require("fast-csv");
const fs = require('fs');
const xlsx = require('node-xlsx').default;

class ImportProducts {
    constructor() { }

    init(_filePath, _product, _affilinet, _prodAdv, _socket) {
        this.filePath = _filePath;
        this.Affilinet = _affilinet;
        this.prodAdv = _prodAdv;
        this.Product = _product;
        this.socket = _socket;
        this.metaData = [];
        this.parseData = [];
    }

    // Todo: add a button, in order to overwrite the translation
    parseXLSX() {
        let workSheetsFromBuffer = xlsx.parse(fs.readFileSync(`${process.cwd()}/data/productData.xlsx`));
        let products = workSheetsFromBuffer[0].data;
        products.forEach((product, index) => {
            if (index !== 0) {
                var parsedProduct = {
                    ProductId: product[0].toString() || "",
                    ASIN: product[1] || "",
                    URL: product[2] || "",
                    ShortURL: product[3] || "",
                    ProductName: product[4] || "",
                    SalesRank: product[5] || "",
                    ProductImage: product[6] || "",
                    ProductImageSet: product[7] ? JSON.parse(product[7]) : [],
                    Brand: product[8] || "",
                    Manufactor: product[9] || "",
                    EAN: product[10] ? product[10] + "" : "",
                    PZN: product[11] ? product[11] + "" : "",
                    Description: product[12] || "",
                    DescriptionCN: product[13] || "",
                    Price: product[14] || "",
                    PriceCurrency: product[15] || "",
                    Shipping: product[16] || "",
                    Title: product[17] || "",
                    TitleCN: product[18] || "",
                    ShopName: product[19] || "",
                    ShopId: product[20] || "",
                    Category: product[21] || "",
                    Weight: product[22] || "",
                    ItemDimensions: product[23] ? JSON.parse(product[23]) : {},
                    PackageDimensions: product[24] ? JSON.parse(product[24]) : {},
                    DeliveryTime: product[26] || "",
                    Keywords: product[27] || "",
                    Source: product[28] || "",
                    Translated: product[29] == "TRUE",
                    Activity: true,
                    TranslationQuality: (product[29] == "TRUE") ? "2" : "-1",
                }
                if (parsedProduct.ProductImage == '') {
                    delete parsedProduct.ProductImage;
                }
                if (parsedProduct.ProductImageSet == '') {
                    delete parsedProduct.ProductImageSet;
                }
                this.parseData.push(parsedProduct);
                this.metaData.push(product);
            }
        });
        this.socket.emit("parseFile", this.metaData);
    }

    writeIntoDatabase(data, callback) {
        if (this.parseData) {
            let counter = this.parseData.length;
            this.parseData.forEach((product, index) => {
                Utils.shortURL(product.URL, (err, shorturl) => {
                    product.ShortURL = shorturl;
                    if (!product.ProductImage) {
                        if (product.ProductImageSet) {
                            product.ProductImage = product.ProductImageSet[0];
                        }
                    }
                    if (!data.overwrite) {
                        delete product.DescriptionCN;
                        delete product.TitleCN;
                        delete product.Translated;
                        delete product.TranslationQuality;
                    }
                    this.Product.update({ ProductId: product.ProductId }, product, { upsert: true }, function (err, raw) {
                        if (err) {
                            console.log("Error occured at saving Manual Product into Database: " + JSON.stringify(err));
                            return callback(false);
                        }
                        if (--counter == 0) {
                            callback(true);
                        }
                    });
                });
            });
        } else {
            callback(false);
        }
    }
}

module.exports = ImportProducts;