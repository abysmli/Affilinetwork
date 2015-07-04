var mongoose = require('mongoose');
var setting = require('../setting.js');

mongoose.connect('mongodb://localhost/'+setting.database);

var FoodSchema = new mongoose.Schema({
	ProgramId: Number,
	ProgramTitle: String,
	ProgramDescription: String,
	PartnershipStatus: String,
	ProgramClassificationEnum: String,
	LimitationsComment: String,
	LaunchDate: { type: Date, default: Date.now },
	ProgramURL: String,
	LogoURL: String,
	TrackingMethod: String,
	CookieLifetime: Number,
	SEMPolicyEnum: String,
	ProgramStatusEnum: String,
	ScreenshotURL: String,
	updated_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Food', FoodSchema);