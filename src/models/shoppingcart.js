const Model = require('./model.js');

module.exports = class User extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return 'ShoppingCart';
    }

    toJson() {
        return {
            id: this.id,
            userId: this.userId,
            productId: this.productId
        }
    }


};