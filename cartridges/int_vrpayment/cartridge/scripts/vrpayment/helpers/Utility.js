"use strict";
/* global dw empty */

exports.Utility = void 0;
/**
 * Class Utility
 */
var Utility = /** @class */ (function () {
    /**
     * Utility class
     *
     * @constructor
     */
    function Utility() {
        /**
         * Service name
         */
        this.serviceName = "int_vrpayment.http.rest.payment.vrpayment";
    }
    /**
     * Get service name
     *
     * @returns {string} Service name
     */
    Utility.prototype.getServiceName = function () {
        return this.serviceName;
    };
    /**
     * Get service
     * @deprecated
     * @returns {*} Service
     */
    Utility.prototype.getService = function () {
        return dw.svc.LocalServiceRegistry.createService(this.getServiceName(), this.getServiceConfig());
    };
    /**
     * Get configs
     * @return {*} preferences
     */
    Utility.prototype.getConfigs = function () {
        return require("~/cartridge/config/vrpayment/preferences");
    };
    /**
     * CreatePaymentInstrument
     *
     * @param { dw.order.Basket | dw.order.LineItemCtnr } basket - Basket
     * @param { string } paymentType - Name of the payment method.
     * @returns { Object } Payment instrument
     */
    Utility.prototype.createPaymentInstrument = function (basket, paymentType) {
        if (!basket) {
            return null;
        }
        var paymentInstrument;
        var iter = basket.getPaymentInstruments(paymentType).iterator();
        dw.system.Transaction.wrap(function () {
            while (iter.hasNext()) {
                var existingPI = iter.next();
                basket.removePaymentInstrument(existingPI);
            }
        });
        var amount = this.calculateNonGiftCertificateAmount(basket);
        dw.system.Transaction.wrap(function () {
            paymentInstrument = basket.createPaymentInstrument(paymentType, amount);
        });
        // @ts-ignore
        return paymentInstrument;
    };
    /**
     * Calculates the amount to be payed by a non-gift certificate payment instrument based
     * on the given basket. The method subtracts the amount of all redeemed gift certificates
     * from the order total and returns this value.
     *
     * @param { dw.order.LineItemCtnr } lineItemCtnr - LineIteam Container (Basket or Order)
     * @returns { dw.value.Money } non gift certificate amount
     */
    Utility.prototype.calculateNonGiftCertificateAmount = function (lineItemCtnr) {
        var giftCertificateTotal = new dw.value.Money(0.0, lineItemCtnr.currencyCode);
        var giftCertificatePaymentInstruments = lineItemCtnr.getGiftCertificatePaymentInstruments();
        var iterator = giftCertificatePaymentInstruments.iterator();
        var orderPI;
        while (iterator.hasNext()) {
            orderPI = iterator.next();
            giftCertificateTotal = giftCertificateTotal.add(orderPI.getPaymentTransaction().getAmount());
        }
        var orderTotal = lineItemCtnr.totalGrossPrice;
        return orderTotal.subtract(giftCertificateTotal);
    };
    /**
     * @deprecated
     * @return {ServiceCallback} HTTP Service callback
     */
    Utility.prototype.getServiceConfig = function () {
        return {
            /**
             * @param {dw.svc.HTTPService} service - Service, which will be used for the call
             * @param {{}} localVarRequestOptions - Content type
             * @returns {string} String for request
             */
            createRequest: function (service, localVarRequestOptions) {
                var url = localVarRequestOptions.url + localVarRequestOptions.path;
                var contentType = localVarRequestOptions.contentType;
                var methodType = localVarRequestOptions.method.toUpperCase();
                var queryString = (Object.keys(localVarRequestOptions.queryString).length !== 0) ? localVarRequestOptions.queryString : {};
                if (empty(contentType)) {
                    contentType = "application/json";
                }
                service.setRequestMethod(methodType);
                service.addHeader("Content-Type", contentType);
                service.setURL(url);
                var auth = new (require("~/cartridge/scripts/vrpayment/auth/Auth"));
                var headers = auth.getHeaders(methodType, localVarRequestOptions.path, queryString);
                for (var headerKey in headers) {
                    if (headers.hasOwnProperty(headerKey)) {
                        service.addHeader(headerKey, headers[headerKey]);
                    }
                }
                if (Object.keys(queryString).length !== 0) {
                    for (var queryStringKey in queryString) {
                        if (queryString.hasOwnProperty(queryStringKey)) {
                            service.addParam(queryStringKey, headers[queryStringKey]);
                        }
                    }
                }
                if (contentType === "application/x-www-form-urlencoded") {
                    Object.keys(queryString).forEach(function (fieldName) {
                        service.addParam(fieldName, queryString[fieldName]);
                    });
                }
                else if (contentType === "application/json") {
                    if (Object.keys(localVarRequestOptions.body).length !== 0) {
                        return JSON.stringify(localVarRequestOptions.body);
                    }
                }
                return "";
            },
            parseResponse: function (service, httpClient) {
                try {
                    return JSON.parse(httpClient.getText());
                }
                catch (e) {
                    dw.system.Logger.error(httpClient.getText() + " : is not a valid JSON string : " + e.getMessage());
                    return httpClient.getText();
                }
            },
            getRequestLogMessage: function (request) {
                return request;
            },
            getResponseLogMessage: function (response) {
                return response.text;
            }
        };
    };
    return Utility;
}());
exports.Utility = Utility;
module.exports = Utility;
