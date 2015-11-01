var express = require('express');
var router = express.Router();
var passport = require('passport');
var stormpath = require('stormpath');
var Account = require('../models/account.js');

router.get('/', function (req, res, next) {
    res.render('userlogin/register', {
        title: 'Login',
        layout: 'layout',
        error: req.flash('error')[0]
    });

});


/*router.post('/', function (req, res) {
    Account.register(new Account({
        username: req.body.username,
        usermail: req.body.emailadress
    }), req.body.password, function (err, account) {
        if (err) {
            return res.render("userlogin/error", {
                title: 'Sign Up',
                layout: "layout",
                user: req.user,
                info: "抱歉, 用户名已被注册, 请重新填写一个."
            });
        }
        passport.authenticate('local')(req, res, function () {
            res.redirect('/');
        });
    });
});*/


router.post('/', function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    var usermail = req.body.emailadress;
    var lastname = req.body.lastname;
    var firstname = req.body.firstname;
    console.log(JSON.stringify(process.env['STORMPATH_API_KEY_ID']));
    var apiKey = new stormpath.ApiKey("397LI2GNKPM6SZP2VG0G3UY8P", "OYgqGmS3an41E0dBZNV9d6ftKs9ybs1F36KiallaXms");
    var spClient = new stormpath.Client({apiKey: apiKey});

    var app = spClient.getApplication(process.env['STORMPATH_APP_HREF'], function(err, app){
        if(err) throw err;

        app.createAccount({
            username: username,
            email: usermail,
            password: password,
            givenName: lastname,
            surname: firstname,
        }, function(err, createdAccount){
            if(err){
                return res.render('userlogin/error', {
                   title: '注册信息有误, 需重新填写',
                    layout: 'layout',
                    info: err.userMessage
                });
            }else {
                passport.authenticate('stormpath')(req, res, function() {
                    return res.redirect('/');
                });
            }
        });
    });
});



module.exports = router;
