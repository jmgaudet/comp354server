const User = require('../models/user');
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
            User.validateNewUser(req, profilePicUrl, (err, validUser) => {
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

    static updateUserPassword(req, res) {
        try {
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
                    foundUser.password = value.password;
                    foundUser.save((err, updated) => {
                        if (err) {
                            res.send(Response.makeResponse(false, err.toString()));
                            return;
                        }
                        let success = !!updated;
                        let message = success ? 'User password updated' : 'User password not updated';

                        res.send(Response.makeResponse(success, message, updated));
                    }, true);
                });
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static updateUserDetails(req, res, profilePicUrl) {
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
                foundUser.imageURL = profilePicUrl;
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

    static getRating(req, res) {
        try {
            let id = req.params.id;
            User.getRating(id, (err, reviews) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let found = !!reviews;
                let message = found ? 'Received reviews' : 'No reviews yet';

                if (found) {
                    res.send(Response.makeResponse(found, message, reviews));
                }
                else
                    res.send(Response.makeResponse(found, message));
            })
        } catch (e) {

            res.send(Response.makeResponse(false, e.toString()));
        }
    }



};