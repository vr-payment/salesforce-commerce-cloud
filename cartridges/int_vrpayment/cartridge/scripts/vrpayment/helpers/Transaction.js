"use strict";
/* global dw empty session */

exports.Transaction = void 0;
var VRPayment = require("~/cartridge/scripts/vrpayment/sdk/index");
/**
 * Transaction Helper
 */
var Transaction = /** @class */ (function () {
    /**
     * Constructor
     * @param { dw.order.Basket | dw.order.LineItemCtnr } currentBasket
     */
    function Transaction(currentBasket) {
        this.UtilityHelper = new (require("~/cartridge/scripts/vrpayment/helpers/Utility"));
        this.spaceId = this.UtilityHelper.getConfigs().spaceId;
        this.ApiClient = new (require("~/cartridge/scripts/vrpayment/helpers/ApiClient"));
        this.PaymentMethodConfigurationService = new VRPayment.api.PaymentMethodConfigurationService(this.ApiClient);
        this.integrationType = this.UtilityHelper.getConfigs().integrationType || 'payment_page';
        this.TransactionIframeService = new VRPayment.api.TransactionIframeService(this.ApiClient);
        this.TransactionPaymentPageService = new VRPayment.api.TransactionPaymentPageService(this.ApiClient);
        this.TransactionService = new VRPayment.api.TransactionService(this.ApiClient);
        this.currentBasket = currentBasket;
    }
    /**
     * Get a list of lineItems from Basket
     *
     * @return { VRPayment.model.Transaction }
     */
    Transaction.prototype.getLineItemsFromBasket = function () {
        var data = Array();
        var shippingLineItem = new VRPayment.model.LineItemCreate();
        shippingLineItem.name = VRPayment.model.LineItemType.SHIPPING;
        shippingLineItem.uniqueId = VRPayment.model.LineItemType.SHIPPING + "-" + dw.util.UUIDUtils.createUUID();
        shippingLineItem.sku = VRPayment.model.LineItemType.SHIPPING;
        shippingLineItem.quantity = 1;
        shippingLineItem.taxes = this.getShippingTax();
        shippingLineItem.amountIncludingTax = (this.currentBasket.shippingTotalPrice.getValue()).toFixed(2);
        shippingLineItem.type = VRPayment.model.LineItemType.SHIPPING;
        data.push(shippingLineItem);
        var allItemsList = this.currentBasket.getAllLineItems().iterator();
        while (allItemsList.hasNext()) {
            // @ts-ignore
            var couponLineItem = allItemsList.next();
            // @ts-ignore
            if (!couponLineItem instanceof dw.order.PriceAdjustment) {
                continue;
            }
            if (couponLineItem.getPriceValue() < 0) {
                var lineItem = new VRPayment.model.LineItemCreate();
                lineItem.name = couponLineItem.getLineItemText();
                lineItem.uniqueId = "COUPON-" + couponLineItem.getLineItemText() + dw.util.UUIDUtils.createUUID();
                lineItem.quantity = 1;
                lineItem.taxes = 0;
                lineItem.amountIncludingTax = couponLineItem.getPriceValue();
                lineItem.type = VRPayment.model.LineItemType.DISCOUNT;
                data.push(lineItem);
            }
        }
        var productLineItems = this.currentBasket.getAllProductLineItems().iterator();
        while (productLineItems.hasNext()) {
            var lineItem_1 = new VRPayment.model.LineItemCreate();
            var productLineItem = productLineItems.next();
            var productPrice = productLineItem.getPriceValue();
            lineItem_1.name = productLineItem.productName;
            lineItem_1.uniqueId = productLineItem.productID + "-" + dw.util.UUIDUtils.createUUID();
            lineItem_1.sku = productLineItem.manufacturerSKU;
            lineItem_1.quantity = productLineItem.quantityValue;
            lineItem_1.taxes = this.getLineItemTax(productLineItem);
            lineItem_1.amountIncludingTax = productPrice.toFixed(2);
            lineItem_1.type = VRPayment.model.LineItemType.PRODUCT;
            data.push(lineItem_1);
        }
        return data;
    };
    Transaction.prototype.getShippingTax = function () {
        var taxArray = [];
        var totalPrice = this.currentBasket.shippingTotalPrice.getValue();
        var taxRate = (this.currentBasket.shippingTotalTax.getValue() / totalPrice).toFixed(2);
        var tax = new VRPayment.model.TaxCreate();
        tax.rate = parseFloat(taxRate) * 100;
        tax.title = 'ShippingTax';
        taxArray.push(tax);
        return taxArray;
    };
    /**
     * Get tax
     * @param productLineItem
     */
    Transaction.prototype.getLineItemTax = function (productLineItem) {
        var taxArray = [];
        var tax = new VRPayment.model.TaxCreate();
        tax.rate = productLineItem.getTaxRate() * 100;
        tax.title = productLineItem.getTaxClassID() ? productLineItem.getTaxClassID() : 'LineItemTax';
        taxArray.push(tax);
        return taxArray;
    };
    /**
     * Get billing address
     *
     * @returns { VRPayment.model.Address }
     */
    Transaction.prototype.getBillingAddress = function () {
        var address;
        if (this.currentBasket.billingAddress) {
            address = new VRPayment.model.Address();
            address.city = this.currentBasket.billingAddress.getCity();
            address.country = this.currentBasket.billingAddress.getCountryCode().getValue();
            address.familyName = this.currentBasket.billingAddress.getLastName();
            address.givenName = this.currentBasket.billingAddress.getFirstName();
            address.postcode = this.currentBasket.billingAddress.getPostalCode();
            address.postalState = this.currentBasket.billingAddress.getStateCode();
            address.phoneNumber = this.currentBasket.billingAddress.getPhone();
            address.street = this.currentBasket.billingAddress.getAddress1();
            return address;
        }
        return undefined;
    };
    /**
     * Get shipping address
     *
     * @returns { VRPayment.model.Address }
     */
    Transaction.prototype.getShippingAddress = function () {
        var address;
        if (this.currentBasket.defaultShipment.shippingAddress !== null) {
            address = new VRPayment.model.Address();
            address.city = this.currentBasket.defaultShipment.shippingAddress.getCity();
            address.country = this.currentBasket.defaultShipment.shippingAddress.getCountryCode().getValue();
            address.familyName = this.currentBasket.defaultShipment.shippingAddress.getLastName();
            address.givenName = this.currentBasket.defaultShipment.shippingAddress.getFirstName();
            address.postcode = this.currentBasket.defaultShipment.shippingAddress.getPostalCode();
            address.postalState = this.currentBasket.defaultShipment.shippingAddress.getStateCode();
            address.phoneNumber = this.currentBasket.defaultShipment.shippingAddress.getPhone();
            address.street = this.currentBasket.defaultShipment.shippingAddress.getAddress1();
            return address;
        }
        return undefined;
    };
    /**
     * Get or create a transaction from the session Basket
     *
     * @return { VRPayment.model.Transaction }
     */
    Transaction.prototype.createUpdateTransaction = function () {
        var transactionCreate;
        var transactionLineItems = this.getLineItemsFromBasket();
        var billingAddress = this.getBillingAddress();
        var shippingAddress = this.getShippingAddress();
        // Transaction and Basket exist, edit existing transaction
        if (this.isOldSession()) {
            var transaction = this.getTransactionById(this.spaceId, session.custom.VRPaymentTransactionId);
            transaction.lineItems = transactionLineItems;
            transaction.billingAddress = empty(billingAddress) ? shippingAddress : billingAddress;
            transaction.shippingAddress = shippingAddress;
            transactionCreate = this.TransactionService.update(this.spaceId, transaction);
        }
        else {
            var transaction = new VRPayment.model.TransactionCreate();
            transaction.lineItems = transactionLineItems;
            transaction.currency = this.currentBasket.getCurrencyCode();
            transaction.language = session.custom.language;
            transaction.billingAddress = empty(billingAddress) ? shippingAddress : billingAddress;
            transaction.shippingAddress = shippingAddress;
            transaction.autoConfirmationEnabled = true;
            transactionCreate = this.TransactionService.create(this.spaceId, transaction);
            session.custom.VRPaymentTransactionId = transactionCreate.id;
            session.custom.VRPaymentBasketId = this.currentBasket.getUUID();
        }
        return transactionCreate;
    };
    /**
     * Check if the custom is still using the same basket in the current session
     * @return { boolean }
     */
    Transaction.prototype.isOldSession = function () {
        return (!empty(this.getId()) &&
            !empty(session.custom.VRPaymentBasketId) &&
            (session.custom.VRPaymentBasketId === this.currentBasket.getUUID()));
    };
    /**
     * Get session transaction ID
     */
    Transaction.prototype.getId = function () {
        if (!empty(session.custom.VRPaymentTransactionId) &&
            (session.custom.VRPaymentTransactionId !== "undefined")) {
            return session.custom.VRPaymentTransactionId;
        }
        return null;
    };
    /**
     * Destroy session transaction ID
     */
    Transaction.prototype.destroyId = function () {
        session.custom.VRPaymentTransactionId = null;
    };
    /**
     * Update billing address
     *
     * @param { dw.order.Basket } currentBasket
     * @param { any } billingAddress
     * @return { {possiblePaymentMethodsArray: Array<number>; javascriptUrl: string; transactionPossiblePaymentMethods: Array<PaymentMethodConfiguration> } || { error: boolean; errorMessage: string }}
     */
    Transaction.prototype.updateBillingAddress = function (billingAddress) {
        var address;
        address = new VRPayment.model.Address();
        address.city = billingAddress.addressFields.city.value;
        address.country = billingAddress.addressFields.country.value;
        address.familyName = billingAddress.addressFields.lastName.value;
        address.givenName = billingAddress.addressFields.firstName.value;
        address.postcode = billingAddress.addressFields.postalCode.value;
        address.street = billingAddress.addressFields.address1.value;
        if (Object.prototype.hasOwnProperty.call(billingAddress.addressFields, "states")) {
            address.postalState = billingAddress.addressFields.states.stateCode.value;
        }
        if (this.isOldSession()) {
            var transaction = this.getTransactionById(this.spaceId, session.custom.VRPaymentTransactionId);
            transaction.billingAddress = address;
            return transaction;
        }
        return {
            error: true,
            errorMessage: "Could not find existing transaction to edit",
        };
    };
    /**
     * Update shipping address
     *
     * @param { any } shippingAddress
     * @return { {possiblePaymentMethodsArray: Array<number>; javascriptUrl: string; transactionPossiblePaymentMethods: Array<PaymentMethodConfiguration> } || { error: boolean; errorMessage: string }}
     */
    Transaction.prototype.updateShippingAddress = function (shippingAddress) {
        var address;
        address = new VRPayment.model.Address();
        address.city = shippingAddress.addressFields.city.value;
        address.country = shippingAddress.addressFields.country.value;
        address.familyName = shippingAddress.addressFields.lastName.value;
        address.givenName = shippingAddress.addressFields.firstName.value;
        address.postcode = shippingAddress.addressFields.postalCode.value;
        address.street = shippingAddress.addressFields.address1.value;
        if (Object.prototype.hasOwnProperty.call(shippingAddress.addressFields, "states")) {
            address.postalState = shippingAddress.addressFields.states.stateCode.value;
        }
        // Transaction and Basket exist, edit existing transaction.
        if (this.isOldSession()) {
            var transaction = this.getTransactionById(this.spaceId, session.custom.VRPaymentTransactionId);
            transaction.shippingAddress = address;
            transaction.billingAddress = address;
            return transaction;
        }
        return {
            error: true,
            errorMessage: "Could not find existing transaction to edit",
        };
    };
    /**
     * Lazy check if any of the mandatory addressFields have a value
     *
     * @param { any } addressFields
     * @return { boolean }
     */
    Transaction.prototype.ajaxAddressValid = function (addressFields) {
        var isValid = false;
        Object.keys(addressFields).forEach(function (key) {
            if (addressFields[key] && addressFields[key].mandatory && addressFields[key].htmlValue) {
                isValid = true;
            }
        });
        return isValid;
    };
    /**
     * Set Transaction Data
     * @param data
     */
    Transaction.prototype.setMetaData = function (data) {
        var transaction = this.getTransactionById(this.spaceId, session.custom.VRPaymentTransactionId);
        transaction.metaData = data;
        transaction.successUrl = dw.web.URLUtils.abs("Order-VRPaymentConfirm", "ID", data.orderID, "token", data.orderToken).toString();
        transaction.failedUrl = dw.web.URLUtils.abs("Order-VRPaymentFail").toString();
        transaction.merchantReference = data.orderID;
        this.TransactionService.update(this.spaceId, transaction);
    };
    /**
     * Handle current basket
     *
     * @returns { {possiblePaymentMethodsArray: Array<number>; javascriptUrl: string; transactionPossiblePaymentMethods: Array<PaymentMethodConfiguration> } }
     */
    Transaction.prototype.handleTransaction = function () {
        var transaction = this.createUpdateTransaction();
        var data = this.getPaymentVariableData(transaction);
        var entityQuery = new VRPayment.model.EntityQuery();
        entityQuery.numberOfEntities = 100;
        data.transactionPossiblePaymentMethods = this.PaymentMethodConfigurationService.search(this.spaceId, entityQuery);
        data.integrationType = this.integrationType;
        if (this.integrationType === 'iframe') {
            data.javascriptUrl = this.TransactionIframeService.javascriptUrl(this.spaceId, transaction.id, {});
        }
        if (this.integrationType === 'payment_page') {
            data.paymentPageUrl = this.TransactionPaymentPageService.paymentPageUrl(this.spaceId, transaction.id, {});
        }
        return data;
    };
    /**
     * Get payment variable data
     *
     * @param { VRPayment.model.Transaction } transaction
     * @returns { {possiblePaymentMethodsArray: Array<number>; javascriptUrl: string; transactionPossiblePaymentMethods: Array<VRPayment.model.PaymentMethodConfiguration>} }
     */
    Transaction.prototype.getPaymentVariableData = function (transaction) {
        var transactionPossiblePaymentMethods = this.TransactionService.fetchPaymentMethods(this.spaceId, transaction.id, this.integrationType);
        var possiblePaymentMethodsArray = Array();
        transactionPossiblePaymentMethods.forEach(function (transactionPossiblePaymentMethod) {
            possiblePaymentMethodsArray.push(transactionPossiblePaymentMethod.id);
        });
        return {
            javascriptUrl: "",
            possiblePaymentMethodsArray: possiblePaymentMethodsArray,
            transactionPossiblePaymentMethods: Array(),
        };
    };
    /**
     *
     * @param { VRPayment.model.Transaction } transaction
     */
    Transaction.prototype.updateTransaction = function (transaction) {
        this.TransactionService.update(this.spaceId, transaction);
    };
    /**
     * Get VRPayment.model.Transaction by id
     *
     * @param { number } spaceId
     * @param { number } transactionId
     * @return { VRPayment.model.Transaction }
     */
    Transaction.prototype.getTransactionById = function (spaceId, transactionId) {
        return this.TransactionService.read(spaceId, transactionId);
    };
    /**
     * Gets the payment page URL.
     *
     * @returns string
     */
    Transaction.prototype.getPaymentPageUrl = function () {
        var transactionId = this.getId();
        if (transactionId !== null) {
            // let transaction: VRPayment.model.Transaction = this.getTransactionById(this.spaceId, transactionId);
            return this.TransactionPaymentPageService.paymentPageUrl(this.spaceId, transactionId, {});
        }
        return '';
    };
    /**
     * Get's the integrantion type being used.
     *
     * @returns string
     */
    Transaction.prototype.getIntegrationType = function () {
        return this.integrationType;
    };
    return Transaction;
}());
exports.Transaction = Transaction;
module.exports = Transaction;
