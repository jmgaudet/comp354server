const Product = require('../models/product');
const Category = require('../models/category');
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

            Product.getAllSorted((err, products, pageCount) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, `Got page ${page}`, products, pageCount));

            }, page, max);

        }catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }

    }

    /**
     * Return a single product by ID
     * @param req
     * @param res
     */
    static getProduct(req, res) {
        try {
            let id = req.params.id;
            Product.fromId(id, (err, product) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let success = !!product;
                // let success = product != null ? true : false;
                let message = success ? 'Product found' : 'Product not found';

                if(success) {
                    product.getCompleteObject((err, json) => {
                        res.send(Response.makeResponse(success, message, json));
                    });
                } else {
                    res.send(Response.makeResponse(success, message));
                }
            });
        } catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getAllCategories(req, res) {
        try {
            Category.getAll((err, categories) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, 'Got all categories', categories));
            });
        } catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }
};