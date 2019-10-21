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

    static generate(newUser, callback) {
        const db = require('../db/database');

        let query = `INSERT INTO Users(password, firstName, lastName, primaryAddress, alternateAddress, imageUrl, email, created) 
                    VALUES ('${newUser.password}', '${newUser.firstName}', '${newUser.lastName}', '${newUser.primaryAddress}', 
                    '${newUser.alternateAddress}', 'blank', '${newUser.email}', current_timestamp);`;
        let params = [this.getTable()];

        db.query(query, params, (err, generated) => {
            if (err) {
                callback(err);
            }
            callback(null, generated);
        });
    }

    getCompleteObject() {
        // let json;
        // json = this.toJson();
        // callback(null, json);
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
