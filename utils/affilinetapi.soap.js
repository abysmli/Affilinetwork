"strict mode";
const soap = require('soap');
const WSDL_LOGON = 'https://api.affili.net/V2.0/Logon.svc?wsdl';
const WSDL_AccountService = "https://api.affili.net/V2.0/AccountService.svc?wsdl";
const WSDL_PublisherStatistics = 'https://api.affili.net/V2.0/PublisherStatistics.svc?wsdl';

class Logon {
    constructor(auth, client) {
        this.auth = auth;
        this.session = {};
        this.client = client;
    }
    getToken(callback) {
        if (!(this.session.token) || this.tokenHasExpired()) {
            this.createToken((token) => {
                this.getTokenExpirationDate((expiration_date) => { });
                callback(this.session.token);
            });
        } else {
            callback(this.session.token);
        }
    }
    tokenHasExpired() {
        if (!this.session.expiration_date) {
            return ture;
        }
        return (new Date() > this.session.expiration_date)
    }
    createToken(callback) {
        var logonBody = {
            'q2:Username': this.auth.publisherId,
            'q2:Password': this.auth.publisherWebservicePassword,
            'q2:WebServiceType': this.auth.WebServiceType
        }
        this.client.Logon(logonBody, (err, token) => {
            if (err) throw err;
            this.session.token = token;
            callback(token);
        });
    }
    getTokenExpirationDate(callback) {
        this.client.GetIdentifierExpiration(this.session.token, (err, expiration_date) => {
            if (err) throw err;
            this.session.expiration_date = expiration_date;
            callback(expiration_date);
        })
    }
}

class AccountService {
    constructor(auth, client) {
        this.auth = auth;
        this.client = client;
    }
    GetLinkedAccounts(credential, callback) {
        this.client.GetLinkedAccounts(credential, (err, account) => {
            if (err) throw err;
            callback(account);
        });
    }
    GetPayments(params, credential, callback) {
        this.client.GetPayments({
            'CredentialToken': credential.CredentialToken,
            'EndDate': params.EndDate,
            'PublisherId': credential.PublisherId,
            'StartDate': params.StartDate,
        }, (err, payments) => {
            if (err) throw err;
            callback(payments);
        });
    }
    GetPublisherSummary(token, callback) {
        this.client.GetPublisherSummary(token, (err, summary) => {
            if (err) throw err;
            callback(summary);
        });
    }
}

class PublisherStatistics {
    constructor(auth, client) {
        this.auth = auth;
        this.client = client;
    }
    GetTransactions(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'PageSettings': {
                'CurrentPage': 1,
                'PageSize': 100,
            },
            'TransactionQuery': {
                'EndDate': new Date("2017-09-17").toISOString(),
                'StartDate': new Date("2013-01-01").toISOString(),
                'SubId': 'e3016002-f1c1-47e1-b0e4-3770415e2797',
                'TransactionStatus': 'All'
            }
        };
        this.client.GetTransactions(data, (err, transactions) => {
            if (err) throw err;
            callback(transactions);
        });
    }
    GetLinkedAccounts(credential, callback) {
        this.client.GetLinkedAccounts(credential, (err, account) => {
            if (err) throw err;
            callback(account);
        });
    }
    GetPublisherSummary(token, callback) {
        this.client.GetPublisherSummary(token, (err, summary) => {
            if (err) throw err;
            callback(summary);
        });
    }
}

class AffilinetPublisher {
    constructor(auth) {
        this.auth = auth;
        this.auth.WebServiceType = "Publisher";
        soap.createClient(WSDL_LOGON, (err, client) => {
            this.logon_client = client;
            this.Logon = new Logon(this.auth, this.logon_client);
            console.log("Affilinet Publisher Logon Service Init Successful!");
        });
        soap.createClient(WSDL_AccountService, (err, client) => {
            this.account_client = client;
            this.AccountService = new AccountService(this.auth, this.account_client);
            console.log("Affilinet Publisher Account Service Init Successful!");
        });
        soap.createClient(WSDL_PublisherStatistics, (err, client) => {
            this.statistics_client = client;
            this.PublisherStatistics = new PublisherStatistics(this.auth, this.statistics_client);
            console.log("Affilinet Publisher Statistics Service Init Successful!");
        });
    }

    getToken(callback) {
        this.Logon.getToken(callback);
    }

    getCredential(callback) {
        this.getToken((token) => {
            callback({
                'CredentialToken': token,
                'PublisherId': this.auth.publisherId
            });
        });
    }

    GetLinkedAccounts(callback) {
        this.getCredential((credential) => {
            this.AccountService.GetLinkedAccounts(credential, callback);
        });
    }

    GetPublisherSummary(callback) {
        this.getToken((token) => {
            this.AccountService.GetPublisherSummary(token, callback);
        });
    }

    GetPayments(params, callback) {
        var params = {
            'StartDate': params.StartDate || new Date("2013-01-01").toISOString(),
            'EndDate': params.EndDate || new Date().toISOString()
        }
        this.getCredential((credential) => {
            this.AccountService.GetPayments(params, credential, callback);
        });
    }

    GetTransactions(params, callback) {
        var params = {
            'PageSettings': {
                'CurrentPage': 1,
                'PageSize': 100,
            },
            'TransactionQuery': {
                'StartDate': params.StartDate || new Date("2013-01-01").toISOString(),
                'EndDate': params.EndDate || new Date("2017-09-17").toISOString(),
                'TransactionStatus': 'All'
            }
        }
        this.getToken((token) => {
            this.PublisherStatistics.GetTransactions(params, token, callback);
        });
    }

}

module.exports = AffilinetPublisher;