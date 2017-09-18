var express = require('express');
var router = express.Router();
var OAuth = require('wechat-oauth');
var passport = require('passport');
var request = require("request");
var cookieParser = require("cookie-parser");
var jwt = require('jsonwebtoken');
var setting = require('../setting');
var util = require('util');
var utils = require('../utils/utils.js');
var Utils = new utils();

var vWeChatAppId = "wx9b210984c837ae28",
    vWeChatAppSecret = "f7df0dce4d740b74bc91642d3c29ed70";

router.post('/', passport.authenticate('stormpath', {
    failureRedirect: '/login',
    layout: 'layout',
    title: '错误登录信息'
}), function (req, res, next) {
    req.user.displayName = req.user.username;
    request.post({
        url: setting.duoshuo_setting.importURL,
        form: {
            short_name: setting.duoshuo_setting.short_name,
            secret: setting.duoshuo_setting.secret,
            users: [{
                user_key: req.user.username,
                name: req.user.username
            }]
        }
    }, function (err, httpResponse, body) {
        var user_key = JSON.parse(httpResponse.body).response[req.user.username];
        var duoshuo_token = jwt.sign({
            short_name: setting.duoshuo_setting.short_name,
            user_key: user_key,
            name: req.user.username
        }, setting.duoshuo_setting.secret);
        res.cookie('duoshuo_token', duoshuo_token);
        res.redirect(req.query.from || "/");
    });
});

router.get('/', function (req, res, next) {
    if (req.query.code == undefined || req.query.code == "") {
        res.render('userlogin/login', {
            title: '登录',
            footer_bottom: !Utils.checkMobile(req),
            layout: 'layout',
            // info: '用户名或密码错误, 请重新填写',
            user: req.user
        });
    } else {
        request.post({
            url: setting.duoshuo_setting.authURL,
            form: {
                client_id: setting.duoshuo_setting.short_name,
                code: req.query.code,
            }
        }, function (err, httpResponse, body) {
            if (err) {
                next(err);
            } else {
                request({
                    url: setting.duoshuo_setting.profileURL,
                    qs: {
                        user_id: JSON.parse(httpResponse.body).user_id
                    }
                }, function (err, response) {
                    var user = Utils.duoshuoUserParse(JSON.parse(response.body).response);
                    req.login(user, function (err) {
                        if (!err) {
                            res.redirect("/");
                        } else {
                            next(err)
                        }
                    });
                });
            }
        });
    }
});


router.get('/:from', function (req, res, next) {
    var url = "/" + req.params.from + (req.query.id == undefined ? "" : "?id=" + req.query.id) + (req.query.product_id == undefined ? "" : "?product_id=" + req.query.product_id);
    console.log(url);
    console.log(req.query.code);
    request.post({
        url: setting.duoshuo_setting.authURL,
        form: {
            client_id: setting.duoshuo_setting.short_name,
            code: req.query.code,
        }
    }, function (err, httpResponse, body) {
        if (err) {
            next(err);
        } else {
            request({
                url: setting.duoshuo_setting.profileURL,
                qs: {
                    user_id: JSON.parse(httpResponse.body).user_id
                }
            }, function (err, response) {
                var user = Utils.duoshuoUserParse(JSON.parse(response.body).response);
                req.login(user, function (err) {
                    if (!err) {
                        res.redirect(url);
                    } else {
                        next(err)
                    }
                });
            });
        }
    });
});

router.get('/facebook', passport.authenticate('facebook'));

router.get('/facebook/return', passport.authenticate('facebook', {
    failureRedirect: '/login'
}), function (req, res) {
    req.user.username = req.user.id;
    res.redirect('/');
});

module.exports = router;