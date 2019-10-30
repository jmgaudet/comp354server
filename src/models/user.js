const Model = require('./model.js');
const ShoppingCart = require('./shoppingcart.js');
const Validation = require('../api/validation');

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
    static authenticate(req, profilePicUrl, callback) {

        // WARNING: Joi's validation return names are hard-coded.
        //          Do not change the variable names "error" and "value".
        const {error, value} = Validation.checkIfValid(req);

        if (error) {
            callback(error);
        } else {
            let user = new User();
            user.password = req.body.password;
            user.firstName = req.body.firstName;
            user.lastName = req.body.lastName;
            user.primaryAddress = req.body.primaryAddress;
            user.alternateAddress = req.body.alternateAddress;
            user.imageUrl = profilePicUrl;
            user.email = req.body.email;
            callback(null, user);
        }
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

};
