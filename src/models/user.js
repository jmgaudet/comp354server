const Model = require('./model.js');
const Joi = require('@hapi/joi');
const Rating = require('./rating.js');

module.exports = class User extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return 'Users';
    }

    /**
     * Given the req of the user to be updated, checks if those arguments are valid, and, if so, creates and returns a new user object.
     * @param req - The new values for the soon-to-be updated user
     * @param profilePicUrl - The new profile pic for the soon-to-be updated user
     * @param callback - Returns 'error' if the arguments did not pass the Validation check.
     */
    static validateNewUser(req, profilePicUrl, callback) {

        const schema = Joi.object().keys({
            password: Joi.string().min(8).required(),
            repeat_password: Joi.ref('password'),
            firstName: Joi.string().pattern(/^[A-zÀ-ú\-]{2,30}$/).required(),
            lastName: Joi.string().pattern(/^[A-zÀ-ú\-]{2,30}$/).required(),
            primaryAddress: Joi.string().required(),
            alternateAddress: Joi.string(),
            email: Joi.string().email({minDomainSegments: 2, tlds: {allow: ['com', 'net']}}).required()
        });

        // Warning: Joi's validate return names are hard-coded -- do not alter "error" and "value" names.
        const {error, value} = schema.validate(req.body);

        if (error) {
            callback(error);
        } else {
            let user = new User();
            user.password = value.password;
            user.firstName = value.firstName;
            user.lastName = value.lastName;
            user.primaryAddress = value.primaryAddress;
            user.alternateAddress = value.alternateAddress;
            user.email = value.email;
            user.imageUrl = profilePicUrl;
            callback(null, user);
        }
    }

    static validateNewPassword(req, callback) {

        const schema = Joi.object().keys({
            currentPassword: Joi.string().required(),
            newPassword: Joi.string().min(8).required()
        });

        const {error, value} = schema.validate(req.body);

        if (error)
            callback(error);
        else
            callback(null, value);
    }

    static validateNewDetails(req, callback) {

        const schema = Joi.object().keys({
            firstName: Joi.string().trim().pattern(/^[A-zÀ-ú\-]{2,30}$/),
            lastName: Joi.string().trim().pattern(/^[A-zÀ-ú\-]{2,30}$/),
            primaryAddress: Joi.string().trim(),
            alternateAddress: Joi.string().trim(),
        });

        const {error, value} = schema.validate(req.body);

        if (error)
            callback(error);
        else
            callback(null, value);

    }
    static getRating(id,callback,dryrun=false) {
        const db = require('../db/database');

        let params = [Rating.getTable(), id];
        const query = 'select * from ?? where `userId` = ?';
        if (!dryrun) db.query(query, params, (err, results) => {
            if (err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });
        return db.format(query, params);
    }
    static getRatingBySeller(id,callback,dryrun=false) {
        const db = require('../db/database');

        let params = [Rating.getTable(), id];
        const query = 'select Rating.*, Users.firstName, Users.lastName from ?? JOIN Users ON Rating.userId = Users.id where `sellerId` = ? ';
        if (!dryrun) db.query(query, params, (err, results) => {
            if (err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });
        return db.format(query, params);
    }
    toJson() {
        return {
            id: this.id,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
            primaryAddress: this.primaryAddress,
            alternateAddress: this.alternateAddress,
            imageUrl: this.imageUrl,
            email: this.email,
            created: this.created,
        }
    }

}
;
