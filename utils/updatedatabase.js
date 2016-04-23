var utils = require('./utils.js');
var Utils = new utils();

module.exports = (function() {
    var _this;

    function _Class(_product, _affilinet, _prodAdv, _socket) {
        this.data = {};
        this.data.update_count = 0;
        this.data.deactiv_count = 0;
        this.Affilinet = _affilinet;
        this.prodAdv = _prodAdv;
        this.Product = _product;
        this.socket = _socket;
        this.timer = new Date().getTime();
        _this = this;
    }

    _Class.prototype.update = function update(_currentPage) {
        normalizeEAN(function(err, eans) {
            syncLooper(eans, 0);
        });
    }

    var normalizeEAN = function(cb) {
        _this.Product.aggregate([{
            "$match": {
                EAN: {
                    $ne: 'null',
                }
            }
        }, {
            "$group": {
                _id: "$EAN"
            }
        }], function(err, eans) {
            var EANS = [];
            var normalizeNummber = 0;
            eans.forEach(function(ean, index) {
                var _ean = ean._id || "";
                var __ean = "";
                if (_ean.length == 14) {
                    __ean = _ean.substr(_ean.length - 13);
                    _this.Product.update({ EAN: _ean }, { EAN: __ean }, { multi: true }, function(err, product) {
                        console.log('Normalized: ' + (++normalizeNummber));
                    });
                } else if (_ean.length == 12) {
                    __ean = "0" + _ean;
                    _this.Product.update({ EAN: _ean }, { EAN: __ean }, { multi: true }, function(err, product) {
                        console.log('Normalized: ' + (++normalizeNummber));
                    });
                } else if (_ean.length == 13) {
                    __ean = _ean;
                } else {
                    return;
                }
                EANS.push(__ean);
            });
            console.log("EANs prepared for Sync: \n" + EANS + "\nTotal " + EANS.length + "EANs for sync!\n");
            cb(err, EANS);
        });
    }

    var syncLooper = function(eans, i) {
        if (i != 0) {
            var _timer = new Date().getTime();
            console.log("Loop time cost: " + (_timer - _this.timer) + "ms\n");
            _this.timer = _timer;
        }
        Utils.syncProductByEAN(_this.Affilinet, _this.prodAdv, _this.Product, eans[i], function(update_count, deactiv_count, err) {
            if (err) {
                console.log("Error occured! Now retry!");
                syncLooper(eans, i);
            } else {
                console.log("Updated Count: " + update_count + " | Deactived Count: " + deactiv_count + " | Product Number: " + i + " | Product Summer: " + eans.length + " | EAN: " + eans[i]);
                _this.socket.emit("update_process", {
                    segment_count: i,
                    segment_length: eans.length
                });
                if (i == eans.length - 1) {
                    console.log('Sync finished!');
                    _this.socket.emit("update_finished", {
                        update_count: _this.data.update_count,
                        deactiv_count: _this.data.deactiv_count
                    });
                } else {
                    _this.data.update_count += update_count;
                    _this.data.deactiv_count += deactiv_count;
                    syncLooper(eans, ++i);
                }
            }
        });
    }

    return _Class;
})();
