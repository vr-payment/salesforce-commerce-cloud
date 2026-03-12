"use strict";

// @ts-ignore
var server = require("server");
// @ts-ignore
server.extend(module.superModule);
var TransactionHelperImport = require("~/cartridge/scripts/vrpayment/helpers/Transaction");
var paymentMethodID = "VRPAYMENT";
/**
 * Prepends custom logic to the "SubmitPayment" endpoint.
 *
 * This function retrieves the view data from the response object, validates the current basket and billing form,
 * and processes the payment if valid. It handles different integration types, updates the billing address,
 * calculates the order, and processes the payment using the appropriate processor. Finally, it sends the updated
 * view data as a JSON response.
 *
 * @param {any} req - The request object.
 * @param {any} res - The response object.
 * @param {any} next - The next middleware function in the stack.
 */
server.prepend("SubmitPayment", function (req, res, next) {
    var data = res.getViewData();
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    var billingForm = server.forms.getForm("billing");
    if ((data && data.csrfError) ||
        !currentBasket ||
        (billingForm.paymentMethod.value !== paymentMethodID)) {
        return next();
    }
    var paymentMethodRegex = /_handler(\d+)/gi;
    var AccountModel = require("*/cartridge/models/account");
    var OrderModel = require("*/cartridge/models/order");
    var COHelpers = require("*/cartridge/scripts/checkout/checkoutHelpers");
    var TransactionHelper = new TransactionHelperImport();
    if (TransactionHelper.getIntegrationType() == "iframe" &&
        (empty(req.form.VRPAYMENT_handler) ||
            (typeof req.form.VRPAYMENT_handler !== 'string') ||
            (req.form.VRPAYMENT_handler.match(paymentMethodRegex) === null))) {
        res.json({
            handler: {
                handler: req.form.VRPAYMENT_handler,
                regex: req.form.VRPAYMENT_handler ? req.form.VRPAYMENT_handler.match(paymentMethodRegex) : null
            },
            form: billingForm,
            fieldErrors: [],
            serverErrors: [],
            error: true
        });
        // @ts-ignore
        this.emit("route:Complete", req, res);
        return;
    }
    var viewData = {};
    // @ts-ignore
    viewData.paymentMethod = {
        value: paymentMethodID,
        htmlName: billingForm.paymentMethod.htmlName
    };
    var billingFormErrors = COHelpers.validateBillingForm(billingForm.addressFields);
    var contactInfoFormErrors = COHelpers.validateFields(billingForm.contactInfoFields);
    if (Object.keys(billingFormErrors).length || Object.keys(contactInfoFormErrors).length) {
        res.json({
            form: billingForm,
            fieldErrors: [billingFormErrors, contactInfoFormErrors],
            serverErrors: [],
            error: true,
            paymentMethod: viewData.paymentMethod
        });
        // @ts-ignore
        this.emit("route:Complete", req, res);
        return;
    }
    // @ts-ignore
    viewData.address = {
        firstName: {
            value: billingForm.addressFields.firstName.value
        },
        lastName: {
            value: billingForm.addressFields.lastName.value
        },
        address1: {
            value: billingForm.addressFields.address1.value
        },
        address2: {
            value: billingForm.addressFields.address2.value
        },
        city: {
            value: billingForm.addressFields.city.value
        },
        postalCode: {
            value: billingForm.addressFields.postalCode.value
        },
        countryCode: {
            value: billingForm.addressFields.country.value
        }
    };
    if (Object.prototype.hasOwnProperty.call(billingForm.addressFields, "states")) {
        // @ts-ignore
        viewData.address.stateCode = {
            value: billingForm.addressFields.states.stateCode.value
        };
    }
    var email = currentBasket.getCustomerEmail();
    // @ts-ignore
    viewData.email = {
        value: email
    };
    res.setViewData(viewData);
    var billingAddress = currentBasket.billingAddress;
    dw.system.Transaction.wrap(function () {
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }
        billingAddress.setFirstName(billingForm.addressFields.firstName.value);
        billingAddress.setLastName(billingForm.addressFields.lastName.value);
        billingAddress.setAddress1(billingForm.addressFields.address1.value);
        billingAddress.setAddress2(billingForm.addressFields.address2.value);
        billingAddress.setCity(billingForm.addressFields.city.value);
        billingAddress.setPostalCode(billingForm.addressFields.postalCode.value);
        billingAddress.setCountryCode(billingForm.addressFields.country.value);
        if (Object.prototype.hasOwnProperty.call(billingForm.addressFields, "states")) {
            billingAddress.setStateCode(billingForm.addressFields.states.stateCode.value);
        }
        // @ts-ignore
        currentBasket.setCustomerEmail(email);
    });
    dw.system.Transaction.wrap(function () {
        dw.system.HookMgr.callHook("dw.order.calculate", "calculate", currentBasket);
    });
    var paymentMethod = dw.order.PaymentMgr.getPaymentMethod(paymentMethodID);
    var processor = paymentMethod.getPaymentProcessor();
    if (!processor) {
        throw new Error(dw.web.Resource.msg("error.payment.processor.missing", "checkout", null));
    }
    var processorResult = null;
    if (dw.system.HookMgr.hasHook("app.payment.processor." + processor.ID.toLowerCase())) {
        processorResult = dw.system.HookMgr.callHook("app.payment.processor." + processor.ID.toLowerCase(), "Handle", currentBasket);
    }
    else {
        throw new Error("hooks/payment/processor/vrpayment.js file is missing or \"app.payment.processor.vrpayment\" hook is wrong set");
    }
    if (processorResult.error) {
        res.json({
            form: billingForm,
            fieldErrors: [],
            serverErrors: [],
            error: true
        });
        // @ts-ignore
        this.emit("route:Complete", req, res);
        return;
    }
    var usingMultiShipping = false; // Current integration support only single shipping
    req.session.privacyCache.set("usingMultiShipping", usingMultiShipping);
    var currentLocale = dw.util.Locale.getLocale(req.locale.id);
    var basketModel = new OrderModel(currentBasket, {
        usingMultiShipping: usingMultiShipping,
        countryCode: currentLocale.country,
        containerView: "basket"
    });
    var accountModel = new AccountModel(req.currentCustomer);
    // The hack for MFRA renders right data in function updatePaymentInformation(order). TODO need to find better solution
    basketModel.resources.cardType = "";
    basketModel.resources.cardEnding = "";
    basketModel.billing.payment.selectedPaymentInstruments[0].type = "";
    basketModel.billing.payment.selectedPaymentInstruments[0].maskedCreditCardNumber = "";
    basketModel.billing.payment.selectedPaymentInstruments[0].expirationMonth = req.form.VRPAYMENT_handler_name + " ";
    basketModel.billing.payment.selectedPaymentInstruments[0].expirationYear = " " + dw.util.StringUtils.formatMoney(new dw.value.Money(basketModel.billing.payment.selectedPaymentInstruments[0].amount, currentBasket.getCurrencyCode()));
    // End the hack
    res.json({
        renderedPaymentInstruments: COHelpers.getRenderedPaymentInstruments(req, accountModel),
        customer: accountModel,
        order: basketModel,
        session: session.custom,
        processorResult: processorResult,
        form: billingForm,
        error: false
    });
    // @ts-ignore
    this.emit("route:Complete", req, res);
});
/**
 * Appends custom logic to the "PlaceOrder" endpoint.
 *
 * This function retrieves the view data from the response object, checks for the presence of orderID and orderToken,
 * and processes the order if valid. It updates the order's external order number, sets metadata, and handles redirection
 * if the integration type is "payment_page". Finally, it sends the updated view data as a JSON response.
 *
 * @param {any} req - The request object.
 * @param {any} res - The response object.
 * @param {any} next - The next middleware function in the stack.
 */
