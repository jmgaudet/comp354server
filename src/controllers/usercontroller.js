require('dotenv').config();
const User = require('../models/user');
const ShoppingCart = require('../models/shoppingcart');
const Response = require('../api/response');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sparkPostTransport = require('nodemailer-sparkpost-transport');


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

    static getUserCart(req, res) {
        try {
            let userId = req.params.id;
            ShoppingCart.getCartItems(userId, (err, items) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let found = !!items;
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

    static addToCart(req, res) {
        try {
            const Product = require('../models/product');   // Not sure if this is the best way... But I need to get a Product's quantity
            let userId = req.params.userId;
            let productId = req.body.productId;
            let quantity = req.body.quantity;

            // Check if the desired "quantity" is a viable amount
            Product.fromId(productId, (err, prod) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                if (prod.quantity < quantity) {
                    let message = `Check product "quantity": The quantity you have asked for is greater than the product stock: ${prod.quantity}`;
                    res.send(Response.makeResponse(false, message, prod));
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
                        let message = item ? `Item with productId #${productId} and quantity ${quantity} added to cart` : 'Item could not be added to cart';

                        res.send(Response.makeResponse(success, message));
                    }, found);  // <-- If fromId() returned an existing item in this customer's cart, then update=True
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
                    }
                    else {
                        item.delete((err, removedItem) => {
                            if (err) {
                                res.send(Response.makeResponse(false, err.toString()));
                                return;
                            }
                            let success = !!removedItem;
                            let message = success ? `All items with productId ${productId} were removed from the cart` : 'Item was not removed from cart';
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

    //Sends a new temporary password by email to a client who requests a forgot password
    static passReset(req, res) {
        let email = req.body.email;
        try {
                    //Check for matching email
                    User.fromEmail(email, (err, user) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                            return;
                        }
                        //Check email matches in the database
                        if(user.email === email) {
                            //Create a new 10 character password from a set of symbols
                            let newPassW = '';
                            let listOfChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_*$%&#!.,[]{}();?<>';
                            let charactersLength = listOfChars.length;
                            for ( let i = 0; i < 10; i++ ) {
                                newPassW = newPassW.concat(listOfChars.charAt(Math.floor(Math.random() * charactersLength)));
                            }

                            //Encrypt the generated password to store in the database
                            let encryptedNewPassW;
                            bcrypt.hash(newPassW, 10, (err, hash) => {
                                if(err)
                                    res.send(Response.makeResponse(false, err.toString()));
                                else{
                                    encryptedNewPassW = hash;
                                    user.password = encryptedNewPassW;
                                    user.save((err, user) => {
                                        if (err)
                                            res.send(Response.makeResponse(false, err.toString()));
                                        else
                                        {
                                            const transporter = nodemailer.createTransport(sparkPostTransport({
                                                sparkPostApiKey: process.env.SPARKPOST_API_KEY
                                            }));
                                            //Create email to user with new temporary password
                                            let sendingNewPassWMail = {
                                                from: 'no-reply@allanpichardo.com',
                                                to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
                                                //to: user.email,               //TODO: once users have actual associated emails, we could use this
                                                subject: 'New Temporary Password for 354TheStars Website',
                                                html: 'Hello,<br></br><br>Here is your new password: </br>' +
                                                    newPassW + '<br></br><br></br>' +
                                                    'Please make sure to change it once you login with this password.<br></br><br></br>' +
                                                    'Thank you,<br></br><br></br>354TheStars Team'
                                            };
                                            //Send created email to user via nodemailer's transporter
                                            transporter.sendMail(sendingNewPassWMail, function (err, info) {
                                                if (err) {
                                                    res.send(Response.makeResponse(false, err.toString()));
                                                } else {
                                                    res.send(Response.makeResponse(true, 'User new password email was successfully sent'));
                                                }
                                            });
                                        }
                                    }, true);
                                }
                            });
                        } else {    //Enter if password change was not successful due to incorrect email
                            res.send(Response.makeResponse(false,'User password change was not done'));
                        }
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

};