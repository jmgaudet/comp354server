const Model = require('./model.js');

module.exports = class Rating extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "Rating";
    }

    toJson() {
        return {
            id: this.id,
            userId: this.userId,
            sellerId: this.sellerId,
            created: this.created,
            rate: this.rate,
            text: this.text,
            sellerText: this.sellerText
        }
    }

    // static getRatingById(id,callback,dryrun=false) {
    //     const db = require('../db/database');

    //     let params = [Rating.getTable(), id];
    //     const query = 'select * from ?? where `id` = ?';
    //     if (!dryrun) db.query(query, params, (err, results) => {
    //         if (err) {
    //             callback(err);
    //         } else {
    //             callback(null, results);
    //         }
    //     });
    //     return db.format(query, params);
    // }
};
