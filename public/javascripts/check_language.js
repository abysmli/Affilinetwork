if (typeof(Storage) !== "undefined") {
    if (localStorage.region == "de") {
        if(window.location.pathname.substr(0,3) !== '/DE') {
        	window.location.replace("/DE");
        }
    } else if (localStorage.region == "cn") {
    	if(window.location.pathname.substr(0,3) === '/DE') {
    		window.location.replace("/");
        }
    }
} else {
    console.log("Sorry! No Web Storage support..");
}
