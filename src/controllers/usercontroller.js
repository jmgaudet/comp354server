const User = require('../models/user');
const ShoppingCart = require('../models/shoppingcart');
const Response = require('../api/response');
const Joi = require('@hapi/joi');

module.exports = class UserController {

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

                if(success)
                    res.send(Response.makeResponse(success, message, foundUser));
                else
                    res.send(Response.makeResponse(success, message));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static addNewUser(req, res, profilePicUrls) {
        try {
            const schema = Joi.object({
                password: Joi.string().pattern(/^[a-zA-Z0-9]{8,30}$/),
                repeat_pass: Joi.ref('pass'),
                firstName: Joi.string().min(2).required(),
                lastName: Joi.string().min(2).required(),
                primaryAddress: Joi.string().required(),
                alternateAddress: Joi.string(),
                email: Joi.string().email({ minDomainSegments: 2, tlds: { allow: ['com', 'net'] } })
            });

            const { error, valid } = schema.validate({ password: req.body.password,
                                                        firstName: req.body.firstName,
                                                        lastName: req.body.lastName,
                                                        primaryAddress: req.body.primaryAddress,
                                                        alternateAddress: req.body.alternateAddress,
                                                        email: req.body.email });

            if (error != null) {
                res.status(400).send(Response.makeResponse(false, error.details[0].message));
                return;
            }

            let user = new User();
            user.password = req.body.password;
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.primaryAddress = req.body.primaryAddress;
            user.alternateAddress = req.body.alternateAddress;
            user.imageUrl = profilePicUrls;
            user.email = req.body.email;

            user.save((err, generated) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }
                let success = !!generated;
                let message = success ? 'User created' : 'User not created';
                res.send(Response.makeResponse(success, message, generated));
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateUser(req, res) {
        try {

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

                if(success) {


                        if(foundUser.email === email && foundUser.password === password) {

                            res.send(Response.makeResponse(true, 'User is Authorized', foundUser));
                        } else {

                            res.send(Response.makeResponse(false,'User is Not Authorized'));
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