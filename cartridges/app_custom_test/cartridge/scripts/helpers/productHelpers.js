'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');

var PREMIUM_GROUP = 'Vovk_Customers';

function isPremiumUser(req) {
    var CustomerMgr = require('dw/customer/CustomerMgr');

    var isPremiumUser = null;

    if (req.currentCustomer.profile) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
        var customerGroups = customer.getCustomerGroups();
        var premiumGroup = collections.find(customerGroups, function (group) {
            return group.ID === PREMIUM_GROUP;
        });
        isPremiumUser = premiumGroup !== null;
    }

    return isPremiumUser;
}

function isPremiumProduct(productID) {
    var catalogMgr = require('dw/catalog/CatalogMgr');

    var onlineProducts = catalogMgr.getCategory('premiumCategory').onlineProducts;
    return collections.find(onlineProducts, function (item) {
        return item.ID === productID;
    }) !== null;
}

function getPremiumDiscount(product) {
    var catalogMgr = require('dw/catalog/CatalogMgr');

    var secretDiscount = catalogMgr.getCategory('premiumCategory').custom.SecretDiscount;
    product.price.list = JSON.parse(JSON.stringify(product.price.sales));
    product.price.sales.value = product.price.list.value * (secretDiscount / 100);
    product.price.sales.formatted = '$' + product.price.sales.value;

    return secretDiscount;
}

module.exports = {
    isPremiumUser: isPremiumUser,
    isPremiumProduct: isPremiumProduct,
    getPremiumDiscount: getPremiumDiscount
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
