/**
 * Documentation: https://github.com/mysqljs/mysql
 */
require('dotenv').config();
const mysql = require('mysql');
let mysqlPool = mysql.createPool({
    connectionLimit: 10,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT
});

module.exports = class Database {

    /**
     * Execute an SQL query on the connection pool
     * @param query
     * @param params - array of values when using ? placeholders in query
     * @param callback - function with (error, results, fields)
     */
    static query(query, params, callback) {
        mysqlPool.query(query, params, (err, results, fields) => {
            callback(err, results, fields);
        });
    }

    /**
     * Returns an prepared SQL statement with the given
     * values
     * @param query
     * @param params - Array of values when using ? placeholders
     * @returns {string} - The prepared statement
     */
    static format(query, params) {
        return mysql.format(query, params);
    }

};