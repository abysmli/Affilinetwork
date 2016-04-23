if (typeof(Storage) !== "undefined") {
    if (localStorage.region == "de") {
        if (window.location.pathname.substr(0, 3) !== '/de') {
            window.location.replace("/de" + window.location.pathname);
        }
    } else if (localStorage.region == "cn") {
        if (window.location.pathname.substr(0, 3) === '/de') {
            window.location.replace("/" + window.location.pathname);
        }
    } else {
        if (window.location.pathname.substr(0, 3) !== '/de' && ( window.location.pathname.length == 1 || window.location.pathname.length == 0)) {
            window.location.replace("/de");
        }
        $(window).load(function() {
            $('#regionModal').modal('show');
        });
    }
} else {
    console.log("Sorry! No Web Storage support..");
}

$(document).ready(function() {
    $("body").on("click", ".de_button", function() {
        localStorage.region = "de";
        if (window.location.pathname.substr(0, 3) !== '/de') {
            window.location.replace("/de" + window.location.pathname + window.location.search);
        } else {
            location.reload();
        }
    });

    $("body").on("click", ".cn_button", function() {
        localStorage.region = "cn";
        if (window.location.pathname.substr(0, 3) !== '/de') {
            location.reload();
        } else {
            var href = window.location.pathname.substr(3) + window.location.search;
            if (href.length == 0) {
                href = '/';
            }
            window.location.replace(href);
        }
    });
});
