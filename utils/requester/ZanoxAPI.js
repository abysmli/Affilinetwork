const request = require("request");
const setting = require('../../setting');

function requestHandler(data, callback) {
    request({
        url: data.url,
        qs: data.params,
        encoding: 'utf8',
        json: true
    }, callback);
}

class ZanoxAPI {
    constructor(auth) {
        this.auth = auth;
    }

    profiles(params, callback) {
        params.LogoScale = params.LogoScale || "Logo120";
        params.CurrentPage = params.CurrentPage || 1;
        params.PageSize = params.PageSize || 5000;
        params.Query = params.Query || "";
        params.UpdatedAfter = params.UpdatedAfter || "";
        let data = {
            url: `https://api.zanox.com/json/2011-03-01/profiles?connectid=${ this.auth.ConnectID }&date=Fri,%2030%20Aug%202013%2008:43:48%20GMT&nonce=7DA41D378ED70D1FF92D10940800F084&signature=eHvyXV5p3r10ZoQG7Q9Wzey1kbE=`,
            params: params
        }
        requestHandler(data, callback);
    }

    programs(params, callback) {
        let data = {
            url: `http://api.zanox.com/json/2011-03-01/programs`,
            params: {
                partnership: "DIRECT",
                region: "DE",
                connectid: this.auth.ConnectID
            }
        }
        requestHandler(data, callback);
    }

    program(params, callback) {
        let data = {
            url: `http://api.zanox.com/json/2011-03-01/programs/program/${params.id}`,
            params: {
                connectid: this.auth.ConnectID
            }
        }
        requestHandler(data, callback);
    }

    programapplications(params, callback) {
        let data = {
            url: `http://api.zanox.com/json/2011-03-01/programapplications`,
            params: {
                connectid: this.auth.ConnectID
            }
        }
        requestHandler(data, callback);
    }
}

const zanoxAPI = new ZanoxAPI({
    ConnectID: setting.zanox_setting.ConnectID,
    SecretKey: setting.zanox_setting.SecretKey
});

module.exports = zanoxAPI;