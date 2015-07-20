var request = require("request");
request.get({
        url: "http://localhost:3000/my-api-controller",
        qs: {
            url: url
        }
    },
    function (error, response, body) {
        console.log(body);
    });


request('http://www.google.com', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body) // Show the HTML for the Google homepage.
    }
})
