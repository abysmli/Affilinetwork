var express = require('express');
var router = express.Router();
var setting = require('../setting');
var client = require('../utils/stormpathClient');
var utils = require('../utils/utils.js');
var Utils = new utils();

router.get("/", function (req, res, next) {
    res.render("userlogin/forgot_de", {
        title: "Ihres Password zurücksetzen",
        footer_bottom: !Utils.checkMobile(req),
        info: "Password vergessen? Bitte geben Sie Ihre Email Addresse ein.",
        layout: "layout_de"
    });
});

router.post("/", function (req, res, next) {
    client.getApplication(setting.stormpath_setting.APP_HREF, function (err, app) {
        app.sendPasswordResetEmail({
            email: req.body.emailadress
        }, function (err, passwordResetToken) {
            res.redirect('/DE');
        });
    });
});

router.get('/changePassword', function (req, res, next) {
    res.render('userlogin/changePassword_de', {
        title: 'Password zurücksetzen',
        footer_bottom: !Utils.checkMobile(req),
        info: 'Geben Sie Ihres neue Password ein',
        layout: 'layout_de'
    });
});

router.post('/changePassword', function (req, res, next) {
    client.getApplication(setting.stormpath_setting.APP_HREF, function (err, app) {
        app.verifyPasswordResetToken(req.query.sptoken, function (err, verficationResponse) {
            if (err) {
                next(err);
            } else {
                app.resetPassword(req.query.sptoken, req.body.newpassword, function (err, result) {
                    res.redirect('/');
                });
            }
        });
    });
});

module.exports = router;
