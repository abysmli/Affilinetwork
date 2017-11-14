var request = require("request");

function requestHandler(url, params, callback) {
    request({
        url: url,
        qs: params,
        encoding: 'utf8',
        json: true
    }, callback);
}


module.exports = (function () {
    function _Class(auth) {
        this.auth = auth;
    }

    // ######################### Product Webservice #########################
    _Class.prototype.getShopList = function getShopList(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.productWebservicePassword;
        params.LogoScale = params.LogoScale || "Logo120";
        params.CurrentPage = params.CurrentPage || 1;
        params.PageSize = params.PageSize || 5000;
        params.Query = params.Query || "";
        params.UpdatedAfter = params.UpdatedAfter || "";
        requestHandler("http://product-api.affili.net/V3/productservice.svc/JSON/GetShopList", params, callback);
    }

    _Class.prototype.getCategoryList = function getCategoryList(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.productWebservicePassword;
        params.ShopId = params.ShopId || 0;
        params.CurrentPage = params.CurrentPage || 1;
        params.PageSize = params.PageSize || 5000;
        requestHandler("http://product-api.affili.net/V3/productservice.svc/JSON/GetCategoryList", params, callback);
    }

    _Class.prototype.searchProducts = function searchProducts(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.productWebservicePassword;
        params.ShopIds = params.ShopIds || 0;
        params.ShopIdMode = params.ShopIdMode || "Exclude";
        params.Query = params.Query || "";
        params.CategoryIds = params.CategoryIds || "";
        params.UseAffilinetCategories = params.UseAffilinetCategories || "true";
        params.ExcludeSubCategories = params.ExcludeSubCategories || "true";
        params.WithImageOnly = params.WithImageOnly || "false";
        params.ImageScales = params.ImageScales || "Image90,Image120,Image180,OriginalImage";
        params.LogoScales = params.LogoScales || "Logo90,Logo120,Logo150,Logo468";
        params.CurrentPage = params.CurrentPage || 1;
        params.PageSize = params.PageSize || 500;
        params.MinimumPrice = params.MinimumPrice || "";
        params.MaximumPrice = params.MaximumPrice || "";
        params.SortBy = params.SortBy || "Score"; //Score, Price, ProductName, LastImported
        params.SortOrder = params.SortOrder || "descending";
        params.FacetFields = params.FacetFields || "";
        params.FacetValueLimit = params.FacetValueLimit || "";
        params.FQ = params.FQ || "";
        requestHandler("http://product-api.affili.net/V3/productservice.svc/JSON/SearchProducts", params, callback);
    }

    _Class.prototype.getProducts = function getProducts(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.productWebservicePassword;
        params.ProductIds = params.ProductIds || 0; //string array less than 50 elements
        params.ImageScales = params.ImageScales || "Image30,Image60,Image90,Image120,Image180,OriginalImage";
        params.LogoScales = params.LogoScales || "Logo50,Logo90,Logo120,Logo150,Logo468";
        requestHandler("http://product-api.affili.net/V3/productservice.svc/JSON/GetProducts", params, callback);
    }

    _Class.prototype.getPropertyList = function getPropertyList(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.productWebservicePassword;
        params.ShopId = params.ShopId || "698";
        requestHandler("http://product-api.affili.net/V3/productservice.svc/JSON/GetPropertyList", params, callback);
    }

    // ######################### Account Webservice #########################
    _Class.prototype.getLinkedAccounts = function getLinkedAccounts(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Account.asmx/GetLinkedAccounts", params, callback);
    }

    _Class.prototype.getPublisherSummary = function getPublisherSummary(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Account.asmx/GetPublisherSummary", params, callback);
    }

    _Class.prototype.getPayments = function getPayments(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Account.asmx/GetPayments", params, callback);
    }

    // ######################### Creative Webservice #########################
    _Class.prototype.getCreativeCategories = function getCreativeCategories(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/PublisherCreative.asmx/GetCreativeCategories", params, callback);
    }

    _Class.prototype.searchCreatives = function searchCreatives(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/PublisherCreative.asmx/SearchCreatives", params, callback);
    }

    // ######################### ProgramList Webservice #########################
    _Class.prototype.getProgramCategories = function getProgramCategories(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetProgramCategories", params, callback);
    }

    _Class.prototype.getAllPrograms = function getAllPrograms(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        params.Query = params.Query || "";
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetAllPrograms", params, callback);
    }

    _Class.prototype.searchAllPrograms = function searchAllPrograms(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/SearchAllPrograms", params, callback);
    }

    _Class.prototype.getMyPrograms = function getMyPrograms(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        params.SearchToken = params.SearchToken || "";
        params.PageSize = params.PageSize || 1000;
        params.CurrentPage = params.CurrentPage || 1;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetMyPrograms", params, callback);
    }

    _Class.prototype.searchMyPrograms = function searchMyPrograms(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/SearchPrograms", params, callback);
    }

    _Class.prototype.getNewPrograms = function getNewPrograms(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetNewPrograms", params, callback);
    }

    _Class.prototype.getProgramRates = function getProgramRates(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetProgramRates", params, callback);
    }

    _Class.prototype.getProgramListByCategory = function getProgramListByCategory(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetProgramListByCategory", params, callback);
    }

    _Class.prototype.getPrograms = function getPrograms(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/ProgramList.asmx/GetPrograms", params, callback);
    }

    // ######################### Statistik Webservice #########################
    _Class.prototype.getDailyStatistics = function getDailyStatistics(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetDailyStatistics", params, callback);
    }

    _Class.prototype.getProgramStatistics = function getProgramStatistics(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetProgramStatistics", params, callback);
    }

    _Class.prototype.getPublisherStatisticsPerClick = function getPublisherStatisticsPerClick(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetPublisherStatisticsPerClick", params, callback);
    }

    _Class.prototype.getPublisherClicksSummary = function getPublisherClicksSummary(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetPublisherClicksSummary", params, callback);
    }

    _Class.prototype.getStatisticsPerProgram = function getStatisticsPerProgram(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetStatisticsPerProgram", params, callback);
    }

    _Class.prototype.getSubIdStatistics = function getSubIdStatistics(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetSubIdStatistics", params, callback);
    }

    _Class.prototype.getClicksBySubIdPerDay = function getClicksBySubIdPerDay(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetClicksBySubIdPerDay", params, callback);
    }

    _Class.prototype.getTransactions = function getTransactions(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        params.StartDate = params.StartDate || new Date("2016-01-01");
        params.EndDate = params.EndDate || new Date();
        /*  This parameter defines the event on which
            StartDate and EndDate shall operate. Possible
            values are:
             DateOfRegistration: this is when the transaction
            has been created in our system.
             DateOfConfirmation: this is the date when the
            transaction has last been edited by the
            advertiser. So if you want to know what
            changed on your transactions yesterday, send
            a request, where you set StartDate and
            EndDate to the previous day and ValuationType
            to DateOfConfirmation. Then you get all
            transactions, which have been confirmed or
            cancelled, got an adjusted NetPrice etc...
            yesterday.
            If not specified, “DateOfRegistration” is assumed. */
        params.ValuationDateType = params.ValuationDateType || 0;
        params.TransactionStatus = params.TransactionStatus || 3;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistics.asmx/GetTransactions", params, callback);
    }

    // ######################### Voucher Webservice #########################
    _Class.prototype.getVoucherCodes = function getVoucherCodes(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        params.Query = params.Query || "";
        params.VoucherCode = params.VoucherCode || null;
        params.StartDate = params.StartDate || new Date();
        params.EndDate = params.EndDate || new Date();
        requestHandler("http://publisher-webservices.affili.net/Publisher/Inbox.asmx/GetVoucherCodes", params, callback);
    }

    _Class.prototype.searchVoucherCodes = function searchVoucherCodes(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        params.Query = params.Query || "";
        params.VoucherCode = params.VoucherCode || null;
        params.VoucherCodeContent = params.VoucherCodeContent || 0;
        params.VoucherType = params.VoucherType || 0;
        params.StartDate = params.StartDate || new Date();
        params.EndDate = params.EndDate || new Date();
        params.PartnershipStatus = params.PartnershipStatus || 0;
        params.MinimumOrderValue = params.MinimumOrderValue || 0;
        params.CustomerRestriction = params.CustomerRestriction || 0;
        params.ExclusivesOnly = params.ExclusivesOnly || true;
        params.CurrentPage = params.CurrentPage || 1;
        params.PageSize = params.PageSize || 1000;
        params.OrderBy = params.OrderBy || 0;
        params.SortDesc = params.SortDesc || false;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Inbox.asmx/SearchVoucherCodes", params, callback);
    }
    return _Class;
})();