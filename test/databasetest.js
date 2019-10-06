const assert = require('assert');
const Database = require('../src/db/database');

describe('Database', function() {
    describe('query', function() {
        it('should return one result with value 2', function(done) {
            Database.query('select 1 + 1 as col', null, (err, results) => {
                if(err) {
                    done(err);
                }
                assert.notStrictEqual(results.length, 0);
                assert.strictEqual(2, results[0].col);
                done();
            });
        });
    });
});