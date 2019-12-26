const Model = require('./model.js');

module.exports = class ProductImage extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "ProductsImages";
    }

    toJson() {
        return {
            id: this.id,
            productId: this.productId,
            url: this.url,
            created: this.created
        }
    }
};