var express = require('express');
var partials = require('express-partials');
var path = require('path');
var mongoose = require('mongoose');
var stormpath = require('express-stormpath');
var passport = require('passport');
var StormpathStrategy = require('passport-stormpath');
var session = require('express-session');
var flash = require('connect-flash');

var LocalStrategy = require('passport-local').Strategy;
var favicon = require('static-favicon');
var flash = require('connect-flash');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var routes = require('./routes/index');
var controller = require('./routes/controller');
var register = require('./routes/register');
var passwordreset = require('./routes/passwordreset');
var basicAuth = require('basic-auth');
var Account = require('./models/account.js');

var app = express();

var strategy = new StormpathStrategy();

passport.use(strategy);
passport.serializeUser(strategy.serializeUser);
passport.deserializeUser(strategy.deserializeUser);


// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(favicon());
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}));

app.use(cookieParser('your secret here'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(partials());

app.use(session({
    secret: process.env.EXPRESS_SECRET || 'Affilinet',
    key: "F&&L",
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
app.use('/controller', controller);
app.use('/register', register);
app.use('/password_reset', passwordreset);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

/// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
