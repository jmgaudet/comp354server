const Order = require('../models/order');
const Response = require('../api/response');

module.exports = class OrderController {

    static createOrder(req, res) {
        try {
            const ShoppingCart = require('../models/shoppingcart');
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
                                            // console.log('The last iteration!');
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

    static getUserOrders(req, res) {
        try {
            let userId = req.params.id;
            Order.getOrderByUser(userId, (err, orders) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                let success = !!orders[0];  // orders is always an array -- have to be more specific
                let message = success ? `Got user's orders with user id ${userId}` : `Could not get user's orders`;
                res.send(Response.makeResponse(success, message, orders));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }


};