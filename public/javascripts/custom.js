/* Theme Name:iDea - Clean & Powerful Bootstrap Theme
 * Author:HtmlCoder
 * Author URI:http://www.htmlcoder.me
 * Author e-mail:htmlcoder.me@gmail.com
 * Version: 1.2.1
 * Created:October 2014
 * License URI:http://support.wrapbootstrap.com/
 * File Description: Place here your custom scripts
 */

function sendAjax(url, data, success, error) {
	$.ajax({
		url: url,
		type: 'POST',
		timeout: 20000,
		dataType: 'json',
		data: data,
		success: success,
		error: error,
	});
}

function Notify(type, msg) {
	Lobibox.notify(type, {
		size: 'normal',
		position: 'top right',
		msg: msg
	});
}