server.append("PlaceOrder", function (req, res, next) {
    var viewData = res.getViewData();
    if (!(empty(viewData.orderID) || empty(viewData.orderToken))) {
        var order_1 = dw.order.OrderMgr.getOrder(viewData.orderID);
        if (order_1 && order_1.getInvoiceNo()) {
            var orderPaymentInstrument = order_1.getPaymentInstruments().toArray();
            if (orderPaymentInstrument &&
                (orderPaymentInstrument.length === 1) &&
                orderPaymentInstrument[0].getPaymentTransaction().getPaymentProcessor().ID &&
                (orderPaymentInstrument[0].getPaymentTransaction().getPaymentProcessor().ID === paymentMethodID)) {
                var TransactionHelper_1 = new TransactionHelperImport();
                dw.system.Transaction.wrap(function () {
                    order_1.setExternalOrderNo(TransactionHelper_1.getId());
                });
                TransactionHelper_1.setMetaData(viewData);
                if (TransactionHelper_1.getIntegrationType() === "payment_page") {
                    viewData.redirectUrl = TransactionHelper_1.getPaymentPageUrl();
                }
                TransactionHelper_1.destroyId();
                req.session.raw.custom.orderID = null;
            }
        }
    }
    res.json(viewData);
    return next();
});
module.exports = server.exports();
