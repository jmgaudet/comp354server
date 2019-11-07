const Model = require('./model.js');

module.exports = class Order extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "Orders";
    }

    // getUserTotal

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