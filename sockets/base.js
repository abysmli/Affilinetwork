var Product = require('../models/product.js');
var Affilinet = require('../utils/affilinetapis.js');
var Sync = require('../utils/synchronization.js');
var setting = require('../setting.js');

var affilinet = new Affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

module.exports = function (io) {
    io.of('/sync').on("connection", function (socket) {
        socket.on('sync', function (data) {
            var sync = new Sync(Product, affilinet, { type: data.type, id: data.id}, socket);
            sync.sync();
        });
    });
}
