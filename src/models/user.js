const Model = require('./model.js');
const ShoppingCart = require('./shoppingcart.js');

module.exports = class User extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return 'Users';
    }

    static getCartItems(id, callback, dryrun=false) {
        const db = require('../db/database');

        let params = [ShoppingCart.getTable(), id];
        const query = 'select * from ?? where `userId` = ?';

        if (!dryrun) db.query(query, params, (err, results) => {
            if (err) {
                callback(err);
            } else {
                // let r = [];
                // results.forEach((row) => {
                //     r.push(new ShoppingCart(row));
                // });
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

};
