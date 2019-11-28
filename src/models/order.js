const Model = require('./model.js');

module.exports = class Order extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "Orders";
    }

    static getAllSaleStats(callback) {
        const db = require('../db/database');

        let query = "select sum(quantity) as totalUnitsSold, sum(totalCost) as totalRevenues, ((select (coalesce(sum(o1.totalCost)) * 0.03) from (select Orders.totalCost from Orders order by created asc limit 0, 10) o1) + (select (coalesce(sum(o2.totalCost),0) * 0.08) from (select Orders.totalCost from Orders order by created asc limit 10, 18446744073709551615) o2)) as commission from Orders";

        db.query(query, [], (err, results) => {
            if(err) {
                callback(err, null);
            } else {
                callback(null, results);
            }
        });
    }

    static getSalesByUser(userId, callback, dryRun = false) {
        const db = require('../db/database');

        const query = 'select * from ?? where `sellerId` = ?';
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