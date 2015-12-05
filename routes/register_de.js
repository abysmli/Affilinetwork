var express = require('express');
var router = express.Router();
var passport = require('passport');
var setting = require('../setting');
var client = require('../utils/stormpathClient');

router.get('/', function(req, res, next) {
    res.render('userlogin/register_de', {
        title: 'Registeren',
        footer_bottom: true,
        layout: 'layout_de',
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
                return res.render('userlogin/error_de', {
                    title: 'Nicht gültige Eingabe',
                    footer_bottom: true,
                    layout: 'layout_de',
                    info: err.userMessage
                });
            } else {
                passport.authenticate('stormpath')(req, res, function() {
                    return res.redirect('/DE');
                });
            }
        });
    });
});


module.exports = router;
