const assert = require('assert');
const Product = require('../src/models/product');
const Database = require('../src/db/database.js');
const Category = require('../src/models/category.js');
const Manufacturer = require('../src/models/manufacturer.js');
const ProductImage = require('../src/models/productimage.js');

describe('Product', () => {

    let now = new Date();

    const mockProductResults = [
        {
            id: 1,
            name: 'Fender Jaguar - Used - Good Condition',
            price: 749.99,
            quantity: 1,
            sellerId: 88,
            manufacturerId: 77,
            description: 'A 1996 Fender Jaguar with some scratches but all electronics are good and the neck is straight.',
            created: now
        }
    ];

    const mockCategoriesResults = [
        {
            id: 55,
            name: 'Musical Instruments',
            created: now
        },
        {
            id: 56,
            name: 'Guitars',
            created: now
        }
    ];

    const mockManufacturerResults = [
        {
            id: 77,
            name: 'Fender',
            created: now
        }
    ];

    const mockProductImageResults = [
        {
            id: 23,
            productId: 1,
            url: 'https://stuff.fendergarage.com/images/g/k/E/fcwm-products-electric-guitars-jaguar-01-hero-american-vintage-65-jaguar@2x.jpg',
            created: now
        },
        {
            id: 24,
            productId: 1,
            url: 'https://www.fmicassets.com/Damroot/ThumbnailJpg/10001/0110160857_gtr_frt_001_rr.jpg',
            created: now
        },
        {
            id: 25,
            productId: 1,
            url: 'https://www.fmicassets.com/Damroot/ThumbnailJpg/10001/0110160857_gtr_cntbdyright_001_nr.jpg',
            created: now
        }
    ];

    class MockProduct extends Product {

        constructor(dbRow){
            super(dbRow);
            this.db = class MockDatabase extends Database {
                static query(query, params, callback) {
                    setTimeout(() => {
                        switch(params[0]) {
                            case Category.getTable():
                                callback(null, mockCategoriesResults);
                                break;
                            case Manufacturer.getTable():
                                callback(null, mockManufacturerResults);
                                break;
                            case ProductImage.getTable():
                                callback(null, mockProductImageResults);
                                break;
                        }
                    }, 22);
                }
            };
        }

    }

    it('Should instanciate a Product instance from a database row', () => {

        let product = new MockProduct(mockProductResults[0]);

        assert.strictEqual(product.id, 1);
        assert.strictEqual(product.name, 'Fender Jaguar - Used - Good Condition');
        assert.strictEqual(product.price, 749.99);
        assert.strictEqual(product.quantity, 1);
        assert.strictEqual(product.sellerId, 88);
        assert.strictEqual(product.manufacturerId, 77);
        assert.strictEqual(product.description, 'A 1996 Fender Jaguar with some scratches but all electronics are good and the neck is straight.');
        assert.strictEqual(product.created, now);
    });

    it('Should contain category information', (done) => {

        let product = new MockProduct(mockProductResults[0]);
        let sql = product.getCategories((err, categories) => {
            if(err) {
                console.error(err);
                done(err);
            }

            assert.strictEqual(categories.length, 2);
            assert.strictEqual(categories[0] instanceof Category, true);
            assert.strictEqual(categories[0].id, 55);
            assert.strictEqual(categories[0].name, 'Musical Instruments');
            done();
        });

        assert.strictEqual(sql, 'select * from `Categories` c where c.id in (select categoryId from `ProductsCategories` where productId = 1)');
    });

    it('Should contain manufacturer information', (done) => {

        let product = new MockProduct(mockProductResults[0]);

        let sql = product.getManufacturer((err, manufacturer) => {
            if(err) {
                console.error(err);
                done(err);
            }

            assert.strictEqual(manufacturer instanceof Manufacturer, true);
            assert.strictEqual(manufacturer.id, 77);
            assert.strictEqual(manufacturer.name, 'Fender');
            done();
        });

        assert.strictEqual(sql, 'select * from `Manufacturers` where id = 77');
    });

    it('Should contain a list of images', (done) => {

        let product = new MockProduct(mockProductResults[0]);

        let sql = product.getImages((err, images) => {
            if(err) {
                console.error(err);
                done(err);
            }

            assert.strictEqual(images.length, 3);
            assert.strictEqual(images[0] instanceof ProductImage, true);
            assert.strictEqual(images[0].id, 23);
            assert.strictEqual(images[0].url, 'https://stuff.fendergarage.com/images/g/k/E/fcwm-products-electric-guitars-jaguar-01-hero-american-vintage-65-jaguar@2x.jpg');
            assert.strictEqual(images[1].id, 24);
            assert.strictEqual(images[1].url, 'https://www.fmicassets.com/Damroot/ThumbnailJpg/10001/0110160857_gtr_frt_001_rr.jpg');
            assert.strictEqual(images[2].id, 25);
            assert.strictEqual(images[2].url, 'https://www.fmicassets.com/Damroot/ThumbnailJpg/10001/0110160857_gtr_cntbdyright_001_nr.jpg');
            done();
        });

        assert.strictEqual(sql, 'select * from `ProductsImages` where productId = 1');
    });

    it('Should return a full composite of all data for the product', (done) => {

        let expected = {
            id: 1,
            name: 'Fender Jaguar - Used - Good Condition',
            price: 749.99,
            quantity: 1,
            sellerId: 88,
            manufacturerId: 77,
            description: 'A 1996 Fender Jaguar with some scratches but all electronics are good and the neck is straight.',
            created: now,
            categories: [
                {
                    id: 55,
                    name: 'Musical Instruments',
                    created: now
                },
                {
                    id: 56,
                    name: 'Guitars',
                    created: now
                }
            ],
            manufacturer: {
                id: 77,
                name: 'Fender',
                created: now
            },
            images: [
                {
                    id: 23,
                    productId: 1,
                    url: 'https://stuff.fendergarage.com/images/g/k/E/fcwm-products-electric-guitars-jaguar-01-hero-american-vintage-65-jaguar@2x.jpg',
                    created: now
                },
                {
                    id: 24,
                    productId: 1,
                    url: 'https://www.fmicassets.com/Damroot/ThumbnailJpg/10001/0110160857_gtr_frt_001_rr.jpg',
                    created: now
                },
                {
                    id: 25,
                    productId: 1,
                    url: 'https://www.fmicassets.com/Damroot/ThumbnailJpg/10001/0110160857_gtr_cntbdyright_001_nr.jpg',
                    created: now
                }
            ]
        };

        let product = new MockProduct(mockProductResults[0]);

        product.getCompleteObject((err, json) => {
            if(err) {
                console.error(err);
                done(err);
            }

            assert.deepStrictEqual(json, expected);

            done();
        });
    });

});