const ShoppingCart = require('../models/shoppingcart');
const Response = require('../api/response');

module.exports = class CartController {

    static getUserCart(req, res) {
        try {
            let userId = req.params.id;
            ShoppingCart.getCartItems(userId, (err, items) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let found = !!items[0]; // Returning 0 items is not an error, and "items" is always an array object, so need to be more specific
                let message = found ? 'Got shopping cart items' : 'No items in cart';

                if (found) {
                    res.send(Response.makeResponse(found, message, items));
                } else
                    res.send(Response.makeResponse(found, message));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static addToCart(req, res) {
        try {
            const Product = require('../models/product.js');
            const User = require('../models/user.js');
            let userId = req.params.id;
            let productId = req.body.productId;
            let quantity = req.body.quantity;

            // Check if the desired "quantity" is a viable amount:
            Product.fromId(productId, (err, prod) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                if (prod.quantity < quantity) {
                    let message = `Check product "quantity": The quantity you have asked for (${quantity}) is greater than the product stock (${prod.quantity})`;
                    res.send(Response.makeResponse(false, message, prod));
                    return;
                }
                // Check if the User with given userId exists:
                User.fromId(userId, (err, user) => {
                    if (err) {
                        res.send(Response.makeResponse(false, `User with id ${userId} does not exist!`));
                        return;
                    }

                    let basket = new ShoppingCart();
                    basket.userId = userId;
                    basket.productId = productId;
                    basket.quantity = parseInt(quantity);

                    ShoppingCart.itemFromIds(userId, productId, (err, foundItem) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                            return;
                        }

                        let found = !!foundItem;
                        if (found) {
                            basket.id = foundItem.id;
                            basket.quantity += parseInt(foundItem.quantity);
                        }
                        basket.save((err, item) => {
                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            let success = !!item;
                            let message = item ? `Item with productId ${productId} and quantity ${quantity} added to cart` :
                                'Item could not be added to cart';

                            res.send(Response.makeResponse(success, message, item));
                        }, found);  // <-- If fromId() returned an existing item in this customer's cart, then update=True
                    });
                });
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static deleteFromCart(req, res) {
        try {
            let userId = req.params.id;
            let productId = req.body.productId;
            let quantity = req.body.quantity;

            ShoppingCart.itemFromIds(userId, productId, (err, item) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                let found = !!item;
                if (found) {
                    if (quantity < item.quantity) {
                        item.quantity = parseInt(item.quantity) - parseInt(quantity);
                        item.save((err, updatedItem) => {
                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            let success = !!updatedItem;
                            let message = success ? `Item with productId ${productId} and quantity ${quantity} was removed from the cart` :
                                'Item could not be removed from cart';

                            res.send(Response.makeResponse(success, message, updatedItem));
                        }, true);
                    } else {
                        item.delete((err, removedItem) => {
                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            let success = !!removedItem;
                            let message = success ? `All items with productId ${productId} were removed from the cart` :
                                'Item was not removed from cart';
                            res.send(Response.makeResponse(success, message));
                        });
                    }
                } else {
                    let message = `Item with productId ${productId} was not located in shopping cart`;
                    res.send(Response.makeResponse(false, message));
                    return;
                }
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateQuantity(req, res) {
        try {
            let userId = req.params.id;
            let quantity = req.body.quantity;
            let productId = req.body.productId;



        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }


};