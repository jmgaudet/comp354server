const User = require('../models/user');
const Response = require('../api/response');

module.exports = class UserController {

    static getAllUsers(req, res) {
        try {
            User.getAll((err, users) => {
                if (err) { res.send(Response.makeResponse(false, err.toString())); }

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

                if(success) {
                    foundUser.getCompleteObject((err, json) => {
                        res.send(Response.makeResponse(success, message, json));
                    });
                } else {
                    res.send(Response.makeResponse(success, message));
                }
            });
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }


    static createUser(req, res) {
        try {
            let user = new User();
            user.password = req.body.password;
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.primaryAddress = req.body.primaryAddress;
            user.alternateAddress = req.body.alternateAddress;
            // let imageUrl = profileImageUploads;
            user.email = req.body.email;


            User.generate(user,(err, createdUser) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let success = !!createdUser;
                let message = success ? 'User created' : 'User not created';

                if (success) {
                    let json = createdUser.getCompleteObject();
                    res.send(Response.makeResponse(success, message, json));
                    createdUser.

                    // createdUser.getCompleteObject((err, json) => {
                    //     res.send(Response.makeResponse(success, message, json));
                    // });
                } else {
                    res.send(Response.makeResponse(success, message));
                }
            });

        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    //checks to see if user email and password are found and correct within the database.
    static userAuth(req, res) {
        let userString ={};
        let email = req.body.email;
        let password = req.body.password;
        try {
            User.fromEmail(email, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let success = !!user;
                let message = success ? 'User Email Found' : 'User Email Not Found';
                if(success) {
                    user.getCompleteObject((err, json) => {

                        if(user.email === email && user.password === password) {

                            res.send(Response.makeResponse(true, 'User is Authorized', json));
                        } else {
                            let userAuth = false;
                            res.send(Response.makeResponse(false,'User is Not Authorized'));
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




    
};