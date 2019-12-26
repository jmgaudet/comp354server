const Model = require('./model.js');

module.exports = class Category extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return "Categories";
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            created: this.created
        }
    }
};