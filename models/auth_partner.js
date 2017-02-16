var basicAuth = require('basic-auth');
var setting = require('../setting.js');

var auth = function (req, res, next) {
    function unauthorized(res) {
        res.set('WWW-Authenticate', 'Basic realm=Authorization Required');
        return res.sendStatus(401);
    };

    var user = basicAuth(req);

    if (!user || !user.name || !user.pass) {
        return unauthorized(res);
    };

    if ((user.name === setting.partner_username || user.name === setting.partner_username_1) && (user.pass === setting.partner_password || user.pass === setting.partner_password_1)) {
        return next();
    } else {
        return unauthorized(res);
    };
};

module.exports = auth;