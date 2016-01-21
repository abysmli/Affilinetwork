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

function previewFile(input_id, preview_id) {
    var files = document.querySelector(input_id).files;
    if (files && files[0]) {
        var FR = new FileReader();
        FR.onload = function(e) {
            $(preview_id).html('<img src="' + e.target.result + '">');
            $(preview_id).fadeIn();
            _image = e.target.result;
        };
        FR.readAsDataURL(files[0]);
    }
}

function post(params, form_id) {
    // The rest of this code assumes you are not using a library.
    // It can be made less wordy if you use one.
    var form = document.getElementById(form_id);

    for (var key in params) {
        if (params.hasOwnProperty(key)) {
            var hiddenField = document.createElement("input");
            hiddenField.setAttribute("type", "hidden");
            hiddenField.setAttribute("name", key);
            hiddenField.setAttribute("value", params[key]);
            form.appendChild(hiddenField);
        }
    }
    form.submit();
}

function getURL() {
    var paginationHref = "";
    if (window.location.search == "") {
        paginationHref = "?page=";
    } else if (window.location.search.substr(0,5) == "?page") {
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
