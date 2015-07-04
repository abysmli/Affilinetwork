var basicAuth = require('basic-auth');
var setting = require('../setting.js');

var auth = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.send(401);
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };

    if (user.name === setting.username && user.pass === setting.password) {
        return next();
    } else {
        return unauthorized(res);
    };
};

module.exports = auth;