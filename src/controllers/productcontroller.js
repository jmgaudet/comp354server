const Product = require('../models/product');

/**
 * This class encapsulates all the logic of
 * product API functions
 * @type {ProductController}
 */
module.exports = class ProductController {

    /**
     * Return all products by page
     * @param callback
     * @param page
     * @param resultsPerPage
     */
    static getAllProducts(callback, page = 1, resultsPerPage = 10) {
        Product.getAll((err, products) => {
            if(err) {
                callback(err);
            }

            let p = [];
            products.forEach((product) => {
                product.getCompleteObject((err, json) => {
                    if(err) {
                        callback(err);
                    }
                    p.push(json);
                });
            });

            callback(null, p);

        }, page, resultsPerPage);
    }
};