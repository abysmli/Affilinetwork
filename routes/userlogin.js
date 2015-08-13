var express = require('express');
var router = express.Router();
var passport = require('passport');
var Account = require('../models/account.js');

router.get('/', function (req, res, next) {
    res.render('userlogin/register', {
        title: 'Login',
        layout: 'layout',
        user: req.user
    });

});


router.post('/', function (req, res) {
    Account.register(new Account({
        username: req.body.username
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
});




module.exports = router;
