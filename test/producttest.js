const assert = require('assert');
const Product = require('../src/models/product');

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

    it('Should instanciate a Product instance from a database row', () => {

        let product = new Product(mockProductResults[0]);

        assert.strictEqual(product.id, 1);
        assert.strictEqual(product.name, 'Fender Jaguar - Used - Good Condition');
        assert.strictEqual(product.price, 749.99);
        assert.strictEqual(product.quantity, 1);
        assert.strictEqual(product.sellerId, 88);
        assert.strictEqual(product.manufacturerId, 77);
        assert.strictEqual(product.description, 'A 1996 Fender Jaguar with some scratches but all electronics are good and the neck is straight.');
        assert.strictEqual(product.created, now);
    });

});