"strict mode";
const util = require('util');
const soap = require('soap');
const setting = require('../../setting');
const WSDL_LOGON = 'https://api.affili.net/V2.0/Logon.svc?wsdl';
const WSDL_AccountService = "https://api.affili.net/V2.0/AccountService.svc?wsdl";
const WSDL_PublisherStatistics = 'https://api.affili.net/V2.0/PublisherStatistics.svc?wsdl';
const WSDL_ProgramList = 'https://api.affili.net/V2.0/PublisherProgram.svc?wsdl';
const WSDL_CreativeService = 'https://api.affili.net/V2.0/PublisherCreative.svc?wsdl';
const WSDL_InboxService = 'https://api.affili.net/V2.0/PublisherInbox.svc?wsdl';

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
            return true;
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
                'EndDate': params.EndDate || new Date("2017-09-17").toISOString(),
                'StartDate': params.StartDate || new Date("2013-01-01").toISOString(),
                'SubId': params.SubId || '',
                'TransactionStatus': 'All'
            }
        };
        this.client.GetTransactions(data, (err, transactions) => {
            if (err) throw err;
            callback(transactions);
        });
    }
    GetDailyStatistics(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'GetDailyStatisticsRequestMessage': {
                'StartDate': params.StartDate || new Date("2017-01-01").toISOString(),
                'EndDate': params.EndDate || new Date("2017-10-21").toISOString(),
                'SubId': params.SubId || '',
                'ProgramTypes': 'All',
                'ValuationType': 'DateOfRegistration',
                'ProgramId': params.ProgramId || 0,
            }
        };
        this.client.GetDailyStatistics(data, (err, dailyStatistics) => {
            if (err) throw err;
            callback(dailyStatistics);
        });
    }
    GetSubIDStatistics(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'GetSubIdStatisticsRequestMessage': {
                'StartDate': params.StartDate || new Date("2017-01-01").toISOString(),
                'EndDate': params.EndDate || new Date("2017-09-18").toISOString(),
                'SubId': params.SubId || '',
                'ProgramTypes': 'All',
                'ValuationType': 'DateOfRegistration',
                'TransactionStatus': 'All',
                'MaximumRecords': '100',
                'ProgramIds': params.ProgramIds || [1632],
            }
        };
        this.client.GetSubIDStatistics(data, (err, subIdStatistics) => {
            if (err) throw err;
            callback(subIdStatistics);
        });
    }
}

class ProgramList {
    constructor(auth, client) {
        this.auth = auth;
        this.client = client;
    }
    GetPrograms(params, token, callback) {
        let PartnershipStatus = ['Active'];
        let data = {
            'CredentialToken': token,
            'DisplaySettings': {
                'CurrentPage': 1,
                'PageSize': 100,
            },
            'GetProgramsQuery': {
                'PartnershipStatus': {
                    'ProgramPartnershipStatusEnum': PartnershipStatus
                }
            }
        };
        // console.log(util.inspect(this.client.describe().PublisherProgram.PublisherProgramEndpoint.GetPrograms, {showHidden: false, depth: null}));
        this.client.GetPrograms(data, (err, programs) => {
            if (err) throw err;
            callback(programs);
        });
    }
    GetProgramRates(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'ProgramId': params.ProgramId || 9069,
            'PublisherId ': parseInt(this.auth.publisherId)
        };
        // console.log(util.inspect(this.client.describe().PublisherProgram.PublisherProgramEndpoint.GetProgramRates, {showHidden: false, depth: null}));
        this.client.GetProgramRates(data, (err, rates) => {
            if (err) throw err;
            callback(rates);
        });
    }
    GetProgramCategories(token, callback) {
        // console.log(util.inspect(this.client.describe().PublisherProgram.PublisherProgramEndpoint.GetProgramCategories, {showHidden: false, depth: null}));
        this.client.GetProgramCategories(token, (err, rates) => {
            if (err) throw err;
            callback(rates);
        });
    }
}

