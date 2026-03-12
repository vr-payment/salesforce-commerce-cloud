"use strict";
jQuery(function ($) {
    var VRPaymentCheckout = {
        active_payment_tab: '.tab-pane.active',
        customer_address: '#dwfrm_billing > fieldset.billing-address-block > fieldset.billing-address, #dwfrm_shipping > div.shipping-address > fieldset.shipping-address-block',
        submit_payment: '#checkout-main button.btn.btn-primary.btn-block.submit-payment',
        place_order: '#checkout-main button.btn.btn-primary.btn-block.place-order',
        available_payment_methods_tabs: 'a.vrpayment-tab',
        first_available: '#dwfrm_billing div.form-nav.billing-nav.payment-information > ul > li > a',
        payment_handler: '[name=VRPAYMENT_handler]',
        integrationType: 'payment_page',
        /**
         * Initialize plugin
         */
        init: function () {
            $(window).on('popstate', this.disableValidation);
            $(this.customer_address).on('mouseleave', this.addressUpdatePaymentMethods);
            $(this.place_order).on('click', this.placeOrder);
            this.integrationType = this.getIntegrationType();
            if (this.integrationType === 'iframe') {
                $(this.available_payment_methods_tabs).on('click', this.getIframe);
                $(this.submit_payment).on('click', this.submitPayment);
            }
            else if (this.integrationType === 'payment_page') {
                $(this.submit_payment).on('click', function () { return true; });
                $(this.place_order).on('click', this.gotoPaymentPage);
            }
            $('.submit-shipping').on('click', function () {
                $('#dwfrm_billing div.form-nav.billing-nav.payment-information > ul > li > a').first().trigger('click');
                $(".tab-pane.vrpayment-content").removeAttr("style");
            });
            $(window).on("load", function () {
                $('#dwfrm_billing div.form-nav.billing-nav.payment-information > ul > li > a').first().trigger('click');
                $(".tab-pane.vrpayment-content").removeAttr("style");
            });
            window.VRPaymentCheckout = this;
        },
        /**
         * Get integration type from configuration
         */
        getIntegrationType: function () {
            // Assuming the integration type is stored in a hidden input field
            return $('[name=VRPAYMENT_integrationType]').val() || 'payment_page';
        },
        /**
         * Disable validation when user clicks back button
         */
        disableValidation: function () {
            $(this.active_payment_tab).attr('validation', false);
        },
        /**
         * Update payment methods on address change
         */
        addressUpdatePaymentMethods: function () {
            var data = $(this).serializeArray();
            // @ts-ignore
            $.ajax({
                method: "POST",
                url: $("[name=VRPAYMENT_url]").first().val(),
                data: data,
                success: function (result) {
                    if (result && result.vrpayment && result.vrpayment.possiblePaymentMethodsArray) {
                        result.vrpayment.possiblePaymentMethodsArray.forEach(function (value) {
                            $('.VRPAYMENT-nav-item-' + value + ', .vrpayment-content-' + value).show();
                        });
                    }
                }
            });
        },
        /**
         * Submit payment
         * @param event
         */
        submitPayment: function (event) {
            var activeTabId = $(VRPaymentCheckout.active_payment_tab).data('id');
            if (activeTabId) {
                var activeTabValid = $(VRPaymentCheckout.active_payment_tab).attr('validation');
                if (activeTabValid) {
                    if ($(VRPaymentCheckout.payment_handler).val() !== '') {
                        return true;
                    }
                }
                event.preventDefault();
                window['VRPAYMENT_handler' + activeTabId].validate();
                return false;
            }
        },
        /**
         * Place order using the iframe integration type
         */
        placeOrder: function (event) {
            var activeTabId = $(VRPaymentCheckout.active_payment_tab).data('id');
            if (activeTabId !== '') {
                var activeTabValid = $(VRPaymentCheckout.active_payment_tab).attr('validation');
                if (activeTabValid) {
                    var handlerName_1 = $(VRPaymentCheckout.payment_handler).val();
                    if ((handlerName_1) && (window[handlerName_1] !== undefined)) {
                        // disable the placeOrder button here
                        $('body').trigger('checkout:disableButton', '.next-step-button button');
                        $.ajax({
                            url: $('.place-order').data('action'),
                            method: 'POST',
                            success: function (data) {
                                if (data.error) {
                                    // enable the placeOrder button here
                                    $('body').trigger('checkout:enableButton', '.next-step-button button');
                                    if (data.cartError) {
                                        window.location.href = data.redirectUrl;
                                    }
                                }
                                else {
                                    window[handlerName_1].submit();
                                }
                            },
                            error: function () {
                                // enable the placeOrder button here
                                $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                            }
                        });
                    }
                }
                return false;
            }
            return true;
        },
        /**
         * Place order using the payment page (so the user is redirected).
         */
        gotoPaymentPage: function () {
            $.ajax({
                url: $('.place-order').data('action'),
                method: 'POST',
                success: function (data) {
                    if (data.error) {
                        // enable the placeOrder button here
                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                        if (data.cartError) {
                            //TODO: probably this is wrong, and we need to redirect somewhere else.
                            window.location.href = data.redirectUrl;
                        }
                    }
                    else {
                        window.location.href = data.redirectUrl;
                    }
                },
                error: function () {
                    // enable the placeOrder button here
                    $('body').trigger('checkout:enableButton', $('.next-step-button button'));
                }
            });
        },
        /**
         * Get iframe
         * @param event
         */
        getIframe: function (event) {
            var paymentMethodId = $(this).data('id');
            console.log("Payment method ID is", paymentMethodId);
            var payment_handler_name = 'VRPAYMENT_handler' + paymentMethodId;
            if ($('#vrpayment-form-' + paymentMethodId).children().length === 0) { // iframe has not been loaded yet
                window[payment_handler_name] = window.IframeCheckoutHandler(paymentMethodId);
                window[payment_handler_name].setValidationCallback(function (validationResult) {
                    VRPaymentCheckout.validationCallBack(payment_handler_name, validationResult);
                });
                window[payment_handler_name].create('vrpayment-form-' + paymentMethodId);
            }
            return true;
        },
        /**
         * validation callback
         * @param payment_handler_name
         * @param validationResult
         */
        validationCallBack: function (payment_handler_name, validationResult) {
            if (validationResult.success) {
                $(VRPaymentCheckout.active_payment_tab).attr('validation', true);
                $(VRPaymentCheckout.payment_handler).val(payment_handler_name);
                $('#checkout-main button.btn.btn-primary.btn-block.submit-payment').trigger('click');
            }
            else {
                $(VRPaymentCheckout.active_payment_tab).attr('validation', false);
                $(VRPaymentCheckout.payment_handler).val('');
            }
        },
    };
    VRPaymentCheckout.init();
});
