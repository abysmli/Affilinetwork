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

function getURL() {
    var paginationHref = "";
    if (window.location.search == "") {
        paginationHref = "?page=";
    } else if (window.location.search.substr(0, 5) == "?page") {
        paginationHref = "?page=";
    } else {
        var paginationHrefArray = window.location.search.split("&");
        if (paginationHrefArray[paginationHrefArray.length - 1].substr(0, 4) == "page") {
            for (var i = 0; i < paginationHrefArray.length - 1; i++) {
                paginationHref += paginationHrefArray[i] + "&";
            }
        } else {
            for (var i = 0; i < paginationHrefArray.length; i++) {
                paginationHref += paginationHrefArray[i] + "&";
            }
        }
        paginationHref += "page=";
    }
    return paginationHref;
}

function copyToClipboard(string) {
    var $temp = $("<input>");
    $("body").append($temp);
    $temp.val(string).select();
    document.execCommand("copy");
    $temp.remove();
}

function getCurrencyExchange(cb) {
    $.get("currencyExchange", cb);
}