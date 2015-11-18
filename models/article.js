var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var ArticleSchema = new mongoose.Schema({
	Title: String,
    Content: String,
    Content_pre: String,
    Image: String,
	updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', ArticleSchema);