class CreativeService {
    constructor(auth, client) {
        this.auth = auth;
        this.client = client;
    }
    GetCreativeCategories(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'ProgramId': params.ProgramId || 9069
        };
        // console.log(util.inspect(this.client.describe().PublisherProgram.PublisherProgramEndpoint.GetPrograms, {showHidden: false, depth: null}));
        this.client.GetCreativeCategories(data, (err, create_categories) => {
            if (err) throw err;
            callback(create_categories);
        });
    }
    SearchCreatives(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'DisplaySettings': {
                'CurrentPage': params.CurrentPage || 1,
                'PageSize': 100
            },
            'SearchCreativesQuery': {
                'ProgramIds': {
                    'int': params.ProgramIds || [9069]
                }
            }
        };
        // console.log(util.inspect(this.client.describe(), {showHidden: false, depth: null}));
        this.client.SearchCreatives(data, (err, rates) => {
            if (err) throw err;
            callback(rates);
        });
    }
}

class InboxService {
    constructor(auth, client) {
        this.auth = auth;
        this.client = client;
    }
    SearchVoucherCodes(params, token, callback) {
        let data = {
            'CredentialToken': token,
            'DisplaySettings': {
                'CurrentPage': 1,
                'PageSize': 1000
            },
            'SearchVoucherCodesRequestMessage': {
                'ProgramPartnershipStatus': 'Accepted',
                'VoucherType': 'AllProducts',
                'ProgramId': params.ProgramId || ""
            }
        };
        // console.log(util.inspect(this.client.describe(), {showHidden: false, depth: null}));
        this.client.SearchVoucherCodes(data, (err, voucher_codes) => {
            if (err) throw err;
            callback(voucher_codes);
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
        soap.createClient(WSDL_ProgramList, (err, client) => {
            this.program_client = client;
            this.ProgramList = new ProgramList(this.auth, this.program_client);
            console.log("Affilinet Program List Service Init Successful!");
        });
        soap.createClient(WSDL_CreativeService, (err, client) => {
            this.creativ_client = client;
            this.CreativeService = new CreativeService(this.auth, this.creativ_client);
            console.log("Affilinet Creative Service Init Successful!");
        });
        soap.createClient(WSDL_InboxService, (err, client) => {
            this.inbox_client = client;
            this.InboxService = new InboxService(this.auth, this.inbox_client);
            console.log("Affilinet Inbox Service Init Successful!");
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
        this.getToken((token) => {
            this.PublisherStatistics.GetTransactions(params, token, callback);
        });
    }

    GetDailyStatistics(params, callback) {
        this.getToken((token) => {
            this.PublisherStatistics.GetDailyStatistics(params, token, callback);
        });
    }

    GetSubIDStatistics(params, callback) {
        this.getToken((token) => {
            this.PublisherStatistics.GetSubIDStatistics(params, token, callback);
        });
    }

    GetPrograms(params, callback) {
        this.getToken((token) => {
            this.ProgramList.GetPrograms(params, token, callback);
        });
    }

    GetProgramCategories(callback) {
        this.getToken((token) => {
            this.ProgramList.GetProgramCategories(token, callback);
        });
    }

    GetProgramRates(params, callback) {
        this.getToken((token) => {
            this.ProgramList.GetProgramRates(params, token, callback);
        });
    }
    GetCreativeCategories(params, callback) {
        this.getToken((token) => {
            this.CreativeService.GetCreativeCategories(params, token, callback);
        });
    }
    SearchCreatives(params, callback) {
        this.getToken((token) => {
            this.CreativeService.SearchCreatives(params, token, callback);
        });
    }
    SearchVoucherCodes(params, callback) {
        this.getToken((token) => {
            this.InboxService.SearchVoucherCodes(params, token, callback);
        });
    }
}

const AffilinetSOAP = new AffilinetPublisher({
    publisherId: setting.affilinet_setting.publisherId,
    productWebservicePassword: setting.affilinet_setting.productWebservicePassword,
    publisherWebservicePassword: setting.affilinet_setting.publisherWebservicePassword
});

module.exports = AffilinetSOAP;