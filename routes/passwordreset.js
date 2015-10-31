var express = require('express');
var fs = require('fs');
var router = express.Router();

var forgot = require('password-reset')({
    uri : 'http://localhost:8818/password_reset',
    from : 'password-robot@localhost',
    host : 'localhost', port : 25,
});

router.use(forgot.middleware);


router.get("/", function(req, res){
    res.render("userlogin/forgot", {
        title: "重置您的密码",
        info: "忘记密码? 请输入注册时的邮箱地址.",
        layout: "layout"


    });
});

router.post("/", function(req, res){
    var email = req.body.emailadress;

    var reset = forgot(email, function(err){
        if(err) res.end('Error sending Message:' +err);
        else res.end('Check your inbox')
    });

    reset.on('request', function(req_, res_){
        req_.session.reset = {email: email, id: reset.id};
        fs.createReadStream(__dirname + '/forgot.html').pipe(res_);
    });
});





module.exports = router;
