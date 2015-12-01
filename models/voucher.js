var mongoose = require('mongoose');
var setting = require('../setting.js');
mongoose.createConnection('mongodb://localhost/'+setting.database);

var Voucherschema = new mongoose.Schema({
	Id: String,
    ProgramId: String,
    Program: String,
    Code: String,
    Description: String,
    IntegrationCode: String,
    DescriptionCN: String,
    IntegrationCodeCN: String,
    ActivePartnership: String,
    IsRestricted: String,
    Image: String,
    StartDate: { type: Date, default: Date.now },
    EndDate: { type: Date, default: Date.now },
    Tranlated: { type: Boolean, default: false },
	updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Voucher', Voucherschema);