var Product = require('../models/product.js');
var affilinet = require('../utils/affilinetapi.js');
var Sync = require('../utils/synchronization.js');
var UpdateDatabase = require('../utils/updatedatabase.js');
var setting = require('../setting.js');

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

module.exports = function (io) {
    io.of('/product').on("connection", function (socket) {
        socket.on('sync', function (data) {
            var sync = new Sync(Product, Affilinet, {
                type: data.type,
                shopid: data.shopid,
                categoryid: data.categoryid,
                query: data.query || "",
                fq: data.fq || "",
            }, socket);
            sync.sync();
        });
        
        socket.on('update', function (data) {
            var updatedatabase = new UpdateDatabase(Product, Affilinet, socket);
            updatedatabase.update();
        });
    });
}
