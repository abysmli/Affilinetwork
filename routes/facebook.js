var express = require('express');
var router = express.Router();
var passport = require('passport');
var Strategy = require('passport-facebook').Strategy;

var setting = require('../setting');
var client = require('../utils/stormpathClient');
var utils = require('../utils/utils.js');
var Utils = new utils();

// Configure the Facebook strategy for use by Passport.
//
// OAuth 2.0-based strategies require a `verify` function which receives the
// credential (`accessToken`) for accessing the Facebook API on the user's
// behalf, along with the user's profile.  The function must invoke `cb`
// with a user object, which will be set at `req.user` in route handlers after
// authentication.
passport.use(new Strategy({
        clientID: "223135654738206",
        clientSecret: "2ac7871cfc70a904af4e889a92ef3814",
        callbackURL: 'http://localhost:3000/login/facebook/return'
    },
    function(accessToken, refreshToken, profile, cb) {
        // In this example, the user's Facebook profile is supplied as the user
        // record.  In a production-quality application, the Facebook profile should
        // be associated with a user record in the application's database, which
        // allows for account linking and authentication with other identity
        // providers.
        return cb(null, profile);
    }));


// Configure Passport authenticated session persistence.
//
// In order to restore authentication state across HTTP requests, Passport needs
// to serialize users into and deserialize users out of the session.  In a
// production-quality application, this would typically be as simple as
// supplying the user ID when serializing, and querying the user record by ID
// from the database when deserializing.  However, due to the fact that this
// example does not have a database, the complete Twitter profile is serialized
// and deserialized.
passport.serializeUser(function(user, cb) {
    cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
    cb(null, obj);
});


// Define routes.
router.get('/',
    function(req, res) {
        res.render('facebook/home', {
            user: req.user
        });
    });

router.get('/login',
    function(req, res) {
        res.render('facebook/login');
    });

router.get('/login/facebook',
    passport.authenticate('facebook'));

router.get('/login/facebook/return',
    passport.authenticate('facebook', {
        failureRedirect: '/facebook/login'
    }),
    function(req, res) {
        res.redirect('/facebook/');
    });

router.get('/profile',
    require('connect-ensure-login').ensureLoggedIn(),
    function(req, res) {
        res.render('facebook/profile', {
            user: req.user
        });
    });


module.exports = router;