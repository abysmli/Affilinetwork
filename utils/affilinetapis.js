var execFile, lift;
execFile = require('child_process').execFile;
lift = function (cb, f) {
    return function (err, result) {
        if (err != null) {
            return cb(err);
        } else {
            return cb(null, f(result));
        }
    };
};
module.exports = (function () {
    function _Class(options) {
        this.options = options;
    }
    _Class.prototype._exec = function (filename, args, cb) {
        var file;
        file = "" + __dirname + "/php/" + filename + ".php";
        return execFile(file, args, {
            maxBuffer: 5000 * 1024
        }, function (err, stdout, stderr) {
            if (err != null) {
                return cb(new Error("stdout: " + stdout + ", stderr: " + stderr + " err: " + (err.toString())));
            }
            return cb(null, JSON.parse(stdout));
        });
    };
    
    _Class.prototype.getIndentifierExpiration = function (cb) {
        var args;
        args = [this.options.publisherId, this.options.publisherWebservicePassword];
        return this._exec('get-indentifier-expiration', args, lift(cb, function (results) {
            var _ref;
            console.log(JSON.stringify(results));
            return (results != null ? (_ref = results.CreativeCollection) != null ? _ref.Creative : void 0 : void 0) || [];
        }));
    };
    
    _Class.prototype.searchCreatives = function (displayOptions, query, cb) {
        var args;
        args = [this.options.publisherId, this.options.publisherWebservicePassword, JSON.stringify(displayOptions), JSON.stringify(query)];
        return this._exec('search-creatives', args, lift(cb, function (results) {
            var _ref;
            return (results != null ? (_ref = results.CreativeCollection) != null ? _ref.Creative : void 0 : void 0) || [];
        }));
    };
    
    _Class.prototype.getPrograms = function (displayOptions, query, cb) {
        var args;
        args = [this.options.publisherId, this.options.publisherWebservicePassword, JSON.stringify(displayOptions), JSON.stringify(query)];
        return this._exec('get-programs', args, lift(cb, function (results) {
            var _ref;
            return (results != null ? (_ref = results.ProgramCollection) != null ? _ref.Program : void 0 : void 0) || [];
        }));
    };
    
    _Class.prototype.getShopList = function (cb) {
        var args;
        args = [this.options.publisherId, this.options.productWebservicePassword];
        return this._exec('getShopList', args, lift(cb, function (results) {
            var _ref;
            return results != null ? (_ref = results.Shops) != null ? _ref.Shop : void 0 : void 0;
        }));
    };
    
    _Class.prototype.getCategorys = function (cb) {
        var args;
        args = [this.options.publisherId, this.options.productWebservicePassword];
        return this._exec('get-category-list', args, lift(cb, function (results) {
            var _ref;
            return results != null ? (_ref = results.Categories) != null ? _ref.Category : void 0 : void 0;
        }));
    };
    
    _Class.prototype.getProducts = function (cb) {
        var args;
        args = [this.options.publisherId, this.options.productWebservicePassword];
        return this._exec('get-products', args, lift(cb, function (results) {
            var _ref;
            console.log(JSON.stringify(results));
            return results != null ? (_ref = results.Products) != null ? _ref.product : void 0 : void 0;
        }));
    };
    
    _Class.prototype.getSalesLeadsBySubIdPerDay = function (startDate, endDate, cb) {
        var args;
        args = [this.options.publisherId, this.options.publisherWebservicePassword, Math.floor(startDate.getTime() / 1000), Math.floor(endDate.getTime() / 1000)];
        return this._exec('get-sales-leads-by-sub-id-per-day', args, lift(cb, function (results) {
            var _ref, _ref2;
            return results != null ? (_ref = results.ArrayOfSalesLeadsBySubIdRecords) != null ? (_ref2 = _ref.SalesLeadsBySubIdRecords) != null ? _ref2.SalesLeadsBySubIdRecord : void 0 : void 0 : void 0;
        }));
    };
    
    return _Class;
})();