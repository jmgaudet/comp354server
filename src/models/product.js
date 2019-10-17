const Model = require('./model.js');

module.exports = class Product extends Model{

    constructor(dbRow){
        super(dbRow);
    }

};