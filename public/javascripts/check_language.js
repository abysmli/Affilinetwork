if (typeof(Storage) !== "undefined") {
    if (localStorage.region == "de") {
        if (window.location.pathname.substr(0, 3) !== '/de') {
            window.location.replace("/de");
        }
    } else if (localStorage.region == "cn") {
        if (window.location.pathname.substr(0, 3) === '/de') {
            window.location.replace("/");
        }
    } else {
        if (window.location.pathname.substr(0, 3) !== '/de') {
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
        window.location.replace("/de");
    });

    $("body").on("click", ".cn_button", function() {
        localStorage.region = "cn";
        window.location.replace("/");
    });

});
