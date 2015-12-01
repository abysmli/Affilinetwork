var express = require('express');
var router = express.Router();
var setting = require('../setting');
var client = require('../utils/stormpathClient');

router.get("/", function (req, res, next) {
    res.render("userlogin/forgot", {
        title: "重置您的密码",
        info: "忘记密码? 请输入注册时的邮箱地址.",
        layout: "layout"
    });
});

router.post("/", function (req, res, next) {
    client.getApplication(setting.stormpath_setting.APP_HREF, function (err, app) {
        app.sendPasswordResetEmail({
            email: req.body.emailadress
        }, function (err, passwordResetToken) {
            res.redirect('/');
        });
    });
});

router.get('/changePassword', function (req, res, next) {   
    res.render('userlogin/changePassword', {
        title: '重置密码',
        info: '请输入您的新密码以重置',
        layout: 'layout'
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
