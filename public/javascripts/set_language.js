$(document).ready(function() {
    if (typeof(Storage) !== "undefined") {
        if (!localStorage.region) {
            $('#regionModal').modal('show');
        }
    } else {
        console.log("Sorry! No Web Storage support..");
    }
    $(".de_button").click(function(){
    	localStorage.region = "de";
    	window.location.replace("/DE");
    });
    $(".cn_button").click(function(){
    	localStorage.region = "cn";
    	window.location.replace("/");
    });
});
