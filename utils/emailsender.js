var nodemailer = require('nodemailer');
var fs = require('fs');
var ejs = require('ejs');
var setting = require('../setting.js');

module.exports = (function() {
    function _Class() {}

    _Class.prototype.send = function send(data, callback) {
        var to = data.to;
        var template = process.cwd() + '/views/' + data.template + '.ejs';
        var subject = data.subject;
        var content = data.content;

        var transporter = nodemailer.createTransport({
            service: setting.email_setting.service,
            auth: setting.email_setting.auth
        });

        // Use fileSystem module to read template file
        fs.readFile(template, 'utf8', function(err, file) {
            if (err) return callback(err);

            var html = ejs.render(file, content);

            var mailOptions = {
                from: setting.email_setting.from,
                to: to,
                subject: subject,
                html: html
            };

            transporter.sendMail(mailOptions, function(err, info) {
                // If a problem occurs, return callback with the error
                if (err) return callback(err);
                console.log(info);
                callback();
            });
        });
    }
    
    return _Class;
})();