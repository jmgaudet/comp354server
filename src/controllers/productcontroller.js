const Product = require('../models/product');
const Response = require('../api/response');

/**
 * This class encapsulates all the logic of
 * product API functions
 * @type {ProductController}
 */
module.exports = class ProductController {

    /**
     * Return all products by page
     * @param req
     * @param res
     */
    static getAllProducts(req, res) {
        try{
            let page = req.query.page ? req.query.page : 1;
            let max = req.query.max ? req.query.max : 10;

            Product.getAll((err, products) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                }

                let p = [];
                products.forEach((product) => {
                    product.getCompleteObject((err, json) => {
                        if(err) {
                            res.send(Response.makeResponse(false, err.toString()));
                        }
                        p.push(json);
                    });
                });

                res.send(Response.makeResponse(true, `Got page ${page}`, products));

            }, page, max);

        }catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }

    }

    static getProduct(req, res) {
        try {
            let id = req.params.id;
            Product.fromId(id, (err, product) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                }
                let success = !!product;
                let message = success ? 'Product found' : 'Product not found';
                res.send(Response.makeResponse(success, message, product))
            });
        } catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }
};