"use strict";
/* global dw empty */

exports.ApiClient = void 0;
/**
 * API Client that is passed on to the VRPayment SDK service classes
 */
var ApiClient = /** @class */ (function () {
    function ApiClient() {
    }
    ApiClient.prototype.getHTTPClientFromService = function () {
        var httpService = function (serviceName) {
            return dw.svc.LocalServiceRegistry.createService(serviceName, {
                createRequest: function (httpService, localVarRequestOptions) {
                    return httpService;
                },
                parseResponse: function (svc, response) {
                    return response;
                },
                getRequestLogMessage: function (requestObj) {
                    return requestObj;
                }
            });
        };
        var service = httpService('int_vrpayment.http.rest.payment.vrpayment');
        service.call();
        return service.client;
    };
    /**
     * Make API web calls
     * @param localVarRequestOptions
     */
    ApiClient.prototype.callApi = function (localVarRequestOptions) {
        var httpClient = this.getHTTPClientFromService();
        var contentType = localVarRequestOptions.contentType;
        var url = localVarRequestOptions.url + localVarRequestOptions.path;
        var methodType = localVarRequestOptions.method.toUpperCase();
        var queryString = (Object.keys(localVarRequestOptions.queryString).length !== 0) ? localVarRequestOptions.queryString : {};
        if (empty(contentType)) {
            contentType = "application/json";
        }
        if (Object.keys(queryString).length !== 0) {
            url += "?" + Object.keys(queryString).map(function (key) {
                return encodeURIComponent(key) + "=" + encodeURIComponent(queryString[key]);
            }).join("&");
        }
        var auth = new (require("~/cartridge/scripts/vrpayment/auth/Auth"));
        var headers = auth.getHeaders(methodType, localVarRequestOptions.path, queryString);
        for (var headerKey in headers) {
            if (headers.hasOwnProperty(headerKey)) {
                // @ts-ignore
                httpClient.setRequestHeader(headerKey, headers[headerKey]);
            }
        }
        httpClient.setRequestHeader("Content-Type", contentType);
        httpClient.open(methodType, url);
        if (!empty(localVarRequestOptions.body)) {
            httpClient.send(localVarRequestOptions.body);
        }
        else {
            httpClient.send();
        }
        return httpClient;
    };
    return ApiClient;
}());
exports.ApiClient = ApiClient;
module.exports = ApiClient;
