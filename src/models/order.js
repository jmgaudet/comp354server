const Model = require('./model.js');

module.exports = class Order extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "Orders";
    }

    static getOrderByUser(userId, callback, dryRun = false) {
        const db = require('../db/database');

        const query = 'select * from ?? where `buyerId` = ?';
        const params = [Order.getTable(), userId];

        if (!dryRun) db.query(query, params, (err, results) => {
            if (err) {
                callback(err, null);
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

    // getUserTotalOnDate

    // getTotalForWholeWebsite

    toJson() {
        return {
            id: this.id,
            buyerId: this.buyerId,
            sellerId: this.sellerId,
            productId: this.productId,
            shippingAddress: this.shippingAddress,
            quantity: this.quantity,
            totalCost: this.totalCost,
            delivered: this.delivered,
            created: this.created
        }
    }


};