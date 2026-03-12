"use strict";

/* global dw empty this request */
/**
 * Configure WebHooks
 */
function start() {
    try {
        var customPreferences = dw.object.CustomObjectMgr.getCustomObject("VRPayment_Common", "vrpayment_common");
        var data = {
            customPreferences: customPreferences.custom
        };
        dw.template.ISML.renderTemplate("extensions/vrpayment.isml", data);
    }
    catch (e) {
        throw new Error("Please import metadata first. Custom object VRPayment_Common is missing.");
    }
}
/**
 * Save Store configs
 */
function saveConfiguration() {
    // @ts-ignore
    if (dw.web.CSRFProtection.validateRequest()) {
        var params_1 = request.httpParameterMap;
        var customPreferences_1 = dw.object.CustomObjectMgr.getCustomObject("VRPayment_Common", "vrpayment_common");
        /**
         * Save API Settings
         */
        dw.system.Transaction.wrap(function () {
            customPreferences_1.custom.spaceId = params_1.spaceId.intValue;
            customPreferences_1.custom.userId = params_1.userId.intValue;
            customPreferences_1.custom.apiSecret = params_1.apiSecret.stringValue;
            customPreferences_1.custom.integrationType = params_1.integrationType.stringValue;
        });
        var WebHookHelper = new (require("../../../int_vrpayment/cartridge/scripts/vrpayment/helpers/WebHook"));
        try {
            var data_1 = WebHookHelper.getTransactionListener();
            dw.system.Transaction.wrap(function () {
                customPreferences_1.custom.webHookContent = JSON.stringify(data_1);
                customPreferences_1.custom.webHookIsEnabled = true;
            });
        }
        catch (e) {
            var errorMessage = "Site \"" + dw.system.Site.getCurrent().getName() + "\" Transaction webhook was not created - already exists.";
            dw.system.Logger.warn(errorMessage);
        }
        try {
            WebHookHelper.getRefundListener();
        }
        catch (e) {
            var errorMessage = "Site \"" + dw.system.Site.getCurrent().getName() + "\" Refund webhook was not created - already exists.";
            dw.system.Logger.warn(errorMessage);
        }
    }
    start();
}
start.public = true;
saveConfiguration.public = true;
exports.Start = start;
exports.SaveConfiguration = saveConfiguration;
