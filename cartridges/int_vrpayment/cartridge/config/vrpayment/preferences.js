"use strict";

exports.getPreferences = void 0;
function getPreferences() {
    try {
        var customPreferences = dw.object.CustomObjectMgr.getCustomObject("VRPayment_Common", "vrpayment_common");
        return {
            spaceId: customPreferences.custom.spaceId,
            serviceName: "int_vrpayment.http.rest.payment.vrpayment",
            macVersion: 1,
            userId: customPreferences.custom.userId,
            apiSecret: customPreferences.custom.apiSecret,
            integrationType: customPreferences.custom.integrationType
        };
    }
    catch (e) {
        var errorMessage = "Site \"" + dw.system.Site.getCurrent().getName() + "\" is not configured. You must update settings in BM > Merchant Tools > Site Preferences > VRPayment";
        dw.system.Logger.error(errorMessage);
        throw new Error(errorMessage + " : " + JSON.stringify({
            message: e.message,
            fileName: e.fileName,
            lineNumber: e.lineNumber
        }));
    }
}
exports.getPreferences = getPreferences;
module.exports = getPreferences();
