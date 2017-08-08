var utils = require('./utils.js');
var Utils = new utils();
var csv = require("fast-csv");

module.exports = (function () {
    var _this;

    function _Class() { }

    _Class.prototype.init = function init(_filePath, _product, _affilinet, _prodAdv, _socket) {
        this.filePath = _filePath;
        this.Affilinet = _affilinet;
        this.prodAdv = _prodAdv;
        this.Product = _product;
        this.socket = _socket;
        this.metaData = [];
        this.parseData = [];
        _this = this;
    }

    // Todo: add a button, in order to overwrite the translation
    _Class.prototype.parse = function parse() {
        csv.fromPath(process.cwd() + "/data/productData.csv")
            .on("data", function (data) {
                // if (data[29] != "TRUE") {
                //     Utils.GoogleTranslate(data[17], function (err, TitleCN) {
                //         if (err) {
                //             console.log("Error occured at Translate Title!");
                //         }
                //         Utils.GoogleTranslate(data[12], function (err, DescriptionCN) {
                //             if (err) {
                //                 console.log("Error occured at Translate Description!");
                //             }
                //             var _data = {
                //                 ProductId: data[0],
                //                 ASIN: data[1],
                //                 URL: data[2],
                //                 ShortURL: data[3],
                //                 ProductName: data[4],
                //                 SalesRank: data[5],
                //                 ProductImage: data[6],
                //                 ProductImageSet: data[7],
                //                 Brand: data[8],
                //                 Manufactor: data[9],
                //                 EAN: data[10].substring(0, 13),
                //                 PZN: data[11],
                //                 Description: data[12],
                //                 DescriptionCN: DescriptionCN + "  ----('来自Google翻译！')",
                //                 Price: data[14],
                //                 PriceCurrency: data[15],
                //                 Shipping: data[16],
                //                 Title: data[17],
                //                 TitleCN: data[18],
                //                 ShopName: data[19],
                //                 ShopId: data[20],
                //                 Category: data[21],
                //                 Weight: data[22],
                //                 ItemDimensions: data[23] || {},
                //                 PackageDimensions: data[24] || {},
                //                 DeliveryTime: data[26],
                //                 Keywords: data[27],
                //                 Source: data[28],
                //                 Translated: true,
                //                 Activity: true,
                //                 TranslationQuality: "0",
                //                 update_at: new Date()
                //             }
                //             _this.parseData.push(_data);
                //             _this.metaData.push(data);
                //         });
                //     });
                // } else {
                var _data = {
                    ProductId: data[0],
                    ASIN: data[1],
                    URL: data[2],
                    ShortURL: data[3],
                    ProductName: data[4],
                    SalesRank: data[5],
                    ProductImage: data[6],
                    ProductImageSet: data[7],
                    Brand: data[8],
                    Manufactor: data[9],
                    EAN: data[10].substring(0, 13),
                    PZN: data[11],
                    Description: data[12],
                    DescriptionCN: data[13],
                    Price: data[14],
                    PriceCurrency: data[15],
                    Shipping: data[16],
                    Title: data[17],
                    TitleCN: data[18],
                    ShopName: data[19],
                    ShopId: data[20],
                    Category: data[21],
                    Weight: data[22],
                    ItemDimensions: data[23] || {},
                    PackageDimensions: data[24] || {},
                    DeliveryTime: data[26],
                    Keywords: data[27],
                    Source: data[28],
                    Translated: data[29] == "TRUE",
                    Activity: true,
                    TranslationQuality: (data[29] == "TRUE") ? "2" : "-1",
                    update_at: new Date()
                }
                _this.parseData.push(_data);
                _this.metaData.push(data);
            })
            .on("end", function () {
                _this.parseData.shift();
                _this.metaData.shift();
                _this.socket.emit("parseFile", _this.metaData);
            });
    }

    _Class.prototype.write = function write(cb) {
        var update_count = 0;
        _this.parseData.forEach((product, index) => {
            Utils.shortURL(product.URL, (err, shorturl) => {
                product.ShortURL = shorturl;
                _this.Product.update({ ProductId: product.ProductId }, product, { upsert: true }, function (err, raw) {
                    if (err) {
                        console.log("Error occured at saving Manual Product into Database: " + JSON.stringify(err));
                        return cb(false);
                    }
                    if (++update_count == _this.parseData.length) {
                        cb(true);
                    }
                });
            });
        });
    }

    return _Class;
})();
