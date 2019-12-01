const Model = require('./model.js');
const Product = require('./product.js');
const User = require('./user.js');

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



    static getOrderByIDByTime(userId,time, callback, dryRun = false) {
        const db = require('../db/database');

        // const query ='select productId , quantity from ?? where `sellerId` in ? and `created` = ?';
        // const query ='select productId , quantity from ?? where `sellerId` in (?) and `created` = ?';
        const query ='SELECT productId , quantity FROM ?? WHERE `sellerId` in (?) and `created` = ?';

        const params = [Order.getTable(), userId,time];


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


    static getUsersFromOrder(Orders, callback,dryRun = false) {
        const db = require('../db/database');


       const query = 'SELECT Products.name ,Products.price , Users.firstName, Users.lastName  , Users.email FROM Products LEFT JOIN Users ON Users.id = Products.sellerId WHERE Products.id in (?)';
       // const query = 'SELECT name, price, firstName, lastName, email FROM ?? LEFT JOIN ?? ON Users.id = Products.sellerId WHERE `id` in (?)';

        const params = [Orders];


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