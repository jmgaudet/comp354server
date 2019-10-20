const User = require('../models/user');
const Response = require('../api/response');

module.exports = class UserController {

    static getAllUsers(req, res) {
        try {
            User.getAll((err, users) => {
                if (err) { res.send(Response.makeResponse(false, e.toString())); }

                res.send(Response.makeResponse(true, 'Got users', users));
            })
        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }
    }

    static getUser(req, res) {
        let id = req.params.id;
        try {
            User.fromId(id, (err, user) => {
                if (err) {
                    res.send(Response.makeResponse(false, err.toString()));
                    return;
                }

                let success = !!user;
                let message = success ? 'User found' : 'User not found';

                if(success) {
                    user.getCompleteObject((err, json) => {
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


        } catch (e) {
            res.send(Response.makeResponse(false, e.toString()));
        }




    }
    
};