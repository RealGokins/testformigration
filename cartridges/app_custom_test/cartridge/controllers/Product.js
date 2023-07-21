'use strict';

var server = require('server');

server.extend(module.superModule);

var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var productHelper = require('*/cartridge/scripts/helpers/productHelpers');


server.prepend('Show', function (req, res, next) {
    var isPremiumUser = productHelper.isPremiumUser(req);
    res.setViewData(
        {
            isPremiumUser: isPremiumUser
        }
    );
    next();
});

server.get('Another', cache.applyPromotionSensitiveCache, consentTracking.consent, function (req, res, next) {
    var showProductPageHelperResult = productHelper.showProductPage(req.querystring, req.pageMetaData);
    var productType = showProductPageHelperResult.product.productType;

    var isPremiumUser = productHelper.isPremiumUser(req);
    var isPremiumProduct = productHelper.isPremiumProduct(showProductPageHelperResult.product.id);

    if (isPremiumUser === null || (!showProductPageHelperResult.product.online && productType !== 'set' && productType !== 'bundle')) {
        res.setStatusCode(404);
        res.render('error/notFound');
    } else {

        var pageLookupResult = productHelper.getPageDesignerProductPage(showProductPageHelperResult.product);

        if ((pageLookupResult.page && pageLookupResult.page.hasVisibilityRules()) || pageLookupResult.invisiblePage) {
            // the result may be different for another user, do not cache on this level
            // the page itself is a remote include and can still be cached
            res.cachePeriod = 0; // eslint-disable-line no-param-reassign
        }
        if (pageLookupResult.page) {
            res.page(pageLookupResult.page.ID, {}, pageLookupResult.aspectAttributes);
        } else {
            if (isPremiumProduct) {
                var premiumDiscount = productHelper.getPremiumDiscount(showProductPageHelperResult.product);

                res.render(showProductPageHelperResult.template, {
                    product: showProductPageHelperResult.product,
                    addToCartUrl: showProductPageHelperResult.addToCartUrl,
                    resources: showProductPageHelperResult.resources,
                    breadcrumbs: showProductPageHelperResult.breadcrumbs,
                    canonicalUrl: showProductPageHelperResult.canonicalUrl,
                    schemaData: showProductPageHelperResult.schemaData,
                    premiumDiscount: premiumDiscount,
                    isPremiumUser: isPremiumUser
                });
            } else {
                res.render(showProductPageHelperResult.template, {
                    product: showProductPageHelperResult.product,
                    addToCartUrl: showProductPageHelperResult.addToCartUrl,
                    resources: showProductPageHelperResult.resources,
                    breadcrumbs: showProductPageHelperResult.breadcrumbs,
                    canonicalUrl: showProductPageHelperResult.canonicalUrl,
                    schemaData: showProductPageHelperResult.schemaData,
                    isPremiumUser: isPremiumUser
                });
            }
        }
    }
    next();
}, pageMetaData.computedPageMetaData);

module.exports = server.exports();
