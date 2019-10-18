/**
 * This Model superclass should be extended by other
 * models that refer to a table in the database. By extending
 * this class in all models, it serves as a central point for
 * adding queries that are common to any table. See unit tests
 * for example usage.
 *
 * When extending
 * this class, initialize the table's columns in the constructor
 * and override the two methods:
 *
 * static getTable()
 * toJson()
 * @type {Model}
 */

module.exports = class Model {

    constructor(dbRow) {
        if(dbRow) {
            let _this = this;
            Object.keys(dbRow).forEach(function(key) {
                _this[key] = dbRow[key];
            });
        } else {
            this.id = 0;
            this.created = new Date();
        }

        this.db = require('../db/database');
    }

    static getClassName() {
        return this.prototype.constructor.name;
    }

    /**
     * Returns the name of the corresponding database table for this model.
     * This method MUST be overwritten by the child class.
     */
    static getTable() {
        throw new Error(`Did not override static getTable() for the model ${this.getClassName()}.`)
    }

    /**
     * Asynchronously retrieves an object of this type from the
     * database by ID
     * @param id - The primary key of object to retrieve
     * @param callback - Function to be called on execution
     * @param dryRun - If true, will not actually execute, only return a statement
     * @returns {string} - The prepared SQL statement
     */
    static fromId(id, callback, dryRun = false) {
        const db = require('../db/database');

        const query = 'select * from ?? where `id` = ?';
        const params = [this.getTable(), id];

        if(!dryRun) db.query(query, params, (err, res) => {
            if(err) {
                callback(err,null);
            } else {
                let model = new this(res[0]);
                callback(null, model);
            }
        });

        return db.format(query, params);
    }

    /**
     * Deletes the current instance of this object from the database
     * @param callback - Function to be called on execution
     * @param dryRun - If true, will not actually execute, only return a statement
     */
    delete(callback, dryRun = false) {
        const query = 'delete from ?? where `id` = ?';
        let params = [this.constructor.getTable(), this.id];

        if(!dryRun) this.db.query(query, params, (err, results) => {
            if(err) {
                callback(err);
            } else {
                callback(null, true);
            }
        });

        return this.db.format(query, params);
    }

    /**
     * Inserts or updates the current object instance to the database.
     * @param callback - Function to be called on execution
     * @param update - If true, will use the id property to update the table
     * @param druRun - If true, will not actually execute the query, just return an SQL string
     * @returns {string} - The prepared SQL statement
     */
    save(callback, update = false, druRun = false) {
        const json = this.toJson();
        delete json.created;
        delete json.id;

        let params = update ? [this.constructor.getTable(), json, this.id] : [this.constructor.getTable(), json];

        const query = update ? 'update ?? set ? where `id` = ?' : 'insert ignore into ?? set ?';

        if(!druRun) this.db.query(query, params, (err, results) => {
            if(err) {
                callback(err);
            } else {
                callback(null, results);
            }
        });

        return this.db.format(query, params);
    }

    /**
     * Returns a JSON object with the properties of this object as
     * they correspond to it's database table.
     * This method MUST be overwritten by the child class
     */
    toJson() {
        throw new Error(`Did not override toJson() in the model ${this.constructor.getClassName()}`);
    }

    toString() {
        return JSON.stringify(this.toJson());
    }
};