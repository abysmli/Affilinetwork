var express = require('express');
var router = express.Router();
var passport = require('passport');
var setting = require('../setting');
var client = require('../utils/stormpathClient');

router.get('/', function(req, res, next) {
    res.render('userlogin/register', {
        title: 'Login',
        layout: 'layout',
        error: req.flash('error')[0]
    });
});

router.post('/', function(req, res, next) {
    var account = {
        username: req.body.username,
        password: req.body.password,
        email: req.body.emailadress,
        givenName: req.body.lastname,
        surname: req.body.firstname,
    };
    var app = client.getApplication(setting.stormpath_setting.APP_HREF, function(err, app) {
        if (err) return next(err);
        app.createAccount(account, function(err, createdAccount) {
            if (err) {
                return res.render('userlogin/error', {
                    title: '注册信息有误, 需重新填写',
                    layout: 'layout',
                    info: err.userMessage
                });
            } else {
                passport.authenticate('stormpath')(req, res, function() {
                    return res.redirect('/');
                });
            }
        });
    });
});

module.exports = router;