"use strict";
/* global dw empty */
var UtilityHelper = new (require("~/cartridge/scripts/vrpayment/helpers/Utility"));
/**
 * Handle basket
 *
 * @param {Object} basket - Basket
 * @returns {{success: boolean, paymentInstrument: *}} JSON object of the return status
 */
function handle(basket) {
    var methodName = "VRPAYMENT";
    var paymentInstrument;
    dw.system.Transaction.wrap(function () {
        paymentInstrument = UtilityHelper.createPaymentInstrument(basket, methodName);
    });
    return {
        success: true,
        // @ts-ignore
        paymentInstrument: paymentInstrument,
    };
}
/**
 * @param { dw.order.Order } order - Order object
 * @param { string } orderNumber - Order Number
 * @param { dw.order.OrderPaymentInstrument } paymentInstrument - current payment instrument
 * @returns { { [index: string]: boolean } } authorize the order
 */
function authorize(order, orderNumber, paymentInstrument) {
    if (empty(paymentInstrument) || empty(order) || empty(paymentInstrument.getPaymentMethod())) {
        return {
            error: true,
            authorized: false,
        };
    }
    var paymentMethodId = paymentInstrument.getPaymentMethod();
    var paymentMethod = dw.order.PaymentMgr.getPaymentMethod(paymentMethodId);
    var paymentProcessor = paymentMethod.getPaymentProcessor();
    if (empty(paymentProcessor)) {
        return {
            error: true,
            authorized: false,
        };
    }
    if (paymentInstrument.getPaymentTransaction().getAmount().getValue() === 0) {
        dw.system.Transaction.wrap(function () {
            order.removePaymentInstrument(paymentInstrument);
        });
        return {
            error: false,
            authorized: true,
        };
    }
    dw.system.Transaction.wrap(function () {
        // @ts-ignore
        paymentInstrument.paymentTransaction.transactionID = order.orderNo;
        // @ts-ignore
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    return {
        error: false,
        authorized: true,
    };
}
exports.handle = handle;
exports.authorize = authorize;
