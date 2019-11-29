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
};
