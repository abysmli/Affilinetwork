var express = require('express');
var compression = require('compression');
var minify = require('express-minify');
var partials = require('express-partials');
var session = require('express-session');
var mongoose = require('mongoose');
var MongoStore = require('connect-mongo')(session);
var flash = require('connect-flash');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var csrf = require('csurf');
var bodyParser = require('body-parser');
var passport = require('passport');
var requestIp = require('request-ip');
var routes = require('./routes/index');
var routes_de = require('./routes/index_de');
var controller = require('./routes/controller');
var api = require('./routes/api');
var weixin = require('./routes/weixin');
var partner = require('./routes/partner');
var login = require('./routes/login');
var oauth = require('./routes/oauth');
var register = require('./routes/register');
var register_de = require('./routes/register_de');
var passwordreset = require('./routes/passwordreset');
var passwordreset_de = require('./routes/passwordreset_de');
var link = require('./routes/link');
var setting = require('./setting');

var app = express();

mongoose.Promise = require('bluebird');
mongoose.connect('mongodb://localhost/' + setting.database, {useMongoClient: true});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(compression());
app.use(minify());
app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json({
    limit: '50mb'
}));
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}));
app.use(session({
    store: new MongoStore({
        mongooseConnection: mongoose.connection,
        autoRemove: 'disabled'
    }),
    secret: setting.secret,
    unset: 'keep',
    key: 'allhaha',
    cookie: {
        expires: new Date(253402300000000)
    },
    resave: true,
    saveUninitialized: true
}));
app.use(cookieParser());
app.use(csrf({ cookie: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(partials());
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(requestIp.mw());

app.use('/', routes);
app.use('/de', routes_de)
app.use('/controller', controller);
app.use('/api', api);
app.use('/weixin', weixin);
app.use('/partner', partner);
app.use('/login', login);
app.use('/wx/auth/ack', oauth);
app.use('/go', link);

/// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
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
app.use(function (err, req, res, next) {
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