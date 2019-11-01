const User = require('../models/user');
const ShoppingCart = require('../models/shoppingcart');
const Response = require('../api/response');

module.exports = class UserController {

    /**
     * Returns all users currently in the database
     * @param req
     * @param res
     */
    static getAllUsers(req, res) {
        try {
            User.getAll((err, users) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                res.send(Response.makeResponse(true, 'Got users', users));
            })
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    /**
     * Given an ID, will return the user if found in the database.
     * @param req
     * @param res
     */
    static getUser(req, res) {
        try {
            let id = req.params.id;
            User.fromId(id, (err, foundUser) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let success = !!foundUser;
                let message = success ? 'User found' : 'User not found';

                if (success)
                    res.send(Response.makeResponse(success, message, foundUser));
                else
                    res.send(Response.makeResponse(success, message));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static addNewUser(req, res, profilePicUrl) {
        try {
            User.authenticate(req, profilePicUrl, (err, validUser) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                validUser.save((err, updated) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    let success = !!updated;
                    let message = success ? 'User created' : 'User not created';
                    res.send(Response.makeResponse(success, message, updated));
                });
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateUser(req, res, profilePicUrl) {
        try {
            User.authenticate(req, profilePicUrl, (err, validUser) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                validUser.id = req.params.id;
                validUser.save((err, updated) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    let success = !!updated;
                    let message = success ? 'User updated' : 'User not updated';

                    res.send(Response.makeResponse(success, message, updated));

                }, true);   // Must be set to 'true', as this is an update

            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static deleteUser(req, res) {
        try {
            let id = req.params.id;
            User.fromId(id, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                user.delete((err, deletedUser) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    let success = !!deletedUser;
                    let message = success ? 'User deleted' : 'User not deleted';
                    res.send(Response.makeResponse(success, message));
                })
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getUserCart(req, res) {
        try {
            let userId = req.params.userId;
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
            let userId = req.params.userId;
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

                    ShoppingCart.itemFromId(userId, productId, (err, foundItem) => {
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
            let userId = req.params.userId;
            let productId = req.body.productId;
            let quantity = req.body.quantity;

            ShoppingCart.itemFromId(userId, productId, (err, item) => {
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


    //checks to see if user email and password are found and correct within the database.
    static userAuth(req, res) {

        let email = req.body.email;
        let password = req.body.password;
        try {
            User.fromEmail(email, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                let foundUser = user.toJson();
                let success = !!user;
                let message = success ? 'User Email Found' : 'User Email Not Found';

                if (success) {
                    if (foundUser.email === email && foundUser.password === password) {
                        res.send(Response.makeResponse(true, 'User is Authorized', foundUser));
                    } else {
                        res.send(Response.makeResponse(false, 'User is Not Authorized'));
                    }
                } else {
                    res.send(Response.makeResponse(success, message));
                }
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }

    }


};