require('dotenv').config();
const User = require('../models/user');
const Order = require('../models/order');
const Response = require('../api/response');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sparkPostTransport = require('nodemailer-sparkpost-transport');


module.exports = class UserController {

    static getAdminStats(req, res) {
        try {
            Order.getAllSaleStats((err, stats) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                } else {
                    res.send(Response.makeResponse(true, "Got admin stats", stats));
                }
            });
        }catch(e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getSellerStats(req, res) {
        try {
            let userId = req.params.id;

            Order.getSalesByUser(userId, (err, orders) => {
                if(err) {
                    res.send(Response.makeResponse(false, err.toString()));
                } else {
                    let totalSold = 0;
                    let totalRevenue = 0;

                    orders.forEach((order) => {
                        totalSold += order.quantity;
                        totalRevenue += order.totalCost;
                    });

                    let stats = {
                        totalUnits: totalSold,
                        totalRevenue: totalRevenue
                    };

                    res.send(Response.makeResponse(true, "Got sale stats", stats));
                }
            });
        }catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

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
            User.validateNewUser(req, profilePicUrl, (err, validUser) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                bcrypt.hash(validUser.password, 10, (err, hash) => {
                    validUser.password = hash;
                    validUser.save((err, createdUser) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                            return;
                        }
                        let success = !!createdUser;
                        let message = success ? 'User created' : 'User not created';
                        res.send(Response.makeResponse(success, message, createdUser));
                    });
                });
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateUserPassword(req, res) {
        try {
            let currentPassword = req.body.currentPassword;
            let newPassword = req.body.newPassword;
            User.validateNewPassword(req, (err, value) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                User.fromId(req.params.id, (err, foundUser) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    bcrypt.compare(value.currentPassword, foundUser.password, function (err, res1) {
                        if (res1) {
                            bcrypt.hash(value.newPassword, 10, (err, hashedNewPassword) => {
                                if (err)
                                    res.send(Response.makeResponse(false, err.toString()));
                                else {
                                    foundUser.password = hashedNewPassword;
                                    foundUser.save((err, updated) => {
                                        if (err) {
                                            res.send(Response.makeResponse(false, err.toString()));
                                            return;
                                        }
                                        let success = !!updated;
                                        let message = success ? 'User password updated' : 'User password not updated';

                                        res.send(Response.makeResponse(success, message, updated));
                                    }, true);
                                }
                            });
                        } else {
                            res.send(Response.makeResponse(false, `"currentPassword" does not match database.`));
                        }
                    });
                    foundUser.password = value.password;
                });
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateUserDetails(req, res) {
        try {
            User.validateNewDetails(req, (err, value) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                User.fromId(req.params.id, (err, foundUser) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    // Loops thru whatever 4 values the user submitted for update
                    for (let key of Object.keys(value))
                        foundUser[key] = value[key];

                    foundUser.save((err, updated) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                            return;
                        }
                        let success = !!updated;
                        let message = success ? 'User details updated' : 'User details not updated';

                        res.send(Response.makeResponse(success, message, updated));
                    }, true);
                });
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateUserProfileImage(req, res, profilePicUrl) {
        try {
            User.fromId(req.params.id, (err, foundUser) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                foundUser.imageUrl = profilePicUrl;
                foundUser.save((err, updated) => {
                    if (err) {
                        res.send(Response.makeResponse(false, err.toString()));
                        return;
                    }
                    let success = !!updated;
                    let message = success ? 'User profile image updated' : 'User profile image not updated';

                    res.send(Response.makeResponse(success, message, updated));
                }, true);
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


    //checks to see if user email and password are found and correct within the database.
    static userAuth(req, res) {

        //grabs email and password from body
        let email = req.body.email;
        let passwordNonHash = req.body.password;

        //looks up user info from email
        try {
            User.fromEmail(email, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                //if found then store all user info in foundUser
                let foundUser = user.toJson();
                let success = !!user;
                let message = success ? 'User Email Found' : 'User Email Not Found';


                //if found then compare the password entered to whats stored using bcrypt's compare method.
                if (success) {
                    bcrypt.compare(passwordNonHash, foundUser.password, function (err, res1) {
                        if (res1) {
                            res.send(Response.makeResponse(true, 'User is Authorized', foundUser));
                        } else {
                            res.send(Response.makeResponse(false, 'User is Not Authorized'));
                        }
                    });

                } else {
                    res.send(Response.makeResponse(success, message));
                }
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }

    }

    static getRating(req, res) {
        try {
            let id = req.params.id;
            User.getRating(id, (err, reviews) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                let message = '';
                if (reviews[0] == undefined) {
                    message = 'No reviews yet';
                    reviews = [{'rate': 'N/A'}]
                } else {
                    message = 'Received reviews';

                }
                res.send(Response.makeResponse(true, message, reviews));
            })
        } catch (e) {

            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getRatingBySeller(req, res) {
        try {
            let id = req.params.id;
            User.getRatingBySeller(id, (err, reviews) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                let message = '';
                if (reviews[0] == undefined) {
                    message = 'No reviews yet';
                    reviews = [{'rate': 'N/A'}]
                } else {
                    message = 'Received reviews';

                }

                res.send(Response.makeResponse(true, message, reviews));
            })
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
                if (user.email === email) {
                    //Create a new 10 character password from a set of symbols
                    let newPassW = '';
                    let listOfChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_*$%&#!.,[]{}();?<>';
                    let charactersLength = listOfChars.length;
                    for (let i = 0; i < 10; i++) {
                        newPassW = newPassW.concat(listOfChars.charAt(Math.floor(Math.random() * charactersLength)));
                    }

                    //Encrypt the generated password to store in the database
                    let encryptedNewPassW;
                    bcrypt.hash(newPassW, 10, (err, hash) => {
                        if (err)
                            res.send(Response.makeResponse(false, err.toString()));
                        else {
                            encryptedNewPassW = hash;
                            user.password = encryptedNewPassW;
                            user.save((err, user) => {
                                if (err)
                                    res.send(Response.makeResponse(false, err.toString()));
                                else {
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
                    res.send(Response.makeResponse(false, 'User password change was not done'));
                }
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

//sends a thank you / welcome
    static signUpEmail(req,res) {
        let email = req.body.email;
        try {
            User.fromEmail(email, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));

                    return;
                }else
                //Check email matches in the database
                if (user.email === email) {
                    let foundUser = user.toJson();
                    let name = foundUser.firstName
                    let lastname = foundUser.lastName


                    const transporter = nodemailer.createTransport(sparkPostTransport({
                        sparkPostApiKey: process.env.SPARKPOST_API_KEY
                    }));
                    //Create email to the newly signed up user
                    let WelcomeMail = {
                        from: 'no-reply@allanpichardo.com',
                        to: '354testerlinda@gmail.com', //TODO: this is a temporary testing email account to receive the forgot password emails
                        //to: email,               //TODO: once users have actual associated emails, we could use this
                        subject: 'Thank You For Signing Up To 354TheStars Website',
                        html: 'Welcome, ' + name  +' '+ lastname +'<br></br><br>Thank You For Registering!! </br>' +
                            'Enjoy Your Shopping Experience.<br></br><br></br>' +
                            'Best,<br></br>354TheStars Team'
                    };
                    //Send created email to user via nodemailer's transporter
                    transporter.sendMail(WelcomeMail, function (err, info) {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                        } else {
                            res.send(Response.makeResponse(true, 'User welcome email was successfully sent'));
                        }
                    });

                } else {    //send if the user welcome email was not sent
                    res.send(Response.makeResponse(false, 'User welcome email not sent'));
                }
            });
        }
        catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }

    }

};