var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var connection = mongoose.createConnection('mongodb://localhost/affilinet');

var Feedback = new mongoose.Schema({
    name: String,
    email: String,
    subtitle: String,
    feedback: String
});

module.exports = connection.model('Feedback', Feedback);
