var express = require('express');
var stormpath = require('stormpath')
var fs = require('fs');
var application, token;
var router = express.Router();

var apiKey = new stormpath.ApiKey(
    process.env['STORMPATH_CLIENT_APIKEY_ID'],
    process.env['STORMPATH_CLIENT_APIKEY_SECRET']
);

var client = new stormpath.Client({
    apiKey: apiKey
});

router.get("/", function (req, res, next) {
    res.render("userlogin/forgot", {
        title: "重置您的密码",
        info: "忘记密码? 请输入注册时的邮箱地址.",
        layout: "layout"
    });
});

router.post("/", function (req, res, next) {
    var useremail = req.body.emailadress;
    client.getApplication('https://api.stormpath.com/v1/applications/1B6KeDZJevx5CHhqQn6jdl', function (err, app) {
        app.sendPasswordResetEmail({
            email: useremail
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
    var password = req.body.newpassword;
    client.getApplication('https://api.stormpath.com/v1/applications/1B6KeDZJevx5CHhqQn6jdl', function (err, app) {
        app.verifyPasswordResetToken(req.query.sptoken, function (err, verficationResponse) {
            if (err) {
                next(err);
            } else {
                app.resetPassword(req.query.sptoken, password, function (err, result) {
                    res.redirect('/');
                });
            }
        });
    });
});

module.exports = router;
