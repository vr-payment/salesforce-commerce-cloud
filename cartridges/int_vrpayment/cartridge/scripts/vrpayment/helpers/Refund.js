"use strict";
/* global dw empty session */

exports.Refund = void 0;
var VRPayment = require("~/cartridge/scripts/vrpayment/sdk/index");
/**
 * Transaction Helper
 */
var Refund = /** @class */ (function () {
    /**
     * Constructor
     * @param { dw.order.Basket | dw.order.LineItemCtnr } currentBasket
     */
    function Refund(currentBasket) {
        this.UtilityHelper = new (require("~/cartridge/scripts/vrpayment/helpers/Utility"));
        this.spaceId = this.UtilityHelper.getConfigs().spaceId;
        this.ApiClient = new (require("~/cartridge/scripts/vrpayment/helpers/ApiClient"));
        this.PaymentMethodConfigurationService = new VRPayment.api.PaymentMethodConfigurationService(this.ApiClient);
        this.TransactionIframeService = new VRPayment.api.TransactionIframeService(this.ApiClient);
        this.TransactionService = new VRPayment.api.TransactionService(this.ApiClient);
        this.RefundService = new VRPayment.api.RefundService(this.ApiClient);
        this.currentBasket = currentBasket;
    }
    /**
     * Get VRPayment.model.Refund by id
     *
     * @param { number } spaceId
     * @param { number } refundId
     * @return { VRPayment.model.Refund }
     */
    Refund.prototype.getRefundById = function (spaceId, refundId) {
        return this.RefundService.read(spaceId, refundId);
    };
    return Refund;
}());
exports.Refund = Refund;
module.exports = Refund;
