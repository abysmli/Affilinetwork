"use strict";
const _ = require('lodash');
const util = require('util');
const utils = require('./utils/utils');
const Utils = new utils();
// const AWS = require('./utils/requester/AWSProductAPI');
// const AffSOAP = require('./utils/requester/AffilinetAPI.SOAP');
// var Awin = require('affiliate-window').default;

// var AW = new Awin({
//     oAuthToken: '553b6b3d-048f-434c-a729-1fbfa2759120'
// });

const Zanox = require('./utils/requester/ZanoxAPI');

(() => {
    // AWS.getProductByEAN("abcdedffff", (product) => {
    //     console.log(util.inspect(product, false, null));
    // });
    // AffSOAP.GetDailyStatistics({}, (result)=>{
    //     console.log(result);
    // });
    // AW.getAccounts().then(function (accounts) {
    //     console.log(accounts);
    //     AW.getProgrammes({ account: "443087", relationship: "" }).then(function (programmes) {
    //         console.log(programmes);
    //     });
    // });
    // Zanox.programs({}, (err, response, results) => {
    //     console.log(util.inspect(results, false, null));
    //     console.log(results);
    // });
    Utils.GoogleTranslate("Du bist gut!", (err, translated)=>{
        console.log(translated);
        process.exit();
    });
})();