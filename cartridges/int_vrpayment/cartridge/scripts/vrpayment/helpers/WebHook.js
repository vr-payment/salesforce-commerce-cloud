"use strict";
/* global dw empty session */

exports.WebHook = void 0;
var VRPayment = require("~/cartridge/scripts/vrpayment/sdk/index");
/**
 * WebHook class
 */
var WebHook = /** @class */ (function () {
    /**
     * Constructor
     */
    function WebHook() {
        /**
         * WebHook configs
         */
        this.WebHookEntity = {
            /**
             * Transaction WebHook Entity Id
             * @link https://gateway.vr-payment.de/doc/api/webhook-entity/view/1472041829003
             */
            Transaction: {
                id: 1472041829003,
                name: "SalesForce::WebHook::Transaction",
                url: dw.web.URLUtils.https("VRPayment-WebHookTransaction").toString().
                    replace("Sites-Site", "Sites-" + dw.system.Site.getCurrent().getName() + "-Site").
                    replace("default", dw.system.Site.getCurrent().getDefaultLocale())
            },
            /**
             * Transaction WebHook Entity Id
             * @link https://gateway.vr-payment.de/doc/api/webhook-entity/view/1472041829003
             */
            Refund: {
                id: 1472041839405,
                name: "SalesForce::WebHook::Refund",
                url: dw.web.URLUtils.https("VRPayment-WebHookRefund").toString().
                    replace("Sites-Site", "Sites-" + dw.system.Site.getCurrent().getName() + "-Site").
                    replace("default", dw.system.Site.getCurrent().getDefaultLocale())
            }
        };
        this.UtilityHelper = new (require("~/cartridge/scripts/vrpayment/helpers/Utility"));
        this.spaceId = this.UtilityHelper.getConfigs().spaceId;
        this.ApiClient = new (require("~/cartridge/scripts/vrpayment/helpers/ApiClient"));
        this.WebHookListenerService = new VRPayment.api.WebhookListenerService(this.ApiClient);
        this.WebHookUrlService = new VRPayment.api.WebhookUrlService(this.ApiClient);
    }
    /**
     * Create WebHook URL
     *
     * @param { { id: number, name: string, url: string } } WebHookConfig
     * @return { VRPayment.model.WebhookUrl }
     */
    WebHook.prototype.getUrl = function (WebHookConfig) {
        var webHookUrl;
        try {
            var entity = new VRPayment.model.WebhookUrlCreate();
            entity.name = WebHookConfig.name;
            entity.url = WebHookConfig.url;
            entity.state = VRPayment.model.CreationEntityState.CREATE;
            webHookUrl = this.WebHookUrlService.create(this.spaceId, entity);
        }
        catch (e) {
            var errorMessage = "Site \"" + dw.system.Site.getCurrent().getName() + "\" webHook url already exists";
            dw.system.Logger.warn(errorMessage);
            throw new Error(errorMessage + " : " + JSON.stringify({
                message: e.message,
                fileName: e.fileName,
                lineNumber: e.lineNumber
            }));
        }
        return webHookUrl;
    };
    /**
     * Get Transaction WebHook Listener
     *
     * @return { VRPayment.model.WebhookListener }
     */
    WebHook.prototype.getTransactionListener = function () {
        var webHookListener;
        try {
            var entity = new VRPayment.model.WebhookListenerCreate();
            entity.name = this.WebHookEntity.Transaction.name;
            entity.entity = this.WebHookEntity.Transaction.id;
            entity.notifyEveryChange = false;
            entity.enablePayloadSignatureAndState = true;
            entity.state = VRPayment.model.CreationEntityState.CREATE;
            entity.entityStates = [
                VRPayment.model.TransactionState.CONFIRMED,
                VRPayment.model.TransactionState.AUTHORIZED,
                VRPayment.model.TransactionState.DECLINE,
                VRPayment.model.TransactionState.FAILED,
                VRPayment.model.TransactionState.FULFILL,
                VRPayment.model.TransactionState.VOIDED,
                VRPayment.model.TransactionState.COMPLETED,
                VRPayment.model.TransactionState.PROCESSING,
            ];
            entity.url = this.getUrl(this.WebHookEntity.Transaction).id;
            webHookListener = this.WebHookListenerService.create(this.spaceId, entity);
        }
        catch (e) {
            var errorMessage = "Site \"" + dw.system.Site.getCurrent().getName() + "\" Transaction webhook already exists";
            dw.system.Logger.warn(errorMessage);
            throw new Error(errorMessage + " : " + JSON.stringify({
                message: e.message,
                fileName: e.fileName,
                lineNumber: e.lineNumber
            }));
        }
        return webHookListener;
    };
    /**
     * Get WebHook Listener
     *
     * @return { VRPayment.model.WebhookListener }
     */
    WebHook.prototype.getRefundListener = function () {
        var webHookListener;
        try {
            var entity = new VRPayment.model.WebhookListenerCreate();
            entity.name = this.WebHookEntity.Refund.name;
            entity.entity = this.WebHookEntity.Refund.id;
            entity.notifyEveryChange = false;
            entity.enablePayloadSignatureAndState = true;
            entity.state = VRPayment.model.CreationEntityState.CREATE;
            entity.entityStates = [
                VRPayment.model.RefundState.FAILED,
                VRPayment.model.RefundState.SUCCESSFUL,
            ];
            entity.url = this.getUrl(this.WebHookEntity.Refund).id;
            webHookListener = this.WebHookListenerService.create(this.spaceId, entity);
        }
        catch (e) {
            var errorMessage = "Site \"" + dw.system.Site.getCurrent().getName() + "\" Refund webhook already exists";
            dw.system.Logger.warn(errorMessage);
            throw new Error(errorMessage + " : " + JSON.stringify({
                message: e.message,
                fileName: e.fileName,
                lineNumber: e.lineNumber
            }));
        }
        return webHookListener;
    };
    return WebHook;
}());
exports.WebHook = WebHook;
module.exports = WebHook;
