const assert = require('assert');
const expect = require('chai').expect;
const Model = require('../src/models/model');

describe('Model', function() {
    describe('Extending the Model class', function() {
        it('should throw an error if getTable() is not overwritten', function(done) {

            class Example extends Model {
                constructor(dbRow){
                    super(dbRow);
                }
            };

            try {
                Example.fromId(0, (err, res) => {
                    if(res) {
                        assert(false);
                    }
                    done();
                });
            }catch(error) {
                assert(true);
                done();
            }
        });

        it('should throw an error if toJson is not overwritten', function(done) {

            class Example extends Model {
                constructor(dbRow){
                    super(dbRow);
                }

                static getTable() {
                    return "example";
                }
            };

            let ex = new Example();

            try {
                ex.save((err, res) => {
                    if(res) {
                        assert(false);
                    }
                    done(err);
                });
            } catch(error) {
                assert(true);
                done();
            }
        });

        it('Should not throw any errors when methods are overwritten', function(done) {

            class Example extends Model {
                constructor(dbRow){
                    super(dbRow);
                }

                static getTable() {
                    return "example";
                }

                toJson() {
                    return {
                        id: this.id,
                        created: this.created
                    }
                }
            };

            let sql = Example.fromId(0, (err, e) => {
                if(e) {
                    assert(false);
                }
                done(err);
            }, true);

            assert(sql);

            let ex = new Example();
            sql = ex.save((err, res) => {

            }, false, true);

            assert(sql);

            done();
        });

    });
    describe('Normal uses for extending the Model class', () => {

        //Here's a mock object.
        //A Foo object reflects a row in the "foo" table in the DB
        class Foo extends Model {
            constructor(dbRow){
                super(dbRow);
            }

            static getTable() {
                return "foo";
            }

            toJson() {
                return {
                    id: this.id,
                    bar: this.bar,
                    bazz: this.bazz,
                    created: this.created
                }
            }
        };

        it('Should automatically do CRUD for any table', () => {

            let foo = new Foo();
            foo.bar = 'bar';
            foo.bazz = 1999;

            let sql = foo.save(null, false, true);
            assert.strictEqual(sql, "insert ignore into `foo` set `bar` = 'bar', `bazz` = 1999");

            foo.bar = 'foobar';

            sql = foo.save(null, true, true);
            assert.strictEqual(sql, "update `foo` set `bar` = 'foobar', `bazz` = 1999 where `id` = 0");

            sql = Foo.fromId(0, null, true);
            assert.strictEqual(sql, "select * from `foo` where `id` = 0");

            sql = foo.delete(null, true);
            assert.strictEqual(sql, "delete from `foo` where `id` = 0");

        });

        it('Should automatically instanciate all properties from a DB row', () => {

            let now = new Date();

            let mockDbRow = {
                id: 1,
                bar: "bar",
                bazz: "bazz",
                created: now
            };

            class Foo extends Model {
                constructor(dbRow){
                    super(dbRow);
                }

                static getTable() {
                    return "foo";
                }

                toJson() {
                    return {
                        id: this.id,
                        bar: this.bar,
                        bazz: this.bazz,
                        created: this.created
                    }
                }
            };

            let foo = new Foo(mockDbRow);

            assert.strictEqual(foo.id, 1);
            assert.strictEqual(foo.bar, "bar");
            assert.strictEqual(foo.bazz, "bazz");
            assert.strictEqual(foo.created, now);

        });

        it('Should return all products with pagination', () => {

            class Foo extends Model {
                constructor(dbRow){
                    super(dbRow);
                }

                static getTable() {
                    return "foo";
                }

                toJson() {
                    return {
                        id: this.id,
                        bar: this.bar,
                        bazz: this.bazz,
                        created: this.created
                    }
                }
            };

            let sql = Foo.getAll(null, 4, 15, true);
            assert.strictEqual(sql, "select * from `foo` limit 45,15");
        })
    });
});