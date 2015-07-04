var mongoose = require('mongoose');
var setting = require('../setting.js');
var autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.createConnection('mongodb://localhost/'+setting.database);
autoIncrement.initialize(connection);

var OrderSchema = new mongoose.Schema({
	order_no: Number,
	name: String,
	pickup_date: String,
	amount: Number,
	pickup_status: Boolean,
	device_info: String,
	ip: String,
	phone_number: String,
	updated_at: { type: Date, default: Date.now },
});

OrderSchema.plugin(autoIncrement.plugin, {
    model: 'Order',
    field: 'order_no'
});

module.exports = connection.model('Order', OrderSchema);