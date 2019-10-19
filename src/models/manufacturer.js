const Model = require('./model.js');

module.exports = class Manufacturer extends Model {

    constructor(dbRow){
        super(dbRow);
    }

    static getTable() {
        return "Manufacturers";
    }

    toJson() {
        return {
            id: this.id,
            name: this.name,
            created: this.created
        }
    }
};