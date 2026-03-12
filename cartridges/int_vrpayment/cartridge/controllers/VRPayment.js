"use strict";
/* global dw empty this */

var server = require("server");
var TransactionHelperImport = require("~/cartridge/scripts/vrpayment/helpers/Transaction");
var RefundHelperImport = require("~/cartridge/scripts/vrpayment/helpers/Refund");
var VRPayment = require("~/cartridge/scripts/vrpayment/sdk/index");
/**
 * Ajax update
 */
server.post("TransactionUpdate", server.middleware.https, function (req, res, next) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return next();
    }
    var TransactionHelper = new TransactionHelperImport(currentBasket);
    var viewData = res.getViewData();
    var COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
    var billingAddress = server.forms.getForm("billing");
    var shippingAddress = server.forms.getForm("shipping");
    var shippingFormErrors = COHelpers.validateShippingForm(shippingAddress.shippingAddress.addressFields);
    var billingFormErrors = COHelpers.validateBillingForm(billingAddress.addressFields);
    var transaction = null;
    if ((Object.keys(shippingFormErrors).length < 1) && TransactionHelper.ajaxAddressValid(shippingAddress.shippingAddress.addressFields)) {
        transaction = TransactionHelper.updateShippingAddress(shippingAddress.shippingAddress);
    }
    if ((Object.keys(billingFormErrors).length < 1) && TransactionHelper.ajaxAddressValid(billingAddress.addressFields)) {
        transaction = TransactionHelper.updateBillingAddress(billingAddress);
    }
    if (transaction !== null) {
        TransactionHelper.updateTransaction(transaction);
        viewData.vrpayment = TransactionHelper.getPaymentVariableData(transaction);
    }
    res.json(viewData);
    // @ts-ignore
    this.emit("route:Complete", req, res);
});
/**
 * WebHook Transaction callback
 */
server.post("WebHookTransaction", server.middleware.https, function (req, res, next) {
    var viewData = res.getViewData();
    var callBack = JSON.parse(req.body);
    var statusCode = 200;
    var TransactionHelper = new TransactionHelperImport(null);
    switch (callBack.listenerEntityTechnicalName) {
        case "Transaction":
            var transaction_1 = TransactionHelper.getTransactionById(callBack.spaceId, callBack.entityId);
            viewData.transaction = transaction_1;
            // @ts-ignore
            var orderID = transaction_1.metaData.orderID;
            if (!empty(orderID)) {
                var order_1 = dw.order.OrderMgr.getOrder(orderID);
                var orderStatus = order_1.getPaymentStatus().getValue();
                statusCode = 200;
                if (order_1) {
                    // @ts-ignore
                    if ([dw.order.Order.PAYMENT_STATUS_NOTPAID, dw.order.Order.PAYMENT_STATUS_PARTPAID].indexOf(orderStatus) !== -1) {
                        switch (transaction_1.state) {
                            case VRPayment.model.TransactionState.FULFILL:
                                dw.system.Transaction.wrap(function () {
                                    order_1.setExternalOrderStatus(transaction_1.state);
                                    order_1.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
                                    order_1.trackOrderChange('Order was paid');
                                });
                                break;
                            case VRPayment.model.TransactionState.DECLINE:
                            case VRPayment.model.TransactionState.VOIDED:
                            case VRPayment.model.TransactionState.FAILED:
                                dw.system.Transaction.wrap(function () {
                                    order_1.setExternalOrderStatus(transaction_1.state);
                                    order_1.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_NOTPAID);
                                    order_1.setStatus(dw.order.Order.ORDER_STATUS_CANCELLED);
                                });
                                dw.order.OrderMgr.failOrder(order_1, true);
                                break;
                        }
                    }
                    else {
                        statusCode = 202;
                    }
                }
                else {
                    statusCode = 404;
                }
            }
            break;
        default:
            statusCode = 400;
            viewData.errorMessage = "Unsupported Listener Entity Technical Name";
            break;
    }
    viewData.callBack = callBack;
    res.json(viewData);
    res.setStatusCode(statusCode);
    // @ts-ignore
    this.emit("route:Complete", req, res);
});
/**
 * WebHook Refund callback
 */
server.post("WebHookRefund", server.middleware.https, function (req, res, next) {
    var viewData = res.getViewData();
    var callBack = JSON.parse(req.body);
    var statusCode = 200;
    var TransactionHelper = new TransactionHelperImport(null);
    var RefundHelper = new RefundHelperImport(null);
    if ("Refund" === callBack.listenerEntityTechnicalName) {
        var refund_1 = RefundHelper.getRefundById(callBack.spaceId, callBack.entityId);
        if (empty(refund_1)) {
            throw new Error("Refunds error: Refund not found");
        }
        if (empty(refund_1.transaction)) {
            throw new Error("Refunds error: Refund transaction not found");
        }
        var transactionId = refund_1.transaction.id;
        var transaction_2 = TransactionHelper.getTransactionById(callBack.spaceId, transactionId);
        // @ts-ignore
        var orderID = transaction_2.metaData.orderID;
        if (!empty(orderID)) {
            var order_2 = dw.order.OrderMgr.getOrder(orderID);
            var orderStatus = order_2.getPaymentStatus().getValue();
            statusCode = 200;
            if (order_2) {
                // @ts-ignore
                if ([dw.order.Order.PAYMENT_STATUS_PAID].indexOf(orderStatus) !== -1) {
                    if (transaction_2.state === VRPayment.model.TransactionState.FULFILL) {
                        dw.system.Transaction.wrap(function () {
                            order_2.setExternalOrderStatus(transaction_2.state);
                            order_2.setExternalOrderText('Refunded');
                            order_2.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_NOTPAID);
                            order_2.setStatus(dw.order.Order.ORDER_STATUS_CANCELLED);
                            order_2.trackOrderChange('Order was refunded for ' + refund_1.amount);
                            order_2.setConfirmationStatus(dw.order.Order.CONFIRMATION_STATUS_NOTCONFIRMED);
                            order_2.setCancelCode('Refund');
                            order_2.setCancelDescription('Order was refunded');
                        });
                    }
                }
            }
        }
    }
    viewData.callBack = callBack;
    res.json(viewData);
    res.setStatusCode(statusCode);
    // @ts-ignore
    this.emit("route:Complete", req, res);
});
module.exports = server.exports();
