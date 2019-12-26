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

    static getAllSorted(callback, page = 1, max = 20, orderColumn = 'created', asc = true) {
        const db = require('../db/database');

        db.query("select count(*) as count from ??", [Order.getTable()], (err, results) => {
            if (err) {
                callback(err);
            }
            let count = results[0].count;
            let pageCount = Math.ceil(count / max);
            let start = (page - 1) * max;

            let query = `select o.*, p.name as productName, u.firstName, u.lastName
                from ?? o 
                left join ?? p on p.id = o.productId
                left join ?? u on u.id = o.buyerId
                order by ?? ${asc ? 'ASC' : 'DESC'} limit ?,?`;
            let params = [Order.getTable(), Product.getTable(), User.getTable(), orderColumn, start, max];

            db.query(query, params, (err, orders) => {
                if (err) {
                    callback(err);
                }
                callback(null, orders, pageCount);
            });
        });

    }

    static getAllSaleStats(callback) {
        const db = require('../db/database');

        let query = "select sum(quantity) as totalUnitsSold, sum(totalCost) as totalRevenues, ((select (coalesce(sum(o1.totalCost)) * 0.03) from (select Orders.totalCost from Orders order by created asc limit 0, 10) o1) + (select (coalesce(sum(o2.totalCost),0) * 0.08) from (select Orders.totalCost from Orders order by created asc limit 10, 18446744073709551615) o2)) as commission from Orders";

        db.query(query, [], (err, results) => {
            if (err) {
                callback(err, null);
            } else {
                callback(null, results);
            }
        });
    }

    static getSalesByUser(userId, callback, dryRun = false) {
        const db = require('../db/database');

        const query = `SELECT Orders.*, Users.firstName, Users.lastName, Products.name 
            FROM ?? 
            JOIN Users 
                ON Orders.buyerId = Users.id
            JOIN Products
                ON Orders.productId = Products.id
            WHERE Orders.sellerId = ?
            ORDER BY Orders.id ASC;`;

        // const query = 'select * from ?? where `sellerId` = ?';
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


    static getOrderByIDByTime(userId, time, callback, dryRun = false) {
        const db = require('../db/database');

        // const query ='select productId , quantity from ?? where `sellerId` in ? and `created` = ?';
        // const query ='select productId , quantity from ?? where `sellerId` in (?) and `created` = ?';
        const query = 'SELECT productId , quantity FROM ?? WHERE `sellerId` in (?) and `created` = ?';

        const params = [Order.getTable(), userId, time];


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


    static getUsersFromOrder(Orders, callback, dryRun = false) {
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

    static getOrderByOrderID(orderId, callback, dryRun = false) {
        const db = require('../db/database');

        const query = 'select * from ?? where `id` = ?';
        const params = [Order.getTable(), orderId];

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