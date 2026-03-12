"use strict";

var Locale = require("dw/util/Locale");
var server = require("server");
// @ts-ignore
server.extend(module.superModule);
var TransactionHelperImport = require("~/cartridge/scripts/vrpayment/helpers/Transaction");
server.append("Begin", function (req, res, next) {
    var currentBasket = dw.order.BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        return next();
    }
    var transactionHelper = new TransactionHelperImport(currentBasket);
    var viewData = res.getViewData();
    var currentLocale = Locale.getLocale(req.locale.id);
    session.custom.language = currentLocale.language;
    viewData.vrpayment = transactionHelper.handleTransaction();
    res.setViewData(viewData);
    return next();
});
module.exports = server.exports();
