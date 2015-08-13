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

    // ######################### Statistik Webservice #########################
    /*_Class.prototype.getTransactions = function getTransactions(params, callback) {
        params.publisherId = this.auth.publisherId;
        params.Password = this.auth.publisherWebservicePassword;
        requestHandler("http://publisher-webservices.affili.net/Publisher/Statistik.asmx/GetTransactions", params, callback);
    }*/



    return _Class;
})();
