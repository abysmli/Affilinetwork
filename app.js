var express = require('express');
var compression = require('compression');
var partials = require('express-partials');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var passport = require('passport');
var StormpathStrategy = require('passport-stormpath');
var FacebookStrategy = require('passport-facebook').Strategy;
var session = require('express-session');
var flash = require('connect-flash');

var routes = require('./routes/index');
var routes_de = require('./routes/index_de');
var controller = require('./routes/controller');
var weixin = require('./routes/weixin');
var partner = require('./routes/partner');
var login = require('./routes/login');
var register = require('./routes/register');
var register_de = require('./routes/register_de');
var passwordreset = require('./routes/passwordreset');
var passwordreset_de = require('./routes/passwordreset_de');
var link = require('./routes/link');
var setting = require('./setting');

var app = express();

passport.use(new StormpathStrategy({
    apiKeyId: setting.stormpath_setting.API_KEY_ID,
    apiKeySecret: setting.stormpath_setting.API_KEY_SECRET,
    appHref: setting.stormpath_setting.APP_HREF,
}));

passport.use(new FacebookStrategy({
    clientID: setting.facebook_setting.clientID,
    clientSecret: setting.facebook_setting.clientSecret,
    callbackURL: setting.facebook_setting.callbackURL
}, function(accessToken, refreshToken, profile, cb) {
    return cb(null, profile);
}));

passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(compression());
app.use(favicon(__dirname + '/public/favicon.png'));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(partials());
app.use(session({
    secret: setting.secret,
    key: "allhaha",
    cookie: {
        secure: false
    },
    resave: true,
    saveUninitialized: true
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use('/', routes);
app.use('/de', routes_de)
app.use('/controller', controller);
app.use('/weixin', weixin);
app.use('/partner', partner);
app.use('/login', login);
app.use('/register', register);
app.use('/de/register', register_de);
app.use('/password_reset', passwordreset);
app.use('/de/password_reset', passwordreset_de);
app.use('/go', link);

/// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        console.log(err.status);
        res.render('error', {
            title: "发生错误啦！",
            footer_bottom: true,
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    if (err.status == "404") {
        res.render('error-404', {
            title: "发生错误啦！",
            footer_bottom: true,
            message: err.message,
            error: err
        });
    } else {
        res.render('error', {
            title: "发生错误啦！",
            footer_bottom: true,
            message: err.message,
            error: err
        });
    }
});

module.exports = app;