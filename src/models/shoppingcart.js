const Model = require('./model.js');

module.exports = class ShoppingCart extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "ShoppingCart";
    }

    /*
    A ShoppingCart item needs 2 (not 1) IDs to be found: a userId and a productId.
     */
    static itemFromIds(userId, productId, callback, dryRun = false) {
        const db = require('../db/database');

        const query = 'select * from ?? where `userId` = ? and `productId` = ?';
        const params = [ShoppingCart.getTable(), userId, productId];

        if (!dryRun) db.query(query, params, (err, res) => {
            if (err) {
                callback(err, null);
            } else {
                if (res[0]) {
                    let model = new this(res[0]);
                    callback(null, model);
                } else {
                    callback(null, null);
                }
            }
        });

        return db.format(query, params);
    }

    static getCartItems(userId, callback, dryrun = false) {
        const db = require('../db/database');

        const query = 'select * from ?? where `userId` = ?';
        let params = [ShoppingCart.getTable(), userId];

        if (!dryrun) db.query(query, params, (err, results) => {
            if (err) {
                callback(err);
            } else {
                let r = [];
                results.forEach((obj) => {
                    let model = new this(obj);
                    r.push(model);
                });
                callback(null, r);
            }
        });
        return db.format(query, params);
    }

    toJson() {
        return {
            id: this.id,
            userId: this.userId,
            productId: this.productId,
            quantity: this.quantity,
            created: this.created
        }
    }


};