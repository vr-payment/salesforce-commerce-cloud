"use strict";
/* global dw */

exports.Authorize = exports.Handle = exports.processForm = void 0;
function processForm(req, paymentForm, viewFormData) {
    var viewData = viewFormData;
    viewData.paymentMethod = {
        value: paymentForm.paymentMethod.value,
        htmlName: paymentForm.paymentMethod.value
    };
    if (req.form.storedPaymentUUID) {
        viewData.storedPaymentUUID = req.form.storedPaymentUUID;
    }
    return {
        error: false,
        viewData: viewData
    };
}
exports.processForm = processForm;
/**
 * Handle entry point for SG integration
 * @param { dw.order.LineItemCtnr | dw.order.LineItemCtnr } basket Basket
 * @returns { {[index: string]: any} } processor result
 */
function Handle(basket) {
    return require("~/cartridge/scripts/vrpayment/processor").handle(basket);
}
exports.Handle = Handle;
/**
 * Authorize entry point for SG integration
 * @param { string } orderNumber order numebr
 * @param { dw.order.OrderPaymentInstrument } paymentInstrument payment instrument
 * @returns { { [index: string]: boolean } } processor result
 */
function Authorize(orderNumber, paymentInstrument) {
    return require("~/cartridge/scripts/vrpayment/processor").authorize(dw.order.OrderMgr.getOrder(orderNumber), orderNumber, paymentInstrument);
}
exports.Authorize = Authorize;
