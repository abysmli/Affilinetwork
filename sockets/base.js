var Product = require('../models/product.js');
var affilinet = require('../utils/affilinetapi.js');
var aws = require('aws-lib');
var Sync = require('../utils/synchronization.js');
var UpdateDatabase = require('../utils/updatedatabase.js');
var ImportProducts = require('../utils/ImportProducts.js');
var importProducts = new ImportProducts();
var setting = require('../setting.js');
var SocketIOFile = require('socket.io-file');

var Affilinet = new affilinet({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

var prodAdv = aws.createProdAdvClient(setting.amazon_setting.AccessKeyId, setting.amazon_setting.SecretAccessKey, setting.amazon_setting.AssociateTag, {
    host: "ecs.amazonaws.de",
    region: "DE"
});

module.exports = function (io) {
    io.on("connection", function (socket) {
        console.log("Connected to Server Socket IO Service");
    });
    io.of('/product').on("connection", function (socket) {
        socket.on('sync', function (data) {
            var sync = new Sync(Product, Affilinet, prodAdv, {
                type: data.type,
                shopid: data.shopid,
                categoryid: data.categoryid,
                query: data.query || "",
                fq: data.fq || "",
            }, socket);
            sync.sync();
        });

        socket.on('update', function (data) {
            var updatedatabase = new UpdateDatabase(Product, Affilinet, prodAdv, socket);
            updatedatabase.update();
        });
    });
    io.of('/uploadProduct').on("connection", function (socket) {
        var uploader = new SocketIOFile(socket, {
            uploadDir: 'data',							// simple directory
            rename: 'productData.xlsx',
            accepts: ['application/xml', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
            chunkSize: 102400,							// default is 10240(1KB)
            transmissionDelay: 0,						// delay of each transmission, higher value saves more cpu resources, lower upload speed. default is 0(no delay)
            overwrite: true 							// overwrite file if exists, default is true.
        });
        uploader.on('start', (fileInfo) => { });
        uploader.on('stream', (fileInfo) => { });
        uploader.on('complete', (fileInfo) => {
            console.log('Upload Complete.');
            importProducts.init(fileInfo.uploadDir, Product, Affilinet, prodAdv, socket);
            importProducts.parseXLSX();
        });
        uploader.on('error', (err) => {
            console.log('Error!', err);
        });
        uploader.on('abort', (fileInfo) => {
            console.log('Aborted: ', fileInfo);
        });
        socket.on('write', (data) => {
            importProducts.writeIntoDatabase(data, (result) => {
                socket.emit('write-completed', { result: result });
            });
        });
    });
}
