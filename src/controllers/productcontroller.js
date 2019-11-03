const Product = require('../models/product');
const Category = require('../models/category');
const Manufacturer = require('../models/manufacturer');
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
            let page = req.query.page && req.query.page > 0 ? parseInt(req.query.page) : 1;
            let max = req.query.max && req.query.max > 0 ? parseInt(req.query.max) : 10;
            let sort = req.query.sort;
            let asc = req.query.asc && req.query.asc === 'true';
            let search = req.query.search ? req.query.search : '';

            Product.getAllSorted((err, products, pageCount) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, `Got page ${page}`, products, pageCount));

            }, search, page, max, sort, asc);

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

    /**
     * Get list of categories
     * @param req
     * @param res
     */
    static getAllCategories(req, res) {
        try {
            let page = req.query.page && req.query.page > 0 ? parseInt(req.query.page) : 1;
            let max = req.query.max && req.query.max > 0 ? parseInt(req.query.max) : 10;

            Category.getAll((err, categories) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, `Got page ${page}`, categories));
            }, page, max);
        } catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    /**
     * Return a single category by id
     * @param req
     * @param res
     */
    static getCategory(req, res) {
        try {
            let id = req.params.id;

            Category.fromId(id, (err, category) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, `Got category`, category));
            });
        }catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getAllManufacturers(req, res) {
        try {
            let page = req.query.page && req.query.page > 0 ? parseInt(req.query.page) : 1;
            let max = req.query.max && req.query.max > 0 ? parseInt(req.query.max) : 10;

            Manufacturer.getAll((err, categories) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, `Got page ${page}`, categories));
            }, page, max);
        } catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getManufacturer(req, res) {
        try {
            let id = req.params.id;

            Manufacturer.fromId(id, (err, category) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, `Got manufacturer`, category));
            });
        }catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    /**
     * Delete specific product
     * @param req
     * @param res
     */
    static deleteProduct(req, res) {
        try{
            let id = req.params.id;
            Product.fromId(id, (err, product) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                product.delete((err, success) => {
                    if(err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    let message = success ? 'Product deleted' : 'Product not deleted';

                    res.send(Response.makeResponse(success, message));
                    }
                )
            });
        }catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }

    }

    static makeCategoryProductLink(req, res, categoryId, product) {
        product.addCategory(categoryId, (err, success) => {
            if(err) {
                res.send(Response.makeResponse(false, err.toString()));
            } else {
                product.getCompleteObject((err, json) => {
                    res.send(Response.makeResponse(true, 'New product added', json));
                });
            }
        });
    }

    static saveProductForManufacturerId(req, res, manufacturerId, product, imageUrls) {
        product.manufacturerId = manufacturerId;
        product.save((err, p) => {
            if(err) {
                res.send(Response.makeResponse(false, err.toString()));
            } else {
                p.addImages(imageUrls, (err, success) => {
                    if(err) {
                        res.send(Response.makeResponse(false, err.toString()));
                    } else {
                        Category.search('name', req.body.category, (err, cats) => {
                            if(err) {
                                res.send(Response.makeResponse(false, err.toString()));
                            } else {
                                if(cats.length > 0) {
                                    this.makeCategoryProductLink(req, res, cats[0].id, p);
                                } else {
                                    let category = new Category();
                                    category.name = req.body.category;
                                    category.save((err, c) => {
                                        if(err) {
                                            res.send(Response.makeResponse(false, err.toString()));
                                        } else {
                                            this.makeCategoryProductLink(req, res, c.id, p);
                                        }
                                    });
                                }
                            }
                        });
                    }
                });
            }
        });
    }

    static addNewProduct(req, res, imageUrls) {
        try {
            let product = new Product();
            product.name = req.body.name;
            product.price = parseFloat(req.body.price);
            product.quantity = parseInt(req.body.quantity);
            product.sellerId = parseInt(req.body.sellerId);
            product.description = req.body.description;

            Manufacturer.search('name', req.body.manufacturer, (err, mans) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                } else {
                    if(mans.length > 0) {
                        this.saveProductForManufacturerId(req, res, mans[0].id, product, imageUrls);
                    } else {
                        let manufacturer = new Manufacturer();
                        manufacturer.name = req.body.manufacturer;
                        manufacturer.save((err, m) => {
                            if(err) {
                                res.send(Response.makeResponse(false, err.toString()));
                            } else {
                                this.saveProductForManufacturerId(req, res, m.id, product, imageUrls);
                            }
                        });
                    }
                }
            });

        } catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }
};