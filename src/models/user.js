const Model = require('./model.js');

module.exports = class User extends Model {

    constructor(dbRow) {
        super(dbRow);
    }

    static getTable() {
        return 'Users';
    }

    static getAll(callback) {
        const db = require('../db/database');

        db.query('SELECT * FROM Users', [User.getTable()], (err, results) => {
            if (err) {
                callback(err);
            }
            callback(null, results);
        });
    }

    /**
     * Add multiple images to this product
     * @param profilePicUrls
     * @param callback
     */
    addImages(profilePicUrls, callback) {
        let query = 'INSERT INTO ProductsImages (productId, url) VALUES ';
        let params = [];
        let placeholders = [];
        profilePicUrls.forEach((url) => {
            placeholders.push('(?,?)');
            params.push(this.id);
            params.push(url);
        });
        query += placeholders.join(',');
        this.db.query(query, params, (err, results) => {
            if(err) {
                callback(err);
            } else {
                callback(null, true);
            }
        })
    }

    getCompleteObject() {
        return this.toJson();
    }

    toJson() {
        return {
            id: this.id,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
            primaryAddress: this.primaryAddress,
            alternateAddress: this.alternateAddress,
            imageUrl: this.imageUrl,
            email: this.email,
            created: this.created,
        }
    }

};
