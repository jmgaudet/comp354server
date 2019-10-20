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
        })
    }

    getCompleteObject(callback) {
        let _this = this;
        let json = this.toJson();
        json = this.toJson();
        callback(null, json);
    }



    toJson() {
        return {
            id: this.id,
            username: this.username,
            password: this.password,
            firstName: this.firstName,
            lastName: this.lastName,
            address: this.address,
            email: this.email,
            created: this.created,
        }
    }

};
