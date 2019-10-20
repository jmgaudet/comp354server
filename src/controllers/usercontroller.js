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
        try {
            User.fromId((err, user) => {
                if (err) { res.send(Response.makeResponse(false, e.toString())); }

                res.send(Response.makeResponse(true, 'Got user', user))
            })
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