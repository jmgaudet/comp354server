const ShoppingCart = require('../models/shoppingcart');
const Order = require('../models/order');
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
                            let message = updatedItem ? `Item with productId ${productId} and quantity ${quantity} was removed from the cart` :
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


        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static createOrder(req, res) {
        try {
            const Product = require('../models/product.js');
            const User = require('../models/user.js');
            const order = new Order;
            let jsonOrderSummary = [];

            order.shippingAddress = req.body.shippingAddress;

            // Every item will be bought by the same user, so find the user before the loop:
            User.fromId(req.params.id, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, `User with id ${req.params.id} does not exist!`));
                    return;
                }
                order.buyerId = user.id;

                ShoppingCart.getCartItems(order.buyerId, (err, items) => {
                    if (err || items.length === 0) {
                        res.send(Response.makeResponse(false, `Could not get cart items`));
                        return;
                    }

                    items.forEach((item, index, array) => {

                        // Find the product:
                        Product.fromId(item.productId, (err, prod) => {

                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            // Have to recheck that the item did not run out of stock while it was sitting in the user's cart
                            if (prod.quantity < item.quantity) {
                                let message = `Check product "quantity": The quantity you are trying to order 
                                    (${item.quantity}) is greater than the product stock (${prod.quantity})`;
                                res.send(Response.makeResponse(false, message, prod));
                                return;
                            }

                            order.sellerId = prod.sellerId;
                            order.productId = prod.id;
                            order.quantity = item.quantity;
                            order.totalCost = item.quantity * prod.price;
                            order.delivered = 0;

                            order.save((err, submittedOrder) => {

                                if (err) {
                                    res.send(Response.makeResponse(false, `Error: could not place order`));
                                    return;
                                }
                                jsonOrderSummary.push(submittedOrder.toJson());

                                item.delete((err, removedItem) => {
                                    if (err) {
                                        res.send(Response.makeResponse(false, err.toString()));
                                        return;
                                    }

                                    prod.quantity = item.quantity - order.quantity;
                                    prod.save((err, updatedProduct) => {
                                        if (err) {
                                            res.send(Response.makeResponse(false, `Error: product quantity could not be updated`));
                                            return;
                                        }

                                        if (index === array.length - 1) {
                                            console.log('The last iteration!');
                                            res.send(Response.makeResponse(true, "Order placed", jsonOrderSummary));
                                        }
                                    }, true);
                                });
                            });
                        });
                    });
                });
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }


};