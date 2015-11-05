var express = require('express');
var stormpath = require('stormpath')
var fs = require('fs');
var application,
    token;
var router = express.Router();


var apiKey = new stormpath.ApiKey(
    process.env['STORMPATH_CLIENT_APIKEY_ID'],
    process.env['STORMPATH_CLIENT_APIKEY_SECRET']
);

var client = new stormpath.Client({
    apiKey: apiKey
});

router.get("/", function (req, res) {
    res.render("userlogin/forgot", {
        title: "重置您的密码",
        info: "忘记密码? 请输入注册时的邮箱地址.",
        layout: "layout"


    });
});

router.post("/", function (req, res) {
    var useremail = req.body.emailadress;
    application.sendPasswordResetEmail({
        email: useremail
    }, function (err, passwordResetToken) {
        res.redirect('/');
    });



});

router.get('/changePassword', function (req, res) {
    var sptoken = req.query.sptoken;
    token = sptoken;
    client.getApplication('https://api.stormpath.com/v1/applications/1B6KeDZJevx5CHhqQn6jdl', function (err, app) {
        application = app

    });
    res.render('userlogin/changePassword', {
        title: '重置密码',
        info: '请输入您的新密码以重置',
        layout: 'layout'
    });
});



router.post('/changePassword', function (req, res) {
    var password = req.body.newpassword;
    application.verifyPasswordResetToken(token, function (err, verficationResponse) {
        if (err) {
            console.log(err);
            res.render('error');
        } else {
            application.resetPassword(token, password, function (err, result) {
                res.redirect('/');
            })
        }
    })
});




module.exports = router